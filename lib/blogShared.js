/** Client-safe blog helpers (no database imports). */

export const BLOG_CATEGORIES = [
  'Matrimony Tips',
  'Wedding Planning',
  'Relationship Advice',
  'Culture & Traditions',
  'Platform Updates',
  'General',
];

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

export function formatBlogPost(row) {
  if (!row) return null;
  return {
    ...row,
    isPublished: !!row.isPublished,
    isFeatured: !!row.isFeatured,
  };
}
