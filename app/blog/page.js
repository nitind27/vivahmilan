'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import SmartImage from '@/components/SmartImage';
import BlogFaqSection from '@/components/BlogFaqSection';
import {
  BookOpen, Calendar, User, Star, Tag, LayoutGrid, ChevronRight, Sparkles, ArrowRight, PenLine,
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
  const heroPost = !category && featured[0] ? featured[0] : null;
  const gridPosts = filtered.filter((p) => !heroPost || p.id !== heroPost.id);

  return (
    <div className="min-h-screen bg-vd-bg flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-16 sm:pb-20 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(145deg, #5C4522 0%, #8B6914 35%, #C8A45C 70%, #E8D5A8 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/95 text-xs font-semibold uppercase tracking-widest mb-5 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" /> Vivah Dwar Insights
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight">
              Wedding &amp; Matrimony Blog
            </h1>
            <p className="text-white/90 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Expert tips, relationship advice, and cultural insights to help you find your perfect life partner with confidence.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-white/80 text-sm">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                <PenLine className="w-4 h-4" /> {posts.length} articles
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                <BookOpen className="w-4 h-4" /> {categories.length} topics
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 -mt-8 sm:-mt-10 relative z-10 pb-16">
        <div className="lg:grid lg:grid-cols-[minmax(240px,280px)_1fr] gap-8 xl:gap-12 items-start">

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card p-5 shadow-lg shadow-black/5">
                <div className="flex items-center gap-2 mb-4">
                  <LayoutGrid className="w-4 h-4 text-vd-primary" />
                  <h2 className="text-sm font-bold text-vd-text-heading">Browse Topics</h2>
                </div>
                <nav className="space-y-1">
                  <CategoryLink label="All Articles" count={posts.length} active={!category} onClick={() => setCategory('')} />
                  {categories.map(([name, count]) => (
                    <CategoryLink key={name} label={name} count={count} active={category === name} onClick={() => setCategory(name)} />
                  ))}
                </nav>
              </div>

              <div className="rounded-2xl overflow-hidden border border-vd-border shadow-lg">
                <div className="vd-gradient-gold p-5 text-center text-white">
                  <p className="font-bold text-lg mb-1">Find your match</p>
                  <p className="text-white/85 text-xs mb-4">Join verified members on India&apos;s trusted matrimony platform</p>
                  <Link href="/register" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-vd-primary text-sm font-bold hover:scale-[1.02] transition-transform">
                    Register Free <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          <main className="min-w-0">
            {categories.length > 0 && (
              <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
                <MobileCategoryPill label="All" active={!category} onClick={() => setCategory('')} />
                {categories.map(([name]) => (
                  <MobileCategoryPill key={name} label={name} active={category === name} onClick={() => setCategory(name)} />
                ))}
              </div>
            )}

            {category && (
              <div className="mb-6 flex items-center gap-2 px-1">
                <Tag className="w-4 h-4 text-vd-primary" />
                <h2 className="text-xl font-bold text-vd-text-heading">{category}</h2>
                <span className="text-sm text-vd-text-light bg-vd-bg-alt px-2 py-0.5 rounded-full">{filtered.length}</span>
              </div>
            )}

            {loading ? (
              <div className="space-y-6">
                <div className="h-72 skeleton rounded-3xl" />
                <div className="grid gap-5 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="h-72 skeleton rounded-2xl" />)}
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 rounded-3xl border border-dashed border-vd-border bg-vd-bg-section/60">
                <BookOpen className="w-14 h-14 text-vd-text-light mx-auto mb-4 opacity-50" />
                <p className="text-vd-text-sub text-lg">No articles in this category yet.</p>
                {category && (
                  <button type="button" onClick={() => setCategory('')} className="mt-4 text-sm text-vd-primary font-semibold hover:underline">
                    View all articles
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-10">
                {heroPost && (
                  <FeaturedHeroCard post={heroPost} />
                )}

                {!category && featured.length > 1 && (
                  <section>
                    <SectionHeading icon={Star} title="Featured Reads" />
                    <div className="grid gap-5 sm:grid-cols-2">
                      {featured.slice(heroPost ? 1 : 0).map((post, i) => (
                        <BlogCard key={post.id} post={post} featured delay={i * 0.05} />
                      ))}
                    </div>
                  </section>
                )}

                {gridPosts.length > 0 && (
                  <section>
                    {(heroPost || featured.length > 0) && !category && (
                      <SectionHeading icon={BookOpen} title="Latest Articles" />
                    )}
                    <div className="grid gap-5 sm:grid-cols-2">
                      {gridPosts.map((post, i) => (
                        <BlogCard key={post.id} post={post} delay={i * 0.04} />
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

function SectionHeading({ icon: Icon, title }) {
  return (
    <h2 className="text-lg font-bold text-vd-text-heading mb-5 flex items-center gap-2">
      <span className="w-8 h-8 rounded-xl bg-vd-accent-soft flex items-center justify-center">
        <Icon className="w-4 h-4 text-vd-primary fill-vd-primary/20" />
      </span>
      {title}
    </h2>
  );
}

function FeaturedHeroCard({ post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden border border-vd-border shadow-xl shadow-vd-primary/10 bg-vd-bg-section min-h-[280px] sm:min-h-[320px]"
      >
        {post.coverImageUrl ? (
          <SmartImage src={post.coverImageUrl} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="absolute inset-0 vd-gradient-gold opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
        <div className="relative z-10 p-6 sm:p-10 flex flex-col justify-end min-h-[280px] sm:min-h-[320px]">
          <span className="inline-flex items-center gap-1.5 w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-vd-primary text-white mb-4">
            <Star className="w-3.5 h-3.5 fill-current" /> Editor&apos;s Pick
          </span>
          <span className="text-vd-primary-light text-xs font-semibold uppercase tracking-wider text-amber-200/90 mb-2">{post.category}</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight mb-3 group-hover:text-amber-100 transition-colors max-w-3xl">
            {post.title}
          </h2>
          <p className="text-white/80 text-sm sm:text-base line-clamp-2 max-w-2xl mb-5">{post.excerpt}</p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs text-white/70">
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{post.authorName}</span>
              {post.publishedAt && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(post.publishedAt)}</span>}
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white group-hover:gap-2.5 transition-all">
              Read article <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

function CategoryLink({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
        active
          ? 'bg-vd-primary text-white font-semibold shadow-sm'
          : 'text-vd-text-sub hover:bg-vd-bg-alt hover:text-vd-text-heading'
      }`}
    >
      <span className="truncate">{label}</span>
      <span className={`text-xs shrink-0 tabular-nums px-1.5 py-0.5 rounded-md ${active ? 'bg-white/20' : 'bg-vd-bg-alt text-vd-text-light'}`}>{count}</span>
    </button>
  );
}

function MobileCategoryPill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
        active ? 'vd-gradient-gold text-white shadow-md' : 'bg-vd-bg-section border border-vd-border text-vd-text-sub'
      }`}
    >
      {label}
    </button>
  );
}

function BlogCard({ post, featured = false, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35 }}>
      <Link
        href={`/blog/${post.slug}`}
        className="group flex flex-col h-full bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl border border-vd-border overflow-hidden shadow-sm hover:shadow-xl hover:shadow-vd-primary/10 hover:border-vd-primary/40 hover:-translate-y-1 transition-all duration-300"
      >
        <div className="aspect-[16/10] bg-vd-bg-alt relative overflow-hidden shrink-0">
          {post.coverImageUrl ? (
            <SmartImage src={post.coverImageUrl} alt={post.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(200,164,92,0.2), rgba(183,110,121,0.15))' }}>
              <BookOpen className="w-12 h-12 text-vd-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/95 dark:bg-vd-bg-section/95 text-vd-primary shadow-sm backdrop-blur-sm">
            {post.category}
          </span>
          {featured && (
            <span className="absolute top-3 right-3 px-2 py-1 rounded-lg text-[10px] font-bold bg-vd-primary text-white flex items-center gap-1 shadow-sm">
              <Star className="w-3 h-3 fill-current" />
            </span>
          )}
        </div>
        <div className="flex flex-col flex-1 p-5">
          <h3 className="text-base sm:text-lg font-bold text-vd-text-heading mb-2 group-hover:text-vd-primary transition-colors line-clamp-2 leading-snug">
            {post.title}
          </h3>
          <p className="text-sm text-vd-text-sub line-clamp-3 leading-relaxed flex-1">{post.excerpt}</p>
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-vd-border">
            <div className="flex flex-wrap items-center gap-3 text-xs text-vd-text-light">
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{post.authorName}</span>
              {post.publishedAt && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(post.publishedAt)}</span>}
            </div>
            <ArrowRight className="w-4 h-4 text-vd-primary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
