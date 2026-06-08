import { execute } from '@/lib/db';

export const BLOG_CATEGORIES = [
  'Matrimony Tips',
  'Wedding Planning',
  'Relationship Advice',
  'Culture & Traditions',
  'Platform Updates',
  'General',
];

let tableReady = false;

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'post';
}

export async function ensureBlogTable() {
  if (tableReady) return;
  await execute(`
    CREATE TABLE IF NOT EXISTS blogpost (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(191) NOT NULL,
      excerpt TEXT NOT NULL,
      content LONGTEXT NOT NULL,
      coverImageUrl TEXT NULL,
      category VARCHAR(100) NOT NULL DEFAULT 'General',
      tags VARCHAR(500) NULL,
      authorName VARCHAR(191) NOT NULL DEFAULT 'Vivah Dwar Team',
      metaTitle VARCHAR(255) NULL,
      metaDescription VARCHAR(500) NULL,
      isPublished TINYINT(1) NOT NULL DEFAULT 0,
      isFeatured TINYINT(1) NOT NULL DEFAULT 0,
      sortOrder INT NOT NULL DEFAULT 0,
      publishedAt DATETIME(3) NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      UNIQUE KEY blogpost_slug_key (slug),
      KEY blogpost_published_idx (isPublished, publishedAt),
      KEY blogpost_category_idx (category),
      KEY blogpost_featured_idx (isFeatured, sortOrder)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  tableReady = true;
}

export function formatBlogPost(row) {
  if (!row) return null;
  return {
    ...row,
    isPublished: !!row.isPublished,
    isFeatured: !!row.isFeatured,
  };
}
