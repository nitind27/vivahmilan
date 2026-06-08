'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import BlogContent from '@/components/BlogContent';
import SmartImage from '@/components/SmartImage';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!post) return;
    document.title = `${post.metaTitle || post.title} | Vivah Dwar`;
  }, [post]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/blog/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then(setPost)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const tags = post?.tags ? post.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-vd-bg flex flex-col">
      <Navbar />

      <div className="flex-1 pt-20 pb-12">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-vd-text-sub hover:text-vd-primary mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>

          {loading ? (
            <div className="space-y-4">
              <div className="h-8 skeleton rounded-xl w-3/4" />
              <div className="h-4 skeleton rounded w-1/2" />
              <div className="aspect-video skeleton rounded-3xl" />
              <div className="h-32 skeleton rounded-2xl" />
            </div>
          ) : error || !post ? (
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold text-vd-text-heading mb-2">Article not found</h1>
              <p className="text-vd-text-sub mb-6">This post may have been removed or is not published yet.</p>
              <Link href="/blog" className="text-vd-primary font-semibold hover:underline">View all articles</Link>
            </div>
          ) : (
            <article>
              <header className="mb-8">
                <span className="inline-block text-xs font-semibold text-vd-primary uppercase tracking-wider mb-3">
                  {post.category}
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-vd-text-heading leading-tight mb-4">
                  {post.title}
                </h1>
                <p className="text-lg text-vd-text-sub leading-relaxed mb-4">{post.excerpt}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-vd-text-light">
                  <span className="flex items-center gap-1.5"><User className="w-4 h-4" />{post.authorName}</span>
                  {post.publishedAt && (
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatDate(post.publishedAt)}</span>
                  )}
                </div>
              </header>

              {post.coverImageUrl && (
                <div className="relative aspect-[16/9] rounded-3xl overflow-hidden border border-vd-border mb-8 shadow-sm">
                  <SmartImage src={post.coverImageUrl} alt={post.title} fill className="object-cover" priority />
                </div>
              )}

              <div className="bg-vd-bg-section rounded-3xl border border-vd-border p-6 sm:p-10 shadow-sm">
                <BlogContent content={post.content} />
              </div>

              {tags.length > 0 && (
                <div className="mt-8 flex flex-wrap items-center gap-2">
                  <Tag className="w-4 h-4 text-vd-text-light" />
                  {tags.map((t) => (
                    <span key={t} className="px-3 py-1 rounded-full text-xs font-medium bg-vd-accent-soft text-vd-primary border border-vd-border">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-10 p-6 rounded-2xl vd-gradient-gold text-white text-center">
                <p className="font-semibold mb-3">Ready to find your life partner?</p>
                <Link href="/register" className="inline-block bg-white text-vd-primary px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90">
                  Create Free Profile
                </Link>
              </div>
            </article>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
