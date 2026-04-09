import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950 px-4">
      <div className="text-center">
        <div className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center mx-auto mb-6 opacity-80">
          <Heart className="w-10 h-10 text-white fill-white" />
        </div>
        <h1 className="text-8xl font-bold gradient-text mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Page Not Found</h2>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="gradient-bg text-white px-6 py-3 rounded-2xl font-semibold hover:opacity-90 transition-opacity">
            Go Home
          </Link>
          <Link href="/matches" className="border-2 border-gray-200 dark:border-gray-700 px-6 py-3 rounded-2xl font-semibold hover:border-pink-400 transition-colors">
            Browse Matches
          </Link>
        </div>
      </div>
    </div>
  );
}
