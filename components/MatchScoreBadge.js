'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Lock, Crown } from 'lucide-react';

export default function MatchScoreBadge({ userId, className = '' }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/match-score?userId=${userId}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, [userId]);

  if (!data) return null;

  if (data.locked) {
    return (
      <Link href="/premium" className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-900/20 border border-yellow-700/40 text-yellow-400 text-xs font-semibold hover:bg-yellow-900/30 ${className}`}>
        <Lock className="w-3 h-3" />
        {data.hint === 'high' ? 'High compatibility — unlock score' : 'Match score — Premium'}
      </Link>
    );
  }

  const colorMap = { green: 'bg-green-900/30 text-green-400 border-green-700/40', blue: 'bg-blue-900/30 text-blue-400 border-blue-700/40', yellow: 'bg-yellow-900/30 text-yellow-400 border-yellow-700/40', orange: 'bg-orange-900/30 text-orange-400 border-orange-700/40', gray: 'bg-gray-800 text-gray-400 border-gray-600' };
  const cls = colorMap[data.color] || colorMap.gray;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${cls} ${className}`}>
      <Sparkles className="w-3.5 h-3.5" />
      {data.score}% · {data.label}
    </span>
  );
}
