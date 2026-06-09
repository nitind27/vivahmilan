import Link from 'next/link';
import { Heart, ArrowRight } from 'lucide-react';

export default function BlogCtaBanner({ className = '' }) {
  return (
    <div className={`blog-cta-banner relative overflow-hidden rounded-3xl p-6 sm:p-8 text-center shadow-lg ${className}`}>
      <div className="absolute inset-0 vd-gradient-gold" />
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/30 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
      </div>
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
          <Heart className="w-6 h-6 text-white fill-white/30" />
        </div>
        <p className="blog-cta-title font-bold text-lg sm:text-xl mb-2">Ready to find your life partner?</p>
        <p className="blog-cta-sub text-sm mb-5 max-w-sm mx-auto">
          Join Vivah Dwar — create your free profile and start connecting with verified matches today.
        </p>
        <Link href="/register" className="blog-cta-btn inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
          Create Free Profile <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
