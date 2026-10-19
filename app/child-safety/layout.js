import { childSafetyMetadata } from '@/lib/seo';

export const metadata = childSafetyMetadata;

export default function ChildSafetyLayout({ children }) {
  return children;
}
