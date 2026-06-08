import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureBlogTable } from '@/lib/blog';

export const revalidate = 60;

export async function GET(req) {
  await ensureBlogTable();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const featured = searchParams.get('featured') === '1';

  const where = { isPublished: 1 };
  if (category) where.category = category;
  if (featured) where.isFeatured = 1;

  const posts = await prisma.blogPost.findMany({
    where,
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { publishedAt: 'desc' }],
    take: featured ? 3 : 50,
  });

  const publicPosts = posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    coverImageUrl: p.coverImageUrl,
    category: p.category,
    tags: p.tags,
    authorName: p.authorName,
    isFeatured: !!p.isFeatured,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
  }));

  return NextResponse.json(publicPosts);
}
