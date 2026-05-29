import { v2 as cloudinary } from 'cloudinary';
import path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Save a file to Cloudinary and return the public URL path
 * @param {File} file - Web API File object from formData
 * @param {'photos'|'documents'|'chat'} type - upload category
 * @param {string} userId - user id for folder isolation
 * @returns {Promise<{ url: string, filename: string }>}
 */
export async function saveFile(file, type, userId) {
  const allowedTypes = ['photos', 'documents', 'chat', 'videos'];
  if (!allowedTypes.includes(type)) throw new Error('Invalid upload type');

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    // Local storage fallback for IPv6-only environments where Cloudinary (IPv4) fails
    const { randomUUID } = await import('crypto');
    const { promises: fs } = await import('fs');
    
    const ext = guessExt(file.type) || '.bin';
    const filename = `${userId}_${randomUUID()}${ext}`;
    const dirPath = path.join(process.cwd(), 'public', 'uploads', type);
    
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(path.join(dirPath, filename), buffer);
    
    return { url: `/uploads/${type}/${filename}`, filename };
  } catch (err) {
    console.error("Local upload error:", err);
    throw err;
  }
}

/**
 * Delete a file from Cloudinary (or local disk if legacy) given its URL
 * @param {string} url - e.g. https://res.cloudinary.com/... or /uploads/...
 */
export async function deleteFile(url) {
  if (!url || url.startsWith('data:')) return;
  
  if (url.startsWith('/uploads')) {
    // Legacy local file deletion
    try {
      const { unlink } = await import('fs/promises');
      const filepath = path.join(process.cwd(), 'public', url);
      await unlink(filepath);
    } catch {
      // ignore if file doesn't exist
    }
    return;
  }
  
  if (url.includes('cloudinary.com')) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      let uploadIndex = pathParts.indexOf('upload');
      
      if (uploadIndex !== -1) {
        let afterUpload = pathParts.slice(uploadIndex + 1);
        if (afterUpload[0].match(/^v\d+$/)) {
          afterUpload.shift();
        }
        let publicIdWithExt = afterUpload.join('/');
        let publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.')) || publicIdWithExt;
        
        // determine resource_type from url, defaults to image
        const resourceType = pathParts[uploadIndex - 1] === 'raw' ? 'raw' : 
                             pathParts[uploadIndex - 1] === 'video' ? 'video' : 'image';
                             
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      }
    } catch (err) {
      console.error('Cloudinary delete error:', err);
    }
  }
}

export function guessExt(mimeType) {
  const map = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'application/pdf': '.pdf',
  };
  return map[mimeType] || '.bin';
}
