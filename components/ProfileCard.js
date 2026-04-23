'use client';
import { motion } from 'framer-motion';
import SmartImage from '@/components/SmartImage';
import Link from 'next/link';
import { Heart, MapPin, GraduationCap, Briefcase, BadgeCheck, Star } from 'lucide-react';
import { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { differenceInYears } from 'date-fns';
import toast from 'react-hot-toast';
import VerifiedBadge from '@/components/VerifiedBadge';

function ProfileCard({ user, index = 0 }) {
  const [shortlisted, setShortlisted] = useState(user.isShortlisted || false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const profile = user.profile || {};
  const photo = user.photos?.[0]?.url;
  const age = profile.dob ? differenceInYears(new Date(), new Date(profile.dob)) : null;

  const toggleShortlist = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/shortlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: user.id }),
      });
      const data = await res.json();
      setShortlisted(data.shortlisted);
      toast.success(data.shortlisted ? 'Added to shortlist' : 'Removed from shortlist');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card-hover"
    >
      <div
        className="bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl overflow-hidden shadow-sm border border-vd-border group cursor-pointer"
        onClick={() => router.push(`/profile/${user.id}`)}
      >
          {/* Photo */}
          <div className="relative h-56 bg-vd-accent-soft dark:bg-vd-accent/20">
            {photo ? (
              <SmartImage src={photo} alt={user.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-20 h-20 rounded-full vd-gradient-gold flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">{user.name?.[0]?.toUpperCase()}</span>
                </div>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-1 flex-wrap">
              {user.isPremium && (
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-white" /> Premium
                </span>
              )}
              {user.verificationBadge && <VerifiedBadge size="sm" />}
            </div>

            {/* Shortlist button */}
            <button
              onClick={toggleShortlist}
              disabled={loading}
              className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${shortlisted ? 'bg-vd-primary text-white' : 'bg-white/80 text-gray-500 hover:bg-vd-primary hover:text-white'}`}
            >
              <Heart className={`w-4 h-4 ${shortlisted ? 'fill-white' : ''}`} />
            </button>
          </div>

          {/* Info */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                {user.name}
                {user.verificationBadge && <VerifiedBadge size="sm" variant="icon" />}
              </h3>
              {age && <span className="text-sm text-gray-500">{age} yrs</span>}
            </div>

            <div className="space-y-1">
              {(profile.city || profile.country) && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3 text-vd-primary" />
                  <span className="truncate">{[profile.city, profile.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {profile.education && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <GraduationCap className="w-3 h-3 text-vd-primary" />
                  <span className="truncate">{profile.education}</span>
                </div>
              )}
              {profile.profession && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Briefcase className="w-3 h-3 text-vd-primary" />
                  <span className="truncate">{profile.profession}</span>
                </div>
              )}
            </div>

            {profile.religion && (
              <div className="mt-3">
                <span className="text-xs bg-vd-accent-soft text-vd-primary-dark px-2 py-1 rounded-full">{profile.religion}</span>
              </div>
            )}

            <Link
              href={`/profile/${user.id}`}
              className="mt-3 w-full block text-center text-xs font-semibold text-vd-primary border border-vd-primary rounded-xl py-1.5 hover:bg-vd-accent-soft transition-colors"
              onClick={e => e.stopPropagation()}
            >
              See Detail Profile
            </Link>
          </div>
      </div>
    </motion.div>
  );
}

export default memo(ProfileCard);
