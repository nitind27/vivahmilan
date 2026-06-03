import { registerMetadata } from '@/lib/seo';

export const metadata = registerMetadata;

export default function RegisterLayout({ children }) {
  return children;
}
