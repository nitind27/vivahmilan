'use client';
import { useEffect } from 'react';
import { registerSW, requestNotifPermission } from '@/lib/notifications';

export default function SWRegister() {
  useEffect(() => {
    registerSW().then(() => requestNotifPermission());
  }, []);
  return null;
}
