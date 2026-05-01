import path from 'path';
import fs from 'fs/promises';
import { nanoid } from 'nanoid';

// ─── Paths ────────────────────────────────────────────────────────────────────

const UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads');
const ORIGINALS_DIR = path.join(UPLOADS_ROOT, 'originals');
const RESULTS_DIR = path.join(UPLOADS_ROOT, 'results');

/**
 * Ensure upload directories exist (called on first use, safe to call multiple times).
 */
async function ensureDirs() {
  await fs.mkdir(ORIGINALS_DIR, { recursive: true });
  await fs.mkdir(RESULTS_DIR, { recursive: true });
}

// ─── Filename Generator ───────────────────────────────────────────────────────

function makeFilename(): string {
  const timestamp = Date.now();
  const id = nanoid(10);
  return `${timestamp}_${id}.jpg`;
}

// ─── Save Functions ───────────────────────────────────────────────────────────

/**
 * Save a raw image buffer as the original uploaded photo.
 * Returns the relative public URL path (e.g. /uploads/originals/xxx.jpg).
 */
export async function saveOriginal(buffer: Buffer): Promise<string> {
  await ensureDirs();
  const filename = makeFilename();
  const filePath = path.join(ORIGINALS_DIR, filename);
  await fs.writeFile(filePath, buffer);
  return `/uploads/originals/${filename}`;
}

/**
 * Save a processed result image buffer.
 * Returns the relative public URL path (e.g. /uploads/results/xxx.jpg).
 */
export async function saveResult(buffer: Buffer): Promise<string> {
  await ensureDirs();
  const filename = makeFilename();
  const filePath = path.join(RESULTS_DIR, filename);
  await fs.writeFile(filePath, buffer);
  return `/uploads/results/${filename}`;
}

/**
 * Convert a public-relative URL path to an absolute filesystem path.
 */
export function publicPathToAbsolute(publicPath: string): string {
  return path.join(process.cwd(), 'public', publicPath);
}

/**
 * Read a file from its absolute filesystem path and return it as a Buffer.
 */
export async function readFile(absolutePath: string): Promise<Buffer> {
  return fs.readFile(absolutePath);
}
