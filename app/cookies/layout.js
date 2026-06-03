import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Cookie Policy – Vivah Dwar',
  description: 'Cookie policy for Vivah Dwar (Vivah Milan) matrimonial website.',
  path: '/cookies',
});

export default function CookiesLayout({ children }) {
  return children;
}
