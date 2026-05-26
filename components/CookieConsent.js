'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Shield, BarChart3, Settings2, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
  hasConsentChoice,
  acceptAll,
  essentialOnly,
  getConsent,
  setConsent,
} from '@/lib/cookieConsent';

function Toggle({ on, disabled, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => !disabled && onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
        disabled ? 'bg-vd-border opacity-60 cursor-not-allowed' : on ? 'bg-vd-primary' : 'bg-vd-border'
      }`}
      aria-label={label}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function SettingsPanel({ functional, analytics, setFunctional, setAnalytics, onSave, onAcceptAll, onEssential }) {
  return (
    <div className="space-y-4 border-t border-vd-border pt-4 mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-vd-text-light">Customize preferences</p>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-vd-bg border border-vd-border px-4 py-3">
          <div className="flex items-start gap-2 min-w-0">
            <Shield className="w-4 h-4 text-vd-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-vd-text-heading">Essential</p>
              <p className="text-xs text-vd-text-light">Login, security — required</p>
            </div>
          </div>
          <Toggle on disabled label="Essential always on" />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-vd-bg border border-vd-border px-4 py-3">
          <div className="flex items-start gap-2 min-w-0">
            <Settings2 className="w-4 h-4 text-vd-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-vd-text-heading">Functional</p>
              <p className="text-xs text-vd-text-light">Theme, push, chat assistant, promos</p>
            </div>
          </div>
          <Toggle on={functional} onChange={setFunctional} label="Functional cookies" />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-vd-bg border border-vd-border px-4 py-3">
          <div className="flex items-start gap-2 min-w-0">
            <BarChart3 className="w-4 h-4 text-vd-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-vd-text-heading">Analytics</p>
              <p className="text-xs text-vd-text-light">Anonymous visits (admin stats)</p>
            </div>
          </div>
          <Toggle on={analytics} onChange={setAnalytics} label="Analytics cookies" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white vd-gradient-gold hover:opacity-90"
        >
          Save preferences
        </button>
        <button type="button" onClick={onAcceptAll} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-vd-primary border border-vd-primary/40 hover:bg-vd-accent-soft">
          Accept all
        </button>
        <button type="button" onClick={onEssential} className="px-5 py-2.5 rounded-xl text-sm font-medium text-vd-text-sub border border-vd-border hover:border-vd-primary">
          Essential only
        </button>
      </div>
    </div>
  );
}

export default function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [functional, setFunctional] = useState(true);
  const [analytics, setAnalytics] = useState(true);

  const syncFromSaved = useCallback(() => {
    const c = getConsent();
    if (c) {
      setFunctional(c.functional);
      setAnalytics(c.analytics);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    if (!hasConsentChoice()) {
      setOpen(true);
      setShowSettings(false);
    }
    syncFromSaved();

    const onManage = () => {
      syncFromSaved();
      setOpen(true);
      setShowSettings(true);
    };
    window.addEventListener('vd-open-cookie-settings', onManage);
    return () => window.removeEventListener('vd-open-cookie-settings', onManage);
  }, [syncFromSaved]);

  if (!mounted) return null;

  const close = () => {
    if (!hasConsentChoice()) return;
    setOpen(false);
    setShowSettings(false);
  };

  const finish = () => {
    setOpen(false);
    setShowSettings(false);
  };

  const onAcceptAll = () => {
    acceptAll();
    finish();
  };

  const onEssentialOnly = () => {
    essentialOnly();
    finish();
  };

  const onSaveCustom = () => {
    setConsent({ functional, analytics }, 'custom');
    finish();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[199] bg-black/40 backdrop-blur-[2px]"
            onClick={close}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 z-[200] p-4 sm:p-6 pointer-events-none"
            role="dialog"
            aria-labelledby="cookie-consent-title"
          >
            <div className="pointer-events-auto max-w-2xl mx-auto rounded-2xl sm:rounded-3xl border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto">
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl vd-gradient-gold flex items-center justify-center shadow-md">
                      <Cookie className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 id="cookie-consent-title" className="text-lg font-bold text-vd-text-heading">
                        {showSettings && hasConsentChoice() ? 'Cookie preferences' : 'We value your privacy'}
                      </h2>
                      <p className="text-xs text-vd-text-light">Vivah Dwar · Cookie settings</p>
                    </div>
                  </div>
                  {hasConsentChoice() && (
                    <button
                      type="button"
                      onClick={close}
                      className="p-2 rounded-xl hover:bg-vd-accent-soft text-vd-text-sub"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <p className="text-sm text-vd-text-sub leading-relaxed mb-4">
                  Choose what we may store on your device. Read our{' '}
                  <Link href="/cookies" className="text-vd-primary font-semibold hover:underline">
                    Cookie Policy
                  </Link>
                  .
                </p>

                {!showSettings && (
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-2">
                    <button
                      type="button"
                      onClick={onAcceptAll}
                      className="px-6 py-3 rounded-2xl text-sm font-bold text-white vd-gradient-gold hover:opacity-90 shadow-sm"
                    >
                      Accept all
                    </button>
                    <button
                      type="button"
                      onClick={onEssentialOnly}
                      className="px-6 py-3 rounded-2xl text-sm font-semibold text-vd-text-heading border-2 border-vd-border bg-vd-bg hover:border-vd-primary"
                    >
                      Essential only
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSettings(true)}
                      className="px-6 py-3 rounded-2xl text-sm font-medium text-vd-primary border border-vd-primary/30 hover:bg-vd-accent-soft flex items-center justify-center gap-1"
                    >
                      Customize <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {showSettings && (
                  <>
                    {hasConsentChoice() && (
                      <button
                        type="button"
                        onClick={() => setShowSettings(false)}
                        className="text-xs text-vd-text-light hover:text-vd-primary flex items-center gap-1 mb-2"
                      >
                        <ChevronUp className="w-3 h-3" /> Hide details
                      </button>
                    )}
                    <SettingsPanel
                      functional={functional}
                      analytics={analytics}
                      setFunctional={setFunctional}
                      setAnalytics={setAnalytics}
                      onSave={onSaveCustom}
                      onAcceptAll={onAcceptAll}
                      onEssential={onEssentialOnly}
                    />
                  </>
                )}

                {!showSettings && (
                  <button
                    type="button"
                    onClick={() => setShowSettings(true)}
                    className="w-full mt-2 text-center text-xs text-vd-text-light hover:text-vd-primary"
                  >
                    Manage individual cookie categories
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
