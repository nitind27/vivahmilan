'use client';

import { useEffect, useState } from 'react';

const PLATFORMS = [
  {
    key: 'facebook',
    label: 'Facebook',
    svg: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  },
  {
    key: 'instagram',
    label: 'Instagram',
    svg: (
      <>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </>
    ),
  },
  {
    key: 'youtube',
    label: 'YouTube',
    svg: (
      <>
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
      </>
    ),
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    svg: (
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    ),
  },
];

const ICON_CLASS =
  'w-10 h-10 rounded-xl bg-vd-bg-section border border-vd-border flex items-center justify-center text-vd-text-light hover:text-vd-primary-dark hover:border-vd-primary/40 transition-colors';

export default function SocialLinks({ className = 'flex items-center gap-2' }) {
  const [links, setLinks] = useState(null);

  useEffect(() => {
    fetch('/api/social-links')
      .then((r) => r.json())
      .then((data) => setLinks(data))
      .catch(() => setLinks({}));
  }, []);

  const visible = PLATFORMS.filter(({ key }) => links?.[key]?.trim());

  if (!links || visible.length === 0) return null;

  return (
    <div className={className}>
      {visible.map(({ key, label, svg }) => (
        <a
          key={key}
          href={links[key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={ICON_CLASS}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {svg}
          </svg>
        </a>
      ))}
    </div>
  );
}
