import './globals.css';
import Providers from '@/components/Providers';
import SWRegister from '@/components/SWRegister';
import ChatBot from '@/components/ChatBot';
import SetPasswordModal from '@/components/SetPasswordModal';
import PageTracker from '@/components/PageTracker';
import { Toaster } from 'react-hot-toast';

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
      <head>
        {/* Prevent dark/light flash on load */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className={`bg-vd-bg dark:bg-vd-bg text-vd-text-heading dark:text-vd-text-heading`} suppressHydrationWarning>
        <Providers>
          <SWRegister />
          <PageTracker />
          {children}
          <SetPasswordModal />
          <ChatBot />
          <Toaster position="top-right" toastOptions={{
            style: { background: '#1f2937', color: '#fff', borderRadius: '12px' },
            success: { iconTheme: { primary: 'var(--vd-primary)', secondary: '#fff' } },
          }} />
        </Providers>
      </body>
    </html>
  );
}