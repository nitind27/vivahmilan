'use client';
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ApprovalChecklist({ checklist, eligible, title, compact = false }) {
  if (!checklist?.length) return null;

  const passed = checklist.filter((c) => c.passed).length;
  const total = checklist.length;
  const pad = compact ? 'p-3' : 'p-4';

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${pad} ${
        eligible
          ? 'border-vd-primary/35 bg-gradient-to-br from-vd-accent-soft/80 to-vd-bg-section'
          : 'border-amber-400/40 bg-gradient-to-br from-amber-50/90 to-vd-bg-section dark:from-amber-950/20 dark:to-vd-bg-section'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center gap-3 mb-4 pb-3 border-b ${
          eligible ? 'border-vd-primary/20' : 'border-amber-300/30 dark:border-amber-800/40'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            eligible
              ? 'vd-gradient-gold shadow-sm'
              : 'bg-amber-100 dark:bg-amber-900/40'
          }`}
        >
          {eligible ? (
            <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`font-bold text-vd-text-heading leading-snug ${
              compact ? 'text-sm' : 'text-base'
            }`}
          >
            {title || (eligible ? 'Ready to submit for admin review' : 'Complete requirements below')}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                eligible
                  ? 'bg-vd-primary/15 text-vd-primary-dark dark:text-vd-primary'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
              }`}
            >
              {passed}/{total} checks passed
            </span>
          </div>
        </div>
      </div>

      {/* Items */}
      <ul className={`space-y-2 ${compact ? 'text-xs' : 'text-sm'}`}>
        {checklist.map((item) => (
          <li
            key={item.id}
            className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 transition-colors ${
              item.passed
                ? 'bg-vd-bg-section/70 dark:bg-vd-bg-alt/50 border border-vd-border/60'
                : 'bg-red-50/80 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40'
            }`}
          >
            {item.passed ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <span
                className={`block font-medium ${
                  item.passed ? 'text-vd-text-heading' : 'text-red-800 dark:text-red-300'
                }`}
              >
                {item.label}
              </span>
              {item.detail && (
                <p
                  className={`mt-0.5 break-words ${
                    item.passed
                      ? 'text-vd-text-light text-xs'
                      : 'text-red-600 dark:text-red-400 text-xs'
                  }`}
                >
                  {item.detail}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
