'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import SmartImage from '@/components/SmartImage';
import { BookOpen, Calendar, User, Tag, Star } from 'lucide-react';

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/blog').then((r) => r.json()),
      fetch('/api/blog?featured=1').then((r) => r.json()),
    ])
      .then(([all, feat]) => {
        setPosts(Array.isArray(all) ? all : []);
        setFeatured(Array.isArray(feat) ? feat : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(posts.map((p) => p.category).filter(Boolean))].sort();
  const filtered = category ? posts.filter((p) => p.category === category) : posts;
  const featuredIds = new Set(featured.map((f) => f.id));

  return (
    <div className="min-h-screen bg-vd-bg flex flex-col">
      <Navbar />

      <div
        className="pt-24 pb-14 px-4"
        style={{ background: 'linear-gradient(135deg, #A67C3D 0%, #C8A45C 50%, #D4AF37 100%)' }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <BookOpen className="w-10 h-10 text-white mx-auto mb-3" />
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Vivah Dwar Blog</h1>
          <p className="text-white/90 text-sm max-w-lg mx-auto">
            Matrimony tips, wedding advice, and relationship insights for your journey to find the right life partner.
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!category ? 'vd-gradient-gold text-white' : 'bg-vd-bg-section border border-vd-border text-vd-text-sub hover:border-vd-primary'}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${category === c ? 'vd-gradient-gold text-white' : 'bg-vd-bg-section border border-vd-border text-vd-text-sub hover:border-vd-primary'}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 skeleton rounded-3xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-vd-text-light mx-auto mb-4" />
            <p className="text-vd-text-sub">No articles published yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {!category && featured.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-vd-text-heading mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-vd-primary" /> Featured
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map((post) => (
                    <BlogCard key={post.id} post={post} featured />
                  ))}
                </div>
              </section>
            )}

            <section>
              {!category && featured.length > 0 && (
                <h2 className="text-lg font-bold text-vd-text-heading mb-4">Latest articles</h2>
              )}
              <div className="grid gap-6 sm:grid-cols-2">
                {filtered.filter((p) => category || !featuredIds.has(p.id)).map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}

function BlogCard({ post, featured = false }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group block bg-vd-bg-section rounded-3xl border border-vd-border overflow-hidden shadow-sm hover:shadow-md hover:border-vd-primary/30 transition-all ${featured ? 'sm:col-span-1' : ''}`}
    >
      <div className="aspect-[16/9] bg-vd-bg-alt relative overflow-hidden">
        {post.coverImageUrl ? (
          <SmartImage
            src={post.coverImageUrl}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 vd-gradient-gold opacity-20 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-vd-primary/40" />
          </div>
        )}
        {featured && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-vd-primary flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" /> Featured
          </span>
        )}
      </div>
      <div className="p-5 sm:p-6">
        <span className="text-xs font-semibold text-vd-primary uppercase tracking-wide">{post.category}</span>
        <h3 className="text-lg font-bold text-vd-text-heading mt-1 mb-2 group-hover:text-vd-primary transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-sm text-vd-text-sub line-clamp-3 leading-relaxed">{post.excerpt}</p>
        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-vd-text-light">
          <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{post.authorName}</span>
          {post.publishedAt && (
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(post.publishedAt)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
