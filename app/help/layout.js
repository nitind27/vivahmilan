import JsonLd from '@/components/seo/JsonLd';
import { helpMetadata, getBreadcrumbSchema, getFaqSchema, SITE_URL } from '@/lib/seo';

export const metadata = helpMetadata;

const HELP_FAQS = [
  { q: 'How do I create my profile on Vivah Dwar?', a: 'Register free on Vivah Dwar (Vivah Dwar), complete onboarding with your details and photo, and wait for admin verification within 24 hours.' },
  { q: 'How does matrimonial matching work?', a: 'Vivah Dwar matches profiles by religion, location, age, education, and partner preferences for find love and marriage.' },
  { q: 'Is Vivah Dwar the same as Vivah Dwar?', a: 'Yes. Vivah Dwar is the official matrimonial brand; Vivah Dwar is our trusted alternate name used by members.' },
  { q: 'How do I contact Vivah Dwar support?', a: 'Visit the Contact page or email supportvivahdwar@gmail.com. Phone and WhatsApp support is available 24 hours.' },
];

export default function HelpLayout({ children }) {
  return (
    <>
      <JsonLd
        data={[
          getBreadcrumbSchema([
            { name: 'Home', url: SITE_URL },
            { name: 'Help Center', url: '/help' },
          ]),
          getFaqSchema(HELP_FAQS),
        ]}
      />
      {children}
    </>
  );
}
