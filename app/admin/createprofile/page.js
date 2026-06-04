'use client';
import { Suspense } from 'react';
import { AdminCreateProfileTab } from '@/components/AdminAdvanced';
import SiteLoader from '@/components/SiteLoader';

export default function CreateProfilePage() {
  return (
    <Suspense fallback={<SiteLoader message="Loading…" size="md" />}>
      <AdminCreateProfileTab />
    </Suspense>
  );
}
