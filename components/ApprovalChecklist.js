'use client';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function ApprovalChecklist({ checklist, eligible, title, compact = false }) {
  if (!checklist?.length) return null;

  const passed = checklist.filter(c => c.passed).length;
  const total = checklist.length;

  return (
    <div className={`rounded-xl border ${eligible ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'} ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-start gap-2 mb-3">
        {eligible ? (
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        )}
        <div>
          <p className={`font-semibold ${eligible ? 'text-green-800' : 'text-amber-900'} ${compact ? 'text-sm' : ''}`}>
            {title || (eligible ? 'Ready for approval' : 'Approval blocked — requirements not met')}
          </p>
          <p className={`${eligible ? 'text-green-700' : 'text-amber-800'} ${compact ? 'text-xs' : 'text-sm'} mt-0.5`}>
            {passed}/{total} checks passed
          </p>
        </div>
      </div>
      <ul className={`space-y-2 ${compact ? 'text-xs' : 'text-sm'}`}>
        {checklist.map(item => (
          <li key={item.id} className="flex items-start gap-2">
            {item.passed ? (
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <span className={item.passed ? 'text-gray-700' : 'text-gray-900 font-medium'}>{item.label}</span>
              {item.detail && (
                <p className={`${item.passed ? 'text-gray-500' : 'text-red-600'} mt-0.5 break-words`}>{item.detail}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
