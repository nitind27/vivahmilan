/** True when profile belongs to admin-seeded dummy data. */
export function isSeedProfileUser(user, profile = null) {
  if (!user) return false;
  if (user.isSeedProfile === 1 || user.isSeedProfile === true) return true;

  // Legacy rows before isSeedProfile flag was added
  if (profile?.hidePhoto === 1 && Number(profile?.profileComplete || 0) >= 95) {
    const email = String(user.email || '').toLowerCase();
    if (email.includes('@seed.vivahdwar.in')) return true;
    if (/^[a-z][a-z0-9]*\.[a-z][a-z0-9]*\.\d+@gmail\.com$/.test(email)) return true;
  }

  return false;
}

/**
 * Whether phone/email may be shown to the current viewer.
 * Dummy profiles never expose contact to other users (even premium).
 */
export function getProfileContactVisibility(viewedUser, {
  viewerId = null,
  viewerRole = 'USER',
  hidePhone = false,
  isPremiumViewer = false,
  profile = null,
} = {}) {
  const viewingSelf = viewerId && viewedUser?.id === viewerId;
  if (viewingSelf) return { phone: true, email: true };
  if (viewerRole === 'ADMIN') return { phone: true, email: true };

  if (isSeedProfileUser(viewedUser, profile)) {
    return { phone: false, email: false };
  }

  const phone = isPremiumViewer && !hidePhone;
  return { phone, email: false };
}

export function sanitizeUserContactFields(user, options = {}) {
  if (!user) return user;
  const { phone, email } = getProfileContactVisibility(user, options);
  return {
    ...user,
    phone: phone ? user.phone : null,
    email: email ? user.email : null,
  };
}

export function canShareContactInMessage(user, profile, isPremiumViewer) {
  if (isSeedProfileUser(user, profile)) return false;
  return !!(isPremiumViewer && (user?.phone || user?.email) && !profile?.hidePhone);
}
