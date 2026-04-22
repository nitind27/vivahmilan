/**
 * Property-based tests for kundaliCalculator service.
 * Uses fast-check for property testing.
 */

const fc = require('fast-check');
const { calculateKundali } = require('../../lib/kundaliCalculator');

const RASHI_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

const GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

// Arbitrary for valid birth details (age >= 18)
// Generate birth year/month/day directly to avoid invalid Date issues
const validBirthDetailsArb = fc.record({
  birthDate: fc.record({
    year: fc.integer({ min: 1930, max: 2005 }),
    month: fc.integer({ min: 1, max: 12 }),
    day: fc.integer({ min: 1, max: 28 }), // use 28 to avoid month-end issues
  }).map(({ year, month, day }) => {
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  }),
  birthHour: fc.integer({ min: 1, max: 12 }),
  birthMinute: fc.integer({ min: 0, max: 59 }),
  birthPeriod: fc.constantFrom('AM', 'PM'),
  lat: fc.float({ min: Math.fround(-89.9), max: Math.fround(89.9), noNaN: true }),
  lng: fc.float({ min: Math.fround(-179.9), max: Math.fround(179.9), noNaN: true }),
});

// Feature: kundali-generation, Property 7: Calculator returns all valid fields for any valid input
describe('Property 7: Calculator returns all valid fields for any valid input', () => {
  it('should return valid lagna, rashi, nakshatra, and 9 planetary positions', () => {
    fc.assert(
      fc.property(validBirthDetailsArb, ({ birthDate, birthHour, birthMinute, birthPeriod, lat, lng }) => {
        const result = calculateKundali(birthDate, birthHour, birthMinute, birthPeriod, lat, lng);

        // lagna must be a valid Rashi name
        expect(RASHI_NAMES).toContain(result.lagna);

        // rashi must be a valid Rashi name
        expect(RASHI_NAMES).toContain(result.rashi);

        // nakshatra must be a valid Nakshatra name
        expect(NAKSHATRA_NAMES).toContain(result.nakshatra);

        // planetaryPositions must have exactly 9 grahas
        expect(Object.keys(result.planetaryPositions)).toHaveLength(9);
        for (const graha of GRAHAS) {
          expect(result.planetaryPositions).toHaveProperty(graha);
          const pos = result.planetaryPositions[graha];
          // house must be 1–12
          expect(pos.house).toBeGreaterThanOrEqual(1);
          expect(pos.house).toBeLessThanOrEqual(12);
          // sign must be a valid Rashi name
          expect(RASHI_NAMES).toContain(pos.sign);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: kundali-generation, Property 8: Manglik status matches Mars house placement
describe('Property 8: Manglik status matches Mars house placement', () => {
  it('should set manglik=true iff Mars is in house 1, 4, 7, 8, or 12', () => {
    fc.assert(
      fc.property(validBirthDetailsArb, ({ birthDate, birthHour, birthMinute, birthPeriod, lat, lng }) => {
        const result = calculateKundali(birthDate, birthHour, birthMinute, birthPeriod, lat, lng);
        const marsHouse = result.planetaryPositions.Mars.house;
        const expectedManglik = [1, 4, 7, 8, 12].includes(marsHouse);
        expect(result.manglik).toBe(expectedManglik);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: kundali-generation, Property 9: Dasha sequence covers full cycle with contiguous dates
describe('Property 9: Dasha sequence covers full cycle with contiguous dates', () => {
  it('should have contiguous dates and total duration of 120 years', () => {
    fc.assert(
      fc.property(validBirthDetailsArb, ({ birthDate, birthHour, birthMinute, birthPeriod, lat, lng }) => {
        const result = calculateKundali(birthDate, birthHour, birthMinute, birthPeriod, lat, lng);
        const dasha = result.dashaSequence;

        // Must be non-empty
        expect(dasha.length).toBeGreaterThan(0);

        // Each entry's endDate must equal next entry's startDate
        for (let i = 0; i < dasha.length - 1; i++) {
          expect(dasha[i].endDate).toBe(dasha[i + 1].startDate);
        }

        // Total duration must be 120 years (within 1 day tolerance due to date rounding)
        const startMs = new Date(dasha[0].startDate).getTime();
        const endMs = new Date(dasha[dasha.length - 1].endDate).getTime();
        const totalYears = (endMs - startMs) / (365.25 * 24 * 60 * 60 * 1000);
        expect(totalYears).toBeCloseTo(120, 0); // within ~0.5 year tolerance
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: kundali-generation, Property 10: Calculator error produces no partial data
describe('Property 10: Calculator error produces no partial data', () => {
  it('should throw Error with non-empty message for invalid coordinates', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Invalid lat (> 90)
          fc.record({
            birthDate: fc.constant('1990-01-01'),
            birthHour: fc.constant(12),
            birthMinute: fc.constant(0),
            birthPeriod: fc.constant('PM'),
            lat: fc.float({ min: Math.fround(91), max: Math.fround(999), noNaN: true }),
            lng: fc.float({ min: Math.fround(-179.9), max: Math.fround(179.9), noNaN: true }),
          }),
          // Invalid lng (> 180)
          fc.record({
            birthDate: fc.constant('1990-01-01'),
            birthHour: fc.constant(12),
            birthMinute: fc.constant(0),
            birthPeriod: fc.constant('PM'),
            lat: fc.float({ min: Math.fround(-89.9), max: Math.fround(89.9), noNaN: true }),
            lng: fc.float({ min: Math.fround(181), max: Math.fround(999), noNaN: true }),
          }),
        ),
        ({ birthDate, birthHour, birthMinute, birthPeriod, lat, lng }) => {
          let threw = false;
          let result = undefined;
          try {
            result = calculateKundali(birthDate, birthHour, birthMinute, birthPeriod, lat, lng);
          } catch (e) {
            threw = true;
            // Error must have a non-empty message
            expect(e).toBeInstanceOf(Error);
            expect(e.message.length).toBeGreaterThan(0);
          }
          // Must have thrown — no partial result returned
          expect(threw).toBe(true);
          expect(result).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
