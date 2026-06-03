import JsonLd from '@/components/seo/JsonLd';
import { homeMetadata, getBreadcrumbSchema, SITE_URL, BRAND } from '@/lib/seo';

export const metadata = homeMetadata;

const homePageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': `${SITE_URL}/#webpage`,
  url: SITE_URL,
  name: `${BRAND.name} – Matrimonial Website | Vivah Dwar | Find Love`,
  description: BRAND.description,
  isPartOf: { '@id': `${SITE_URL}/#website` },
  about: { '@id': `${SITE_URL}/#matrimonial-service` },
  inLanguage: 'en-IN',
  primaryImageOfPage: `${SITE_URL}/logo/logo.png`,
};

export default function SiteHomeLayout({ children }) {
  return (
    <>
      <JsonLd
        data={[
          homePageSchema,
          getBreadcrumbSchema([{ name: 'Home', url: SITE_URL }]),
        ]}
      />
      {children}
    </>
  );
}
