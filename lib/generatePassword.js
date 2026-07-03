import { randomBytes } from 'crypto';

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghjkmnpqrstuvwxyz';
const DIGITS = '23456789';

function pick(chars, byte) {
  return chars[byte % chars.length];
}

/** Secure, readable password for admin resets — e.g. Vivah@K7mX2p */
export function generateUserPassword() {
  const bytes = randomBytes(12);
  let suffix = '';
  suffix += pick(UPPER, bytes[0]);
  suffix += pick(LOWER, bytes[1]);
  suffix += pick(DIGITS, bytes[2]);
  for (let i = 3; i < 8; i++) {
    const pool = UPPER + LOWER + DIGITS;
    suffix += pick(pool, bytes[i]);
  }
  return `Vivah@${suffix}`;
}
