/**
 * Blocks temporary / disposable email domains at registration.
 * Extend this list as needed.
 */
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'sharklasers.com', 'grr.la', 'guerrillamailblock.com', 'pokemail.net', 'spam4.me',
  'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'tempmail.net', 'tempmailo.com',
  'throwaway.email', 'yopmail.com', 'yopmail.fr', 'yopmail.net',
  '10minutemail.com', '10minutemail.net', 'minutemail.com',
  'fakeinbox.com', 'trashmail.com', 'trashmail.me', 'trashmail.net',
  'getnada.com', 'nada.email', 'dispostable.com', 'maildrop.cc',
  'mailnesia.com', 'mintemail.com', 'mytemp.email', 'emailondeck.com',
  'spamgourmet.com', 'mailcatch.com', 'inboxkitten.com', 'getairmail.com',
  'mail.tm', 'tempail.com', 'tempr.email', 'discard.email', 'discardmail.com',
  'burnermail.io', 'mohmal.com', 'emailfake.com', 'crazymailing.com',
  'mailforspam.com', 'spambox.us', 'spamfree24.org', 'mailnull.com',
  'jetable.org', 'mailcatch.com', 'meltmail.com', 'spamherelots.com',
  'mailscrap.com', 'tmpmail.net', 'tmpmail.org', 'fakemailgenerator.com',
  'mailnator.com', 'spambox.xyz', 'inboxbear.com', 'mailpoof.com',
]);

export function getEmailDomain(email) {
  if (!email || typeof email !== 'string') return '';
  const parts = email.toLowerCase().trim().split('@');
  return parts.length === 2 ? parts[1] : '';
}

export function isDisposableEmail(email) {
  const domain = getEmailDomain(email);
  if (!domain) return false;
  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  // Subdomains of known disposable providers
  for (const blocked of DISPOSABLE_DOMAINS) {
    if (domain.endsWith(`.${blocked}`)) return true;
  }
  return false;
}

export const DISPOSABLE_EMAIL_MESSAGE =
  'Temporary or disposable email addresses are not allowed. Please use a permanent email address to register on Vivah Dwar.';
