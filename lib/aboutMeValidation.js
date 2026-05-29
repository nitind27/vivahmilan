export const ABOUT_ME_MIN_WORDS = 50;
export const ABOUT_ME_MAX_WORDS = 4000;

/** Count words (whitespace-separated tokens). Works for English + Hindi mixed text. */
export function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * @param {string|null|undefined} text
 * @param {{ required?: boolean }} opts
 */
export function validateAboutMe(text, { required = false } = {}) {
  const trimmed = (text || '').trim();

  if (!trimmed) {
    if (required) {
      return {
        ok: false,
        wordCount: 0,
        error: `About Me is required. Please write at least ${ABOUT_ME_MIN_WORDS} words about yourself.`,
      };
    }
    return { ok: true, wordCount: 0 };
  }

  const wordCount = countWords(trimmed);

  if (wordCount < ABOUT_ME_MIN_WORDS) {
    return {
      ok: false,
      wordCount,
      error: `About Me must be at least ${ABOUT_ME_MIN_WORDS} words (currently ${wordCount}). Apne bare mein aur likhein.`,
    };
  }

  if (wordCount > ABOUT_ME_MAX_WORDS) {
    return {
      ok: false,
      wordCount,
      error: `About Me cannot exceed ${ABOUT_ME_MAX_WORDS} words (currently ${wordCount}).`,
    };
  }

  return { ok: true, wordCount };
}

/** Server-side guard when aboutMe is included in a save payload. */
export function assertAboutMeForSave(aboutMe, { required = false } = {}) {
  const result = validateAboutMe(aboutMe, { required });
  if (!result.ok) {
    return { error: result.error, wordCount: result.wordCount, code: 'ABOUT_ME_INVALID' };
  }
  return null;
}
