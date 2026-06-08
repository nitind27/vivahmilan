import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureBlogTable } from '@/lib/blog';

export const revalidate = 60;

export async function GET(req, { params }) {
  await ensureBlogTable();
  const slug = (await params)?.slug;
  if (!slug) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const post = await prisma.blogPost.findFirst({
    where: { slug, isPublished: 1 },
  });

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  return NextResponse.json({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    coverImageUrl: post.coverImageUrl,
    category: post.category,
    tags: post.tags,
    authorName: post.authorName,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    isFeatured: !!post.isFeatured,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  });
}
