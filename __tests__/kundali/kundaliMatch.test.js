import { computeKundaliMatch } from '../lib/kundaliMatch.js';

const sampleA = {
  rashi: 'Cancer',
  nakshatra: 'Pushya',
  lagna: 'Leo',
  manglik: false,
};

const sampleB = {
  rashi: 'Pisces',
  nakshatra: 'Revati',
  lagna: 'Virgo',
  manglik: false,
};

describe('computeKundaliMatch', () => {
  it('returns 8 kootas and total between 0 and 36', () => {
    const match = computeKundaliMatch(
      sampleA,
      sampleB,
      { gender: 'MALE' },
      { gender: 'FEMALE' },
      'Rahul',
      'Priya'
    );
    expect(match.totalGunas).toBeGreaterThanOrEqual(0);
    expect(match.totalGunas).toBeLessThanOrEqual(36);
    expect(Object.keys(match.kootas)).toHaveLength(8);
    expect(match.groom.name).toBe('Rahul');
    expect(match.bride.name).toBe('Priya');
    expect(match.percentage).toBeGreaterThanOrEqual(0);
    expect(match.verdict).toBeTruthy();
  });

  it('cancels manglik when both are manglik', () => {
    const match = computeKundaliMatch(
      { ...sampleA, manglik: true },
      { ...sampleB, manglik: true },
      { gender: 'MALE' },
      { gender: 'FEMALE' }
    );
    expect(match.manglik.status).toBe('cancelled');
    expect(match.manglik.compatible).toBe(true);
  });

  it('flags manglik dosha when only one is manglik', () => {
    const match = computeKundaliMatch(
      { ...sampleA, manglik: true },
      { ...sampleB, manglik: false },
      { gender: 'MALE' },
      { gender: 'FEMALE' }
    );
    expect(match.manglik.status).toBe('dosha');
    expect(match.manglik.compatible).toBe(false);
  });
});
