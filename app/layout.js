import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import SWRegister from '@/components/SWRegister';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Milan Matrimony – Find Your Perfect Life Partner',
  description: 'Join millions of happy couples. Find your perfect match based on religion, location, profession and more.',
  keywords: 'matrimony, marriage, shaadi, life partner, match making',
  openGraph: {
    title: 'Milan Matrimony',
    description: 'Find your perfect life partner',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100`}>
        <Providers>
          <SWRegister />
          {children}
          <Toaster position="top-right" toastOptions={{
            style: { background: '#1f2937', color: '#fff', borderRadius: '12px' },
            success: { iconTheme: { primary: '#ec4899', secondary: '#fff' } },
          }} />
        </Providers>
      </body>
    </html>
  );
}
