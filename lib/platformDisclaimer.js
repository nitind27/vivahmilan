/** Vivah Dwar platform notices — register, onboarding, uploads */

export const PLATFORM_DOMAIN = 'vivahdwar.com';
export const PLATFORM_NAME = 'Vivah Dwar';

export const GENERAL_NOTICE = {
  title: `${PLATFORM_NAME} — Genuine matrimonial platform`,
  body: `${PLATFORM_DOMAIN} is built only for genuine individuals seeking marriage. False profiles, commercial misuse, paid matchmaking agencies, or marriage-bureau activity on this platform is strictly prohibited and may be reported to law enforcement.`,
};

export const UPLOAD_NOTICE = {
  title: 'Your uploads — your responsibility',
  body: `Any profile photo, family photo, identity document, or other file you upload on ${PLATFORM_DOMAIN} is uploaded by you at your own responsibility. ${PLATFORM_NAME} does not guarantee the accuracy, authenticity, or legality of user-uploaded content and is not liable for disputes arising from photos or documents shared by members. You confirm that your uploads are genuine, belong to you (or your family with consent), and comply with Indian law.`,
  bullets: [
    'Use only real, recent photos of yourself',
    'ID documents must be yours and clearly readable',
    'Do not upload others’ photos or forged documents',
    'Misuse may lead to account suspension or legal action',
  ],
};

export const REGISTER_AGREEMENT_LABEL =
  `I understand that ${PLATFORM_DOMAIN} is for genuine marriage seekers only, and I accept that photos/documents I upload later are my own responsibility.`;

export const SUBMIT_AGREEMENT_LABEL =
  `I confirm all information and uploads on ${PLATFORM_DOMAIN} are true, and I accept that ${PLATFORM_NAME} is not responsible for the authenticity of user-submitted photos or documents.`;
