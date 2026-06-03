import { SITE_CONTACT } from '@/lib/siteContact';

/** Canonical site URL — set NEXT_PUBLIC_APP_URL=https://vivahdwar.com in production */
export const SITE_URL =
  (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://vivahdwar.com').replace(
    /\/$/,
    ''
  );

export const BRAND = {
  name: 'Vivah Dwar',
  legalName: 'Vivah Dwar Matrimonial',
  alternateNames: ['Vivah Milan', 'Milan Matrimony', 'Vivah Milan Matrimonial', 'Vivah Dwar Matrimonial'],
  tagline: 'Find Love · Find Your Life Partner',
  description:
    'Vivah Dwar (Vivah Milan) is India\'s trusted matrimonial platform — verified profiles, smart matchmaking, and secure chat to find love and your perfect life partner for marriage.',
  email: SITE_CONTACT.email,
  phone: SITE_CONTACT.phoneDisplay,
  locale: 'en_IN',
  country: 'IN',
};

/** Primary + long-tail keywords for matrimonial / brand discovery */
export const SEO_KEYWORDS = [
  'Vivah Dwar',
  'Vivah Milan',
  'vivah dwar matrimonial',
  'vivah milan matrimonial',
  'vivah dwar login',
  'vivah milan login',
  'matrimonial',
  'matrimonial site',
  'matrimonial website India',
  'matrimony',
  'shaadi',
  'vivah',
  'find love',
  'find life partner',
  'marriage website',
  'online matchmaking',
  'verified matrimonial profiles',
  'bride groom search',
  'Indian matrimonial',
  'hindu matrimony',
  'matchmaking app India',
  'best matrimonial site',
  'free matrimonial registration',
  'secure matrimonial platform',
];

/** Public routes included in sitemap (indexable marketing & trust pages) */
export const PUBLIC_SITEMAP_ROUTES = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/login', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/register', priority: 0.95, changeFrequency: 'monthly' },
  { path: '/stories', priority: 0.85, changeFrequency: 'weekly' },
  { path: '/share-story', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/help', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/terms', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/safety', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/refund', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/cookies', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/report-abuse', priority: 0.45, changeFrequency: 'yearly' },
];

const OG_IMAGE = '/logo/logo.png';

/**
 * Build Next.js Metadata object (App Router).
 * @param {object} opts
 * @param {string} opts.title - Page title (brand appended if missing)
 * @param {string} opts.description
 * @param {string} [opts.path] - Pathname e.g. '/login'
 * @param {string[]} [opts.keywords]
 * @param {boolean} [opts.noIndex]
 */
