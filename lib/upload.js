import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Base upload directory inside public/ so files are served directly
const UPLOAD_BASE = path.join(process.cwd(), 'public', 'uploads');

/**
 * Save a file to disk and return the public URL path
 * @param {File} file - Web API File object from formData
 * @param {'photos'|'documents'|'chat'} type - upload category
 * @param {string} userId - user id for folder isolation
 * @returns {{ url: string, filename: string }}
 */
export async function saveFile(file, type, userId) {
  const allowedTypes = ['photos', 'documents', 'chat'];
  if (!allowedTypes.includes(type)) throw new Error('Invalid upload type');

  // Build folder: public/uploads/{type}/{userId}/
  const folder = path.join(UPLOAD_BASE, type, userId);
  await mkdir(folder, { recursive: true });

  // Unique filename: timestamp + original extension
  const ext = path.extname(file.name) || guessExt(file.type);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filepath = path.join(folder, filename);

  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));

  // Return public URL path
  const url = `/uploads/${type}/${userId}/${filename}`;
  return { url, filename };
}

/**
 * Delete a file from disk given its public URL path
 * @param {string} url - e.g. /uploads/photos/userId/file.jpg
 */
export async function deleteFile(url) {
  if (!url || url.startsWith('data:') || url.startsWith('http')) return;
  try {
    const { unlink } = await import('fs/promises');
    const filepath = path.join(process.cwd(), 'public', url);
    await unlink(filepath);
  } catch {
    // File may not exist, ignore
  }
}

function guessExt(mimeType) {
  const map = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'application/pdf': '.pdf',
  };
  return map[mimeType] || '.bin';
}
