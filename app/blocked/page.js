'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { Ban, Unlock, User, MapPin, Briefcase, Calendar } from 'lucide-react';
import { differenceInYears, format } from 'date-fns';
import toast from 'react-hot-toast';

export default function BlockedUsersPage() {
  const { status } = useSession();
  const router = useRouter();
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/block')
      .then(r => r.json())
      .then(data => { setBlocked(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status]);

  const unblockUser = async (userId, name) => {
    const res = await fetch('/api/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockedId: userId }),
    });
    if (res.ok) {
      toast.success(`${name} unblocked`);
      setBlocked(prev => prev.filter(b => b.id !== userId));
    } else {
      toast.error('Failed to unblock');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-vd-bg">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vd-bg">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-12">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-vd-text-heading flex items-center gap-2">
            <Ban className="w-6 h-6 text-red-500" /> Blocked Users
          </h1>
          <p className="text-vd-text-sub text-sm mt-1">
            Users you've blocked won't be able to view your profile or contact you.
          </p>
        </div>

        {blocked.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-vd-bg-section rounded-3xl p-12 text-center border border-vd-border">
            <div className="w-20 h-20 bg-vd-bg-alt rounded-full flex items-center justify-center mx-auto mb-4">
              <Ban className="w-10 h-10 text-vd-text-light" />
            </div>
            <h2 className="text-lg font-bold text-vd-text-heading mb-1">No Blocked Users</h2>
            <p className="text-vd-text-sub text-sm">You haven't blocked anyone yet.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {blocked.map((user, i) => {
              const age = user.dob ? differenceInYears(new Date(), new Date(user.dob)) : null;
              return (
                <motion.div key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-vd-bg-section rounded-2xl p-4 border border-vd-border hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-vd-accent-soft flex-shrink-0">
                      {user.image ? (
                        <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-6 h-6 text-vd-text-light" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-vd-text-heading">{user.name}</h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-vd-text-light mt-1">
                        {age && <span>{age} yrs</span>}
                        {user.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {user.city}, {user.country}
                          </span>
                        )}
                        {user.profession && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> {user.profession}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-vd-text-light mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Blocked on {format(new Date(user.blockedAt), 'dd MMM yyyy')}
                      </p>
                    </div>

                    {/* Unblock button */}
                    <button
                      onClick={() => unblockUser(user.id, user.name)}
                      className="flex items-center gap-2 px-4 py-2 bg-vd-primary hover:bg-vd-primary-dark text-white rounded-2xl text-sm font-semibold transition-colors flex-shrink-0">
                      <Unlock className="w-4 h-4" /> Unblock
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