export function buildPageMetadata({
  title,
  description,
  path = '',
  keywords = [],
  noIndex = false,
}) {
  const canonical = `${SITE_URL}${path || '/'}`;
  const hasBrand = /vivah\s*dwar|vivah\s*milan/i.test(title);
  const fullTitle = hasBrand ? title : `${title} | ${BRAND.name}`;

  const keywordList = [...new Set([...SEO_KEYWORDS, ...keywords])];

  const verification = {};
  if (process.env.GOOGLE_SITE_VERIFICATION) {
    verification.google = process.env.GOOGLE_SITE_VERIFICATION;
  }
  if (process.env.BING_SITE_VERIFICATION) {
    verification.other = {
      ...(verification.other || {}),
      'msvalidate.01': process.env.BING_SITE_VERIFICATION,
    };
  }

  return {
    metadataBase: new URL(SITE_URL),
    title: fullTitle,
    description,
    keywords: keywordList,
    authors: [{ name: BRAND.name, url: SITE_URL }],
    creator: BRAND.name,
    publisher: BRAND.name,
    category: 'Matrimonial',
    alternates: {
      canonical,
      languages: { 'en-IN': canonical },
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      url: canonical,
      siteName: BRAND.name,
      title: fullTitle,
      description,
      images: [
        {
          url: OG_IMAGE,
          width: 512,
          height: 512,
          alt: `${BRAND.name} – Indian Matrimonial & Matchmaking`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [OG_IMAGE],
    },
    icons: {
      icon: '/logo/icon.png',
      apple: '/logo/icon.png',
    },
    ...(Object.keys(verification).length ? { verification } : {}),
    other: {
      'geo.region': 'IN',
      'geo.placename': 'India',
      'application-name': BRAND.name,
      'apple-mobile-web-app-title': BRAND.name,
    },
  };
}

/** Root layout defaults (title template for all child pages) */
export const rootLayoutMetadata = {
  ...buildPageMetadata({
    title: `${BRAND.name} – India's Trusted Matrimonial Site | Vivah Milan | Find Love`,
    description: BRAND.description,
    path: '/',
  }),
  title: {
    default: `${BRAND.name} – India's Trusted Matrimonial Site | Vivah Milan | Find Love`,
    template: `%s | ${BRAND.name}`,
  },
};

/** Homepage — strongest brand + matrimonial keywords */
export const homeMetadata = buildPageMetadata({
  title: `${BRAND.name} – #1 Matrimonial Website | Vivah Milan | Find Love & Life Partner`,
  description:
    'Join Vivah Dwar (Vivah Milan) — premium Indian matrimonial site with verified profiles, AI matchmaking & secure chat. Find love, shaadi & your perfect vivah partner. Register free today.',
  path: '/',
  keywords: [
    'vivah dwar official site',
    'vivah milan official',
    'matrimonial find love',
    'shaadi website India',
  ],
});

export const loginMetadata = buildPageMetadata({
  title: `Login – ${BRAND.name} Matrimonial | Vivah Milan Member Sign In`,
  description: `Sign in to ${BRAND.name} (Vivah Milan) — access verified matrimonial profiles, matches, chat & find your life partner.`,
  path: '/login',
});

export const registerMetadata = buildPageMetadata({
  title: `Free Registration – ${BRAND.name} | Vivah Milan Matrimonial`,
  description: `Create your free ${BRAND.name} matrimonial profile. Verified members, smart matching — find love & marriage partner on India's trusted Vivah Milan platform.`,
  path: '/register',
  keywords: ['free matrimonial registration', 'register shaadi profile'],
});

export const storiesMetadata = buildPageMetadata({
  title: `Success Stories – Couples Who Found Love on ${BRAND.name}`,
  description: `Real marriage success stories from ${BRAND.name} & Vivah Milan members — inspiration for your matrimonial journey.`,
  path: '/stories',
});

export const contactMetadata = buildPageMetadata({
  title: `Contact Us – ${BRAND.name} Support`,
  description: `Contact ${BRAND.name} matrimonial support — phone, email & WhatsApp. We're here to help your find love journey.`,
  path: '/contact',
});

export const helpMetadata = buildPageMetadata({
  title: `Help Center – ${BRAND.name} Matrimonial FAQ`,
  description: `FAQs for ${BRAND.name} (Vivah Milan) — account, matching, premium plans, safety & matrimonial features.`,
  path: '/help',
});

export const termsMetadata = buildPageMetadata({
  title: `Terms of Service – ${BRAND.name}`,
  description: `Terms of use for ${BRAND.name} matrimonial platform (vivahdwar.com).`,
  path: '/terms',
});

export const privacyMetadata = buildPageMetadata({
  title: `Privacy Policy – ${BRAND.name}`,
  description: `How ${BRAND.name} protects your personal data on our matrimonial platform.`,
  path: '/privacy',
});

export const safetyMetadata = buildPageMetadata({
  title: `Safety Guidelines – ${BRAND.name} Matrimonial`,
  description: `Safety tips & reporting for secure matchmaking on ${BRAND.name}.`,
  path: '/safety',
});

export const refundMetadata = buildPageMetadata({
  title: `Refund Policy – ${BRAND.name}`,
  description: `Subscription refund policy for ${BRAND.name} premium matrimonial plans.`,
  path: '/refund',
});

export const shareStoryMetadata = buildPageMetadata({
  title: `Share Your Success Story – ${BRAND.name}`,
  description: `Share how you found love on ${BRAND.name} — inspire other matrimonial members.`,
  path: '/share-story',
});

/** JSON-LD: Organization + brand aliases for Google Knowledge */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: BRAND.name,
    alternateName: BRAND.alternateNames,
    legalName: BRAND.legalName,
    url: SITE_URL,
    logo: `${SITE_URL}/logo/logo.png`,
    image: `${SITE_URL}/logo/logo.png`,
    description: BRAND.description,
    email: BRAND.email,
    telephone: BRAND.phone,
    areaServed: { '@type': 'Country', name: 'India' },
    sameAs: [
      'https://www.youtube.com/@vivahdwar',
      SITE_CONTACT.whatsappUrl,
    ].filter(Boolean),
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: BRAND.phone,
      contactType: 'customer support',
      email: BRAND.email,
      areaServed: 'IN',
      availableLanguage: ['English', 'Hindi'],
    },
  };
}

/** JSON-LD: WebSite + SearchAction (sitelinks search box) */
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: BRAND.name,
    alternateName: BRAND.alternateNames,
    url: SITE_URL,
    description: BRAND.description,
    inLanguage: 'en-IN',
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** JSON-LD: Matrimonial / dating-style service */
export function getMatrimonialServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_URL}/#matrimonial-service`,
    name: `${BRAND.name} Matrimonial & Matchmaking`,
    alternateName: ['Vivah Milan Matrimonial', 'Vivah Dwar Shaadi'],
    description: BRAND.description,
    url: SITE_URL,
    provider: { '@id': `${SITE_URL}/#organization` },
    serviceType: 'Matrimonial matchmaking',
    areaServed: { '@type': 'Country', name: 'India' },
    audience: {
      '@type': 'PeopleAudience',
      audienceType: 'Adults seeking marriage partners',
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/register`,
      price: '0',
      priceCurrency: 'INR',
      description: 'Free matrimonial profile registration',
    },
  };
}

/** JSON-LD: WebApplication (app install / brand) */
export function getWebApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: BRAND.name,
    alternateName: BRAND.alternateNames,
    url: SITE_URL,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web, Android, iOS',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    description: BRAND.description,
  };
}

export function getGlobalJsonLdGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      getOrganizationSchema(),
      getWebSiteSchema(),
      getMatrimonialServiceSchema(),
      getWebApplicationSchema(),
    ],
  };
}

/** BreadcrumbList for inner pages */
export function getBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

export function getFaqSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}
