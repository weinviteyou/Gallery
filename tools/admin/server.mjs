#!/usr/bin/env node
/**
 * Local-only admin for the artwork manifest.
 *
 * Bound to 127.0.0.1 so it is never reachable from another machine. It is a
 * development tool: nothing in tools/ is ever included in the built site.
 *
 *   npm run admin   ->   http://localhost:4322
 */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HOST = '127.0.0.1';
const PORT = Number(process.env.ADMIN_PORT ?? 4322);

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const ART_DIR = path.join(root, 'src', 'assets', 'art');
const MANIFEST = path.join(root, 'src', 'data', 'artworks.json');
const ADMIN_HTML = path.join(here, 'admin.html');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

const FIELDS = [
  'id',
  'file',
  'title',
  'category',
  'year',
  'medium',
  'dimensions',
  'description',
  'visible',
  'featured',
  'order',
];

function titleFromFilename(filename) {
  return path
    .basename(filename, path.extname(filename))
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function readManifest() {
  try {
    const raw = await fs.readFile(MANIFEST, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

/** Write via temp file + rename so a crash cannot leave a half-written manifest. */
async function writeManifest(list) {
  const clean = list.map((item, index) => ({
    id: String(item.id || crypto.randomBytes(4).toString('hex')),
    file: String(item.file ?? ''),
    title: String(item.title ?? ''),
    category: item.category === 'photograph' ? 'photograph' : 'painting',
    year: String(item.year ?? ''),
    medium: String(item.medium ?? ''),
    dimensions: String(item.dimensions ?? ''),
    description: String(item.description ?? ''),
    visible: Boolean(item.visible),
    featured: Boolean(item.featured),
    order: index + 1,
  }));

  await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
  const temp = `${MANIFEST}.tmp`;
  await fs.writeFile(temp, `${JSON.stringify(clean, null, 2)}\n`, 'utf8');
  await fs.rename(temp, MANIFEST);
  return clean;
}

async function listImageFiles() {
  try {
    const entries = await fs.readdir(ART_DIR, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && IMAGE_EXT.has(path.extname(e.name).toLowerCase()))
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

/**
 * Add manifest entries for images on disk that are not yet listed.
 * New entries default to hidden so nothing publishes by accident.
 */
async function scan() {
  const manifest = await readManifest();
  const known = new Set(manifest.map((a) => a.file));
  const files = await listImageFiles();

  let added = 0;
  for (const file of files) {
    if (known.has(file)) continue;
    manifest.push({
      id: crypto.randomBytes(4).toString('hex'),
      file,
      title: titleFromFilename(file),
      category: 'painting',
      year: '',
      medium: '',
      dimensions: '',
      description: '',
      visible: false,
      featured: false,
      order: manifest.length + 1,
    });
    added += 1;
  }

  const onDisk = new Set(files);
  const missing = manifest.filter((a) => !onDisk.has(a.file)).map((a) => a.file);

  const saved = await writeManifest(manifest);
  return { artworks: saved, added, missing };
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}

function sendJson(res, status, data) {
  send(res, status, JSON.stringify(data), { 'Content-Type': 'application/json' });
}

function readBody(req, limitBytes = 64 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/** Keep uploads and thumbnail reads inside src/assets/art/. */
function safeArtPath(name) {
  const base = path.basename(String(name));
  const resolved = path.resolve(ART_DIR, base);
  if (path.dirname(resolved) !== path.resolve(ART_DIR)) return null;
  if (!IMAGE_EXT.has(path.extname(base).toLowerCase())) return null;
  return resolved;
}

async function uniqueArtPath(name) {
  const target = safeArtPath(name);
  if (!target) return null;
  const ext = path.extname(target);
  const stem = target.slice(0, -ext.length);
  let candidate = target;
  let n = 2;
  for (;;) {
    try {
      await fs.access(candidate);
      candidate = `${stem}-${n}${ext}`;
      n += 1;
    } catch {
      return candidate;
    }
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const { pathname } = url;

  try {
    if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
      const html = await fs.readFile(ADMIN_HTML);
      return send(res, 200, html, { 'Content-Type': 'text/html; charset=utf-8' });
    }

    if (req.method === 'GET' && pathname === '/api/artworks') {
      return sendJson(res, 200, { artworks: await readManifest() });
    }

    if (req.method === 'POST' && pathname === '/api/artworks') {
      const body = JSON.parse((await readBody(req)).toString('utf8'));
      if (!Array.isArray(body.artworks)) {
        return sendJson(res, 400, { error: 'Expected { artworks: [] }' });
      }
      const saved = await writeManifest(
        body.artworks.map((a) => Object.fromEntries(FIELDS.map((f) => [f, a[f]])))
      );
      return sendJson(res, 200, { artworks: saved });
    }

    if (req.method === 'POST' && pathname === '/api/scan') {
      return sendJson(res, 200, await scan());
    }

    if (req.method === 'POST' && pathname === '/api/upload') {
      const name = url.searchParams.get('name');
      const target = await uniqueArtPath(name);
      if (!target) return sendJson(res, 400, { error: 'Unsupported filename' });
      await fs.mkdir(ART_DIR, { recursive: true });
      await fs.writeFile(target, await readBody(req));
      return sendJson(res, 200, { file: path.basename(target) });
    }

    // Thumbnails for the admin list, served straight from the source folder.
    if (req.method === 'GET' && pathname.startsWith('/art/')) {
      const target = safeArtPath(decodeURIComponent(pathname.slice('/art/'.length)));
      if (!target) return send(res, 404, 'Not found');
      const file = await fs.readFile(target);
      return send(res, 200, file, {
        'Content-Type': MIME[path.extname(target).toLowerCase()] ?? 'application/octet-stream',
      });
    }

    return send(res, 404, 'Not found');
  } catch (error) {
    if (error.code === 'ENOENT') return send(res, 404, 'Not found');
    console.error(error);
    return sendJson(res, 500, { error: error.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Gallery admin running at http://localhost:${PORT}`);
  console.log(`  Images:   ${path.relative(root, ART_DIR)}`);
  console.log(`  Manifest: ${path.relative(root, MANIFEST)}`);
  console.log('  Press Ctrl+C to stop.\n');
});
