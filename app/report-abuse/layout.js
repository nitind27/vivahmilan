import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Report Abuse – Vivah Dwar Safety',
  description: 'Report fake or abusive profiles on Vivah Dwar matrimonial platform.',
  path: '/report-abuse',
});

export default function ReportAbuseLayout({ children }) {
  return children;
}
