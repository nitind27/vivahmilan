import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'About Us — Our Mission & Story',
  description:
    'Learn about Vivah Dwar — India\'s trusted matrimonial platform. Our mission, values, and commitment to helping families find verified life partners safely.',
  path: '/about',
  keywords: ['about vivah dwar', 'matrimonial company India', 'vivah dwar story', 'trusted matrimony'],
});

export default function AboutLayout({ children }) {
  return children;
}
