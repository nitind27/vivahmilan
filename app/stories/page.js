'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import { Heart, MapPin, Quote } from 'lucide-react';
import SmartImage from '@/components/SmartImage';

export default function StoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stories')
      .then(r => r.json())
      .then(data => setStories(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-vd-bg flex flex-col">
      <Navbar />
      <div className="pt-24 pb-16 px-4" style={{ background: 'linear-gradient(135deg, #A67C3D 0%, #C8A45C 50%, #D4AF37 100%)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <Heart className="w-10 h-10 text-white mx-auto mb-3 fill-white/30" />
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Success Stories</h1>
          <p className="text-white/90 text-sm mb-6">Real couples who found love through our platform</p>
          <Link href="/share-story"
            className="inline-flex items-center gap-2 bg-white text-vd-primary px-6 py-2.5 rounded-full font-semibold text-sm hover:opacity-90 shadow-lg">
            Share Your Story
          </Link>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-40 skeleton rounded-2xl" />)}
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-vd-text-light mb-4">No stories published yet.</p>
            <Link href="/share-story" className="text-vd-primary font-semibold underline">Be the first to share</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {stories.map(s => (
              <article key={s.id} className="bg-vd-bg-section rounded-3xl border border-vd-border overflow-hidden shadow-sm">
                <div className="p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    {s.imageUrl ? (
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                        <SmartImage src={s.imageUrl} alt={s.coupleName} width={64} height={64} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl vd-gradient-gold flex items-center justify-center text-white text-2xl font-bold shrink-0">
                        {s.coupleName?.[0] || '♥'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-bold text-vd-text-heading">{s.coupleName}</h2>
                      {s.location && (
                        <p className="text-sm text-vd-text-light flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" /> {s.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 relative pl-4 border-l-2 border-vd-primary/40">
                    <Quote className="w-5 h-5 text-vd-primary/30 absolute -left-1 -top-1" />
                    <p className="text-vd-text-sub text-sm leading-relaxed italic">&ldquo;{s.story}&rdquo;</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
