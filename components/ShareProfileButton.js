'use client';
import { useState } from 'react';
import { Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

export async function shareProfile(profileId, profileName) {
  const res = await fetch(`/api/profile/${profileId}/share`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not share profile');

  if (navigator.share) {
    await navigator.share({
      title: `${profileName} — Vivah Dwar`,
      text: data.shareText,
      url: data.shareUrl,
    });
  } else {
    await navigator.clipboard.writeText(data.shareUrl);
    toast.success('Profile link copied!');
  }
  return data;
}

export default function ShareProfileButton({
  profileId,
  profileName,
  label = 'Share Profile',
  className = 'w-full py-3 rounded-2xl font-semibold border-2 border-vd-border hover:border-vd-primary text-vd-text-sub flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-60',
}) {
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      await shareProfile(profileId, profileName);
    } catch (err) {
      if (err?.name !== 'AbortError') toast.error(err.message || 'Share failed');
    } finally {
      setSharing(false);
    }
  };

  return (
    <button type="button" onClick={handleShare} disabled={sharing || !profileId} className={className}>
      <Share2 className="w-4 h-4" />
      {sharing ? 'Preparing…' : label}
    </button>
  );
}
