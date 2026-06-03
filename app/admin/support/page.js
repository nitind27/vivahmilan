'use client';
import { Suspense } from 'react';
import AdminSupportChat from '@/components/AdminSupportChat';

function SupportPageInner() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-8.5rem)] -mb-2">
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
