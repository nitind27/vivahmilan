'use client';
import { Suspense } from 'react';
import AdminSupportChat from '@/components/AdminSupportChat';

function SupportPageInner() {
  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <AdminSupportChat />
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={<div className="text-gray-500 text-sm py-12 text-center">Loading support…</div>}>
      <SupportPageInner />
    </Suspense>
  );
}
