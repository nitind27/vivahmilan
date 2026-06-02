/**
 * Official Vivah Dwar support & office contact (single source of truth).
 */

export const SUPPORT_EMAIL = 'supportvivahdwar@gmail.com';
export const SUPPORT_PHONE_RAW = '8735995467';
export const SUPPORT_PHONE_DISPLAY = '+91 87359 95467';
export const SUPPORT_PHONE_TEL = '+918735995467';
export const SUPPORT_WHATSAPP_URL = 'https://wa.me/918735995467';

export const OFFICE_ADDRESS = {
  line1: '3rd Floor, Anupam Amenity Centre',
  line2: 'Udhna, Surat, Gujarat, India',
  short: '3rd Floor, Anupam Amenity Centre, Udhna',
  multiline: '3rd Floor, Anupam Amenity Centre\nUdhna, Surat, Gujarat, India',
};

export const SUPPORT_HOURS = '24 hours';
export const SUPPORT_HOURS_SUB = 'Available every day, including weekends and holidays';

/** Used by portal API, profile-launch, Flutter, etc. */
export const SITE_CONTACT = {
  phone: SUPPORT_PHONE_RAW,
  phoneDisplay: SUPPORT_PHONE_DISPLAY,
  phoneTel: SUPPORT_PHONE_TEL,
  email: SUPPORT_EMAIL,
  whatsappUrl: SUPPORT_WHATSAPP_URL,
  address: OFFICE_ADDRESS,
  supportHours: SUPPORT_HOURS,
  supportHoursSub: SUPPORT_HOURS_SUB,
};

/** @deprecated Use SITE_CONTACT — kept for existing imports */
export const PORTAL_CONTACT = SITE_CONTACT;

/** Contact page cards */
export function getPublicContactCards() {
  return [
    {
      icon: 'mail',
      label: 'Email Support',
      value: SUPPORT_EMAIL,
      sub: 'We typically reply within 24 hours',
      href: `mailto:${SUPPORT_EMAIL}`,
    },
    {
      icon: 'phone',
      label: 'Phone Support',
      value: SUPPORT_PHONE_DISPLAY,
      sub: SUPPORT_HOURS,
      href: `tel:${SUPPORT_PHONE_TEL}`,
    },
    {
      icon: 'map',
      label: 'Office Address',
      value: OFFICE_ADDRESS.line1,
      sub: OFFICE_ADDRESS.line2,
      href: null,
    },
    {
      icon: 'clock',
      label: 'Support Hours',
      value: SUPPORT_HOURS,
      sub: SUPPORT_HOURS_SUB,
      href: null,
    },
  ];
}
