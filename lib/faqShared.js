export const FAQ_CATEGORIES = [
  'General',
  'Account & Profile',
  'Matches & Interests',
  'Chat & Messaging',
  'Subscription & Payments',
  'Safety & Privacy',
];

export const FAQ_ICONS = [
  'HelpCircle',
  'User',
  'Heart',
  'MessageCircle',
  'CreditCard',
  'Shield',
  'Bell',
  'Settings',
  'BookOpen',
  'Star',
];

export function groupFaqsByCategory(items) {
  const map = new Map();
  for (const item of items) {
    const cat = item.category || 'General';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(item);
  }
  return [...map.entries()].map(([category, faqs]) => ({
    category,
    faqs: faqs.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
  }));
}
