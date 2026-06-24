import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ensureBlogTable } from '@/lib/blog';
import { getAdminFaqsForBlogPost } from '@/lib/faq';
import prisma from '@/lib/prisma';

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await ensureBlogTable();
  const id = (await params)?.id;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const faqs = await getAdminFaqsForBlogPost(id);
  return NextResponse.json({
    ...post,
    isPublished: !!post.isPublished,
    isFeatured: !!post.isFeatured,
    faqs,
  });
}
