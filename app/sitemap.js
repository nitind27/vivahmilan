import { SITE_URL, PUBLIC_SITEMAP_ROUTES } from '@/lib/seo';

export default function sitemap() {
  const now = new Date();
  return PUBLIC_SITEMAP_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
