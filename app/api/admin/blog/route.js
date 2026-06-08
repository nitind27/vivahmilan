import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { ensureBlogTable, slugify } from '@/lib/blog';
import { queryOne } from '@/lib/db';

async function uniqueSlug(base, excludeId) {
  let slug = slugify(base);
  let n = 0;
  while (true) {
    const candidate = n ? `${slug}-${n}` : slug;
    const existing = await queryOne(
      'SELECT id FROM blogpost WHERE slug = ? AND id != ? LIMIT 1',
      [candidate, excludeId || '']
    );
    if (!existing) return candidate;
    n += 1;
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await ensureBlogTable();
  const posts = await prisma.blogPost.findMany({
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json(posts.map((p) => ({ ...p, isPublished: !!p.isPublished, isFeatured: !!p.isFeatured })));
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await ensureBlogTable();
  const body = await req.json();
  const {
    id,
    title,
    slug,
    excerpt,
    content,
    coverImageUrl,
    category,
    tags,
    authorName,
    metaTitle,
    metaDescription,
    isPublished,
    isFeatured,
    sortOrder,
    publishedAt,
  } = body;

  const data = {
    title: title?.trim(),
    excerpt: excerpt?.trim(),
    content: content?.trim(),
    coverImageUrl: coverImageUrl?.trim() || null,
    category: category || 'General',
    tags: tags?.trim() || null,
    authorName: authorName?.trim() || 'Vivah Dwar Team',
    metaTitle: metaTitle?.trim() || null,
    metaDescription: metaDescription?.trim() || null,
    isPublished: isPublished ? 1 : 0,
    isFeatured: isFeatured ? 1 : 0,
    sortOrder: Number(sortOrder) || 0,
    publishedAt: isPublished ? (publishedAt ? new Date(publishedAt) : new Date()) : null,
  };

  if (!data.title || !data.excerpt || !data.content)
    return NextResponse.json({ error: 'title, excerpt and content are required' }, { status: 400 });

  if (id) {
    const finalSlug = await uniqueSlug(slug || data.title, id);
    const updated = await prisma.blogPost.update({
      where: { id },
      data: { ...data, slug: finalSlug },
    });
    return NextResponse.json({ ...updated, isPublished: !!updated.isPublished, isFeatured: !!updated.isFeatured });
  }

  const finalSlug = await uniqueSlug(slug || data.title, null);
  const created = await prisma.blogPost.create({
    data: { ...data, slug: finalSlug },
  });
  return NextResponse.json(
    { ...created, isPublished: !!created.isPublished, isFeatured: !!created.isFeatured },
    { status: 201 }
  );
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await ensureBlogTable();
  await prisma.blogPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
