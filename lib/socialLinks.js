import { getSiteConfig } from '@/lib/siteconfig';

export const SOCIAL_CONFIG_KEYS = {
  facebook: 'social_facebook_url',
  instagram: 'social_instagram_url',
  youtube: 'social_youtube_url',
  whatsapp: 'social_whatsapp_url',
};

export const SOCIAL_LINK_DEFAULTS = {
  social_facebook_url: 'https://facebook.com/',
  social_instagram_url: 'https://www.instagram.com/vivah_dwar?igsh=empvN3VqZzN2OHZk',
  social_youtube_url: 'https://youtube.com/@vivahdwar',
  social_whatsapp_url: 'https://wa.me/918735995467',
};

/** @returns {Promise<{ facebook: string, instagram: string, youtube: string, whatsapp: string }>} */
export async function getSocialLinks() {
  const [facebook, instagram, youtube, whatsapp] = await Promise.all([
    getSiteConfig(SOCIAL_CONFIG_KEYS.facebook),
    getSiteConfig(SOCIAL_CONFIG_KEYS.instagram),
    getSiteConfig(SOCIAL_CONFIG_KEYS.youtube),
    getSiteConfig(SOCIAL_CONFIG_KEYS.whatsapp),
  ]);

  return {
    facebook: facebook?.trim() || '',
    instagram: instagram?.trim() || '',
    youtube: youtube?.trim() || '',
    whatsapp: whatsapp?.trim() || '',
  };
}
