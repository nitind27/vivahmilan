/** Client-safe block UI helpers (no database imports). */

/** Hide profile details in chat when either user has blocked the other. */
export function maskBlockedPeer(user) {
  if (!user?.isBlocked) return user;

  return {
    ...user,
    name: user.blockedByMe ? 'Blocked User' : 'Unavailable User',
    email: null,
    image: null,
    photos: [],
    isPremium: false,
    isVerified: false,
    verificationBadge: null,
    profile: user.profile
      ? { gender: null, city: null, country: null, profileComplete: null }
      : null,
  };
}

export function blockedChatMessage(flags) {
  if (!flags?.isBlocked) return null;
  if (flags.blockedByMe) {
    return {
      title: 'You blocked this user',
      subtitle: 'Their profile and details are hidden. Unblock from Blocked Users to message again.',
    };
  }
  return {
    title: 'This user is unavailable',
    subtitle: 'You cannot view their profile or send new messages.',
  };
}
