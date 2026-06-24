'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import BlogContent from '@/components/BlogContent';
import SmartImage from '@/components/SmartImage';
import BlogCtaBanner from '@/components/BlogCtaBanner';
import BlogFaqSection from '@/components/BlogFaqSection';
import { ArrowLeft, Calendar, User, Tag, Clock, Share2, BookOpen } from 'lucide-react';

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function readingTime(text) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
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
  const readMins = post ? readingTime(post.content) : 0;

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: post?.title, url });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="min-h-screen bg-vd-bg flex flex-col">
      <Navbar />

      {/* Hero */}
      <div className="relative pt-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07] dark:opacity-[0.12]"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 30%, #C8A45C 0%, transparent 45%), radial-gradient(circle at 80% 70%, #B76E79 0%, transparent 40%)',
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 py-10 sm:py-14">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-vd-text-sub hover:text-vd-primary mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Blog
          </Link>

          {loading ? (
            <div className="space-y-4">
              <div className="h-6 skeleton rounded-lg w-24" />
              <div className="h-10 skeleton rounded-xl w-full max-w-2xl" />
              <div className="h-5 skeleton rounded w-2/3" />
            </div>
          ) : error || !post ? null : (
            <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-vd-accent-soft text-vd-primary border border-vd-primary/20 mb-4">
                <BookOpen className="w-3.5 h-3.5" />
                {post.category}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black text-vd-text-heading leading-[1.15] mb-4">
                {post.title}
              </h1>
              <p className="text-lg sm:text-xl text-vd-text-sub leading-relaxed max-w-3xl mb-6">{post.excerpt}</p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-vd-text-light">
                <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-vd-primary/70" />{post.authorName}</span>
                {post.publishedAt && (
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-vd-primary/70" />{formatDate(post.publishedAt)}</span>
                )}
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-vd-primary/70" />{readMins} min read</span>
                <button type="button" onClick={share} className="flex items-center gap-1.5 hover:text-vd-primary transition-colors">
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </motion.header>
          )}
        </div>
      </div>

      <div className="flex-1 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          {loading ? (
            <div className="space-y-4 -mt-2">
              <div className="aspect-[21/9] skeleton rounded-3xl" />
              <div className="h-48 skeleton rounded-3xl" />
            </div>
          ) : error || !post ? (
            <div className="text-center py-20 rounded-3xl border border-dashed border-vd-border bg-vd-bg-section/50">
              <BookOpen className="w-14 h-14 text-vd-text-light mx-auto mb-4 opacity-40" />
              <h1 className="text-2xl font-bold text-vd-text-heading mb-2">Article not found</h1>
              <p className="text-vd-text-sub mb-6">This post may have been removed or is not published yet.</p>
              <Link href="/blog" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl vd-gradient-gold text-white text-sm font-semibold">
                View all articles
              </Link>
            </div>
          ) : (
            <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              {post.coverImageUrl && (
                <div className="relative aspect-[21/9] rounded-3xl overflow-hidden border border-vd-border mb-10 shadow-xl shadow-vd-primary/5">
                  <SmartImage src={post.coverImageUrl} alt={post.title} fill className="object-cover" priority />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                </div>
              )}

              <div className="relative">
                <div className="absolute -left-3 sm:-left-6 top-8 bottom-8 w-1 rounded-full vd-gradient-gold opacity-60 hidden sm:block" />
                <div className="bg-vd-bg-section rounded-3xl border border-vd-border p-6 sm:p-10 lg:p-12 shadow-sm">
                  <BlogContent content={post.content} />
                </div>
              </div>

              {tags.length > 0 && (
                <div className="mt-8 flex flex-wrap items-center gap-2">
                  <Tag className="w-4 h-4 text-vd-text-light" />
                  {tags.map((t) => (
                    <span key={t} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-vd-accent-soft/80 text-vd-primary border border-vd-border">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              <BlogCtaBanner className="mt-10" />

              {post.faqs?.length > 0 && (
                <BlogFaqSection
                  items={post.faqs}
                  title="Questions about this article"
                  subtitle="Answers specific to this topic"
                />
              )}
            </motion.article>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
