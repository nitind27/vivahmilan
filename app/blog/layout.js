import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Blog — Matrimony Tips & Wedding Advice',
  description: 'Read expert tips on matrimonial profiles, wedding planning, relationship advice, and finding your perfect life partner on Vivah Dwar.',
  path: '/blog',
  keywords: ['matrimony blog', 'wedding tips', 'marriage advice', 'vivah dwar blog'],
});

export default function BlogLayout({ children }) {
  return children;
}
