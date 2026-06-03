import { SITE_URL } from '@/lib/seo';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/dashboard',
          '/search',
          '/matches',
          '/chat',
          '/interests',
          '/shortlist',
          '/settings',
          '/profile/edit',
          '/profile-launch',
          '/onboarding',
          '/notifications',
          '/premium',
          '/payment/',
          '/blocked',
          '/compare',
          '/views',
          '/refer',
          '/google-verify',
          '/verify-email',
          '/forgot-password',
          '/register/complete',
          '/mobile/',
          '/kyc/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
