'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { acceptsFunctional, hasConsentChoice } from '@/lib/cookieConsent';

export default function MarketingPopup() {
  const { data: session } = useSession();
  const router = useRouter();
  const [popup, setPopup] = useState(null);
  const [show, setShow] = useState(false);

  const tryLoadPopup = () => {
    if (!hasConsentChoice() || !acceptsFunctional()) return;
    if (!session?.user) return;
    if (sessionStorage.getItem('milan_popup_closed')) return;

    fetch('/api/marketing-popup')
      .then(r => r.json())
      .then(data => {
        if (data && data.enabled) {
          // Check target audience
          const isPremium = session.user.isPremium;
          if (data.target === 'FREE' && isPremium) return;
          if (data.target === 'PREMIUM' && !isPremium) return;
          
          setPopup(data);
          setShow(true);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    tryLoadPopup();
    const onConsent = () => tryLoadPopup();
    window.addEventListener('vd-cookie-consent', onConsent);
    return () => window.removeEventListener('vd-cookie-consent', onConsent);
  }, [session]);

  if (!show || !popup) return null;

  const close = () => {
    setShow(false);
    sessionStorage.setItem('milan_popup_closed', 'true');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-700 animate-in zoom-in-95 duration-300">
        {popup.imageUrl && (
          <div className="w-full h-48 bg-gray-800 relative">
            <img src={popup.imageUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
          </div>
        )}
        <div className="p-6 text-center relative">
          <button onClick={close} className="absolute top-3 right-3 text-gray-500 hover:text-white bg-gray-800 rounded-full p-1 transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{popup.title}</h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">{popup.description}</p>
          {popup.buttonText && popup.buttonLink && (
            <button 
              onClick={() => { close(); router.push(popup.buttonLink); }}
              className="w-full py-4 bg-gradient-to-r from-vd-primary to-pink-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-pink-900/20 hover:opacity-90 transition-opacity">
              {popup.buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
