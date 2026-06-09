'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import SmartImage from '@/components/SmartImage';
import BlogFaqSection from '@/components/BlogFaqSection';
import {
  BookOpen, Calendar, User, Star, Tag, LayoutGrid, ChevronRight,
} from 'lucide-react';

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/blog').then((r) => r.json()),
      fetch('/api/blog?featured=1').then((r) => r.json()),
      fetch('/api/faq?blog=1').then((r) => r.json()),
    ])
      .then(([all, feat, faqList]) => {
        setPosts(Array.isArray(all) ? all : []);
        setFeatured(Array.isArray(feat) ? feat : []);
        setFaqs(Array.isArray(faqList) ? faqList : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const map = new Map();
    posts.forEach((p) => {
      if (p.category) map.set(p.category, (map.get(p.category) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [posts]);

  const filtered = category ? posts.filter((p) => p.category === category) : posts;
  const featuredIds = new Set(featured.map((f) => f.id));
  const latestPosts = filtered.filter((p) => category || !featuredIds.has(p.id));

  return (
    <div className="min-h-screen bg-vd-bg flex flex-col">
      <Navbar />

      <div
        className="pt-24 pb-12 px-4"
        style={{ background: 'linear-gradient(135deg, #7A5A2E 0%, #A67C3D 40%, #C8A45C 75%, #D4AF37 100%)' }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <BookOpen className="w-10 h-10 text-white mx-auto mb-3 opacity-90" />
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Vivah Dwar Blog</h1>
          <p className="text-white/90 text-sm max-w-lg mx-auto">
            Matrimony tips, wedding advice, and relationship insights for your journey to find the right life partner.
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-10 sm:py-12">
        <div className="lg:grid lg:grid-cols-[minmax(220px,260px)_1fr] gap-8 xl:gap-10 items-start">

          {/* Desktop sidebar — categories */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <LayoutGrid className="w-4 h-4 text-vd-primary" />
                  <h2 className="text-sm font-bold text-vd-text-heading">Categories</h2>
                </div>
                <nav className="space-y-0.5">
                  <CategoryLink
                    label="All Articles"
                    count={posts.length}
                    active={!category}
                    onClick={() => setCategory('')}
                  />
                  {categories.map(([name, count]) => (
                    <CategoryLink
                      key={name}
                      label={name}
                      count={count}
                      active={category === name}
                      onClick={() => setCategory(name)}
                    />
                  ))}
                </nav>
              </div>

              <div className="rounded-2xl border border-vd-border bg-vd-accent-soft/40 dark:bg-vd-accent/10 p-4 text-center">
                <p className="text-xs text-vd-text-sub mb-2">{posts.length} articles published</p>
                <Link href="/register" className="text-xs font-semibold text-vd-primary hover:underline inline-flex items-center gap-1">
                  Join Vivah Dwar <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0">
            {/* Mobile category pills */}
            {categories.length > 0 && (
              <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide -mx-1 px-1">
                <MobileCategoryPill label="All" active={!category} onClick={() => setCategory('')} />
                {categories.map(([name]) => (
                  <MobileCategoryPill
                    key={name}
                    label={name}
                    active={category === name}
                    onClick={() => setCategory(name)}
                  />
                ))}
              </div>
            )}

            {category && (
              <div className="mb-6 flex items-center gap-2">
                <Tag className="w-4 h-4 text-vd-primary" />
                <h2 className="text-lg font-bold text-vd-text-heading">{category}</h2>
                <span className="text-sm text-vd-text-light">({filtered.length})</span>
              </div>
            )}

            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-80 skeleton rounded-2xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 rounded-3xl border border-dashed border-vd-border">
                <BookOpen className="w-12 h-12 text-vd-text-light mx-auto mb-4" />
                <p className="text-vd-text-sub">No articles in this category yet.</p>
                {category && (
                  <button type="button" onClick={() => setCategory('')} className="mt-3 text-sm text-vd-primary font-semibold hover:underline">
                    View all articles
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-10">
                {!category && featured.length > 0 && (
                  <section>
                    <h2 className="text-base font-bold text-vd-text-heading mb-4 flex items-center gap-2">
                      <Star className="w-4 h-4 text-vd-primary fill-vd-primary/30" /> Featured Articles
                    </h2>
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {featured.map((post) => (
                        <BlogCard key={post.id} post={post} featured />
                      ))}
                    </div>
                  </section>
                )}

                {latestPosts.length > 0 && (
                  <section>
                    {!category && featured.length > 0 && (
                      <h2 className="text-base font-bold text-vd-text-heading mb-4">Latest Articles</h2>
                    )}
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {latestPosts.map((post) => (
                        <BlogCard key={post.id} post={post} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </main>
        </div>

        <BlogFaqSection items={faqs} />
      </div>

      <SiteFooter />
    </div>
  );
}

function CategoryLink({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
        active
          ? 'bg-vd-primary/12 text-vd-primary font-semibold border-l-2 border-vd-primary pl-[10px]'
          : 'text-vd-text-sub hover:bg-vd-bg-alt hover:text-vd-text-heading border-l-2 border-transparent'
      }`}
    >
      <span className="truncate">{label}</span>
      <span className={`text-xs shrink-0 tabular-nums ${active ? 'text-vd-primary' : 'text-vd-text-light'}`}>{count}</span>
    </button>
  );
}

function MobileCategoryPill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
        active
          ? 'vd-gradient-gold text-white shadow-sm'
          : 'bg-vd-bg-section border border-vd-border text-vd-text-sub'
      }`}
    >
      {label}
    </button>
  );
}

function BlogCard({ post, featured = false }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col h-full bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl border border-vd-border overflow-hidden shadow-sm hover:shadow-lg hover:border-vd-primary/35 hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="aspect-[16/10] bg-vd-bg-alt relative overflow-hidden shrink-0">
        {post.coverImageUrl ? (
          <SmartImage
            src={post.coverImageUrl}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(200,164,92,0.15), rgba(229,200,139,0.25))' }}>
            <BookOpen className="w-10 h-10 text-vd-primary/35" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-white/95 text-vd-primary shadow-sm">
          {post.category}
        </span>
        {featured && (
          <span className="absolute top-3 right-3 px-2 py-1 rounded-lg text-[11px] font-semibold bg-vd-primary text-white flex items-center gap-1 shadow-sm">
            <Star className="w-3 h-3 fill-current" /> Featured
          </span>
        )}
      </div>
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <h3 className="text-base font-bold text-vd-text-heading mb-2 group-hover:text-vd-primary transition-colors line-clamp-2 leading-snug">
          {post.title}
        </h3>
        <p className="text-sm text-vd-text-sub line-clamp-2 leading-relaxed flex-1">{post.excerpt}</p>
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-vd-border text-xs text-vd-text-light">
          <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{post.authorName}</span>
          {post.publishedAt && (
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(post.publishedAt)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
