'use client';
import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export default function InstallPWA() {
  const [prompt, setPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('pwa-install-dismissed')) {
      setDismissed(true);
      return;
    }
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!prompt || dismissed) return null;

  const install = async () => {
    prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
    localStorage.setItem('pwa-install-dismissed', '1');
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', '1');
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-vd-bg-section border border-vd-border rounded-2xl shadow-xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl vd-gradient-gold flex items-center justify-center shrink-0">
        <Download className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-vd-text-heading">Install Milan App</p>
        <p className="text-xs text-vd-text-light mt-0.5">Add to home screen for quick access</p>
        <div className="flex gap-2 mt-2">
          <button onClick={install} className="text-xs px-3 py-1.5 vd-gradient-gold text-white rounded-lg font-semibold">Install</button>
          <button onClick={dismiss} className="text-xs px-3 py-1.5 text-vd-text-light hover:text-vd-text-heading">Not now</button>
        </div>
      </div>
    </div>
  );
}
