/**
 * Vedic Kundali Calculator
 * Uses astronomia library for astronomical calculations.
 * Applies Lahiri ayanamsa to convert tropical → sidereal positions.
 */

const { julian, sidereal, planetposition, moonposition } = require('astronomia');
const vsop87Bearth = require('astronomia/data/vsop87Bearth');
const vsop87Bmars = require('astronomia/data/vsop87Bmars');
const vsop87Bmercury = require('astronomia/data/vsop87Bmercury');
const vsop87Bjupiter = require('astronomia/data/vsop87Bjupiter');
const vsop87Bvenus = require('astronomia/data/vsop87Bvenus');
const vsop87Bsaturn = require('astronomia/data/vsop87Bsaturn');

const TAU = 2 * Math.PI;
const DEG = 180 / Math.PI;
const RAD = Math.PI / 180;

// ── Constants ────────────────────────────────────────────────────────────────

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

// Vimshottari Dasha: planet → years in cycle
const VIMSHOTTARI_ORDER = [
  { planet: 'Ketu',    years: 7  },
  { planet: 'Venus',   years: 20 },
  { planet: 'Sun',     years: 6  },
  { planet: 'Moon',    years: 10 },
  { planet: 'Mars',    years: 7  },
  { planet: 'Rahu',    years: 18 },
  { planet: 'Jupiter', years: 16 },
  { planet: 'Saturn',  years: 19 },
  { planet: 'Mercury', years: 17 },
];

// Nakshatra → starting Dasha planet (0-indexed into VIMSHOTTARI_ORDER)
const NAKSHATRA_DASHA_LORD = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, // Ashwini–Ashlesha
  0, 1, 2, 3, 4, 5, 6, 7, 8, // Magha–Jyeshtha
  0, 1, 2, 3, 4, 5, 6, 7, 8, // Mula–Revati
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Normalize angle to [0, 360) degrees */
function normDeg(deg) {
  return ((deg % 360) + 360) % 360;
}

/** Normalize angle to [0, 2π) radians */
function normRad(rad) {
  return ((rad % TAU) + TAU) % TAU;
}

/**
 * Lahiri ayanamsa in degrees for a given Julian Day.
 * Uses the standard formula: 23.85° at J2000 with ~50.3"/year precession.
 */
function lahiriAyanamsa(jd) {
  const T = (jd - 2451545.0) / 36525.0; // Julian centuries from J2000
  return 23.85 + (T * 50.3 / 3600);
}

/**
 * Convert tropical longitude (degrees) to sidereal by subtracting ayanamsa.
 */
function toSidereal(tropicalDeg, ayanamsa) {
  return normDeg(tropicalDeg - ayanamsa);
}

/**
 * Get Rashi (sign) name and degree within sign from sidereal longitude.
 */
function rashiFromLon(siderealDeg) {
  const idx = Math.floor(siderealDeg / 30) % 12;
  const degree = siderealDeg % 30;
  return { sign: RASHI_NAMES[idx], degree: parseFloat(degree.toFixed(4)) };
}

/**
 * Compute house number (1–12) for a planet given its sidereal longitude and Lagna longitude.
 * House 1 starts at Lagna sign.
 */
function houseFromLon(planetSiderealDeg, lagnaSiderealDeg) {
  const lagnaSign = Math.floor(lagnaSiderealDeg / 30);
  const planetSign = Math.floor(planetSiderealDeg / 30);
  const house = ((planetSign - lagnaSign + 12) % 12) + 1;
  return house;
}

/**
 * Compute geocentric tropical longitude (degrees) for a planet using VSOP87.
 * For outer planets: geocentric = heliocentric planet - heliocentric earth + 180°
 * For inner planets (Mercury, Venus): same formula applies.
 */
function planetTropicalLon(planetObj, earthObj, jd) {
  const pPos = planetObj.position(jd);
  const ePos = earthObj.position(jd);
  // Heliocentric ecliptic longitude in radians
  const pLon = normRad(pPos._ra);
  const eLon = normRad(ePos._ra);
  // Geocentric longitude: planet - earth + π (approximate, ignoring light-time)
  const geoLon = normRad(pLon - eLon + Math.PI);
  return normDeg(geoLon * DEG);
}

/**
 * Compute Sun's geocentric tropical longitude.
 */
function sunTropicalLon(earthObj, jd) {
  const ePos = earthObj.position(jd);
  const eLon = normRad(ePos._ra);
  // Sun geocentric = earth heliocentric + 180°
  return normDeg((eLon + Math.PI) * DEG);
}

/**
 * Compute Moon's tropical longitude using astronomia/moonposition.
 */
function moonTropicalLon(jd) {
  const pos = moonposition.position(jd);
  return normDeg(pos._ra * DEG);
}

/**
 * Compute Lagna (Ascendant) tropical longitude from GMST, longitude, and latitude.
 * Uses the standard formula for the ecliptic ascendant.
 *
 * @param {number} jd - Julian Day (UT)
 * @param {number} lat - Geographic latitude in degrees
 * @param {number} lng - Geographic longitude in degrees (east positive)
 * @returns {number} Tropical ascendant longitude in degrees
 */
function computeLagnaTropical(jd, lat, lng) {
  // Greenwich Mean Sidereal Time in radians (normalized)
  const gmst = normRad(sidereal.mean(jd));
  // Local Sidereal Time in radians
  const lst = normRad(gmst + lng * RAD);
  // RAMC (Right Ascension of Midheaven) = LST
  const ramc = lst;

  // Obliquity of ecliptic (approximate)
  const T = (jd - 2451545.0) / 36525.0;
  const eps = (23.439291111 - 0.013004167 * T) * RAD;

  const latRad = lat * RAD;

  // Ascendant formula
  // tan(Asc) = -cos(RAMC) / (sin(eps)*tan(lat) + cos(eps)*sin(RAMC))
  const numerator = -Math.cos(ramc);
  const denominator = Math.sin(eps) * Math.tan(latRad) + Math.cos(eps) * Math.sin(ramc);

  let asc = Math.atan2(numerator, denominator) * DEG;
  asc = normDeg(asc);

  // Determine correct quadrant based on RAMC
  const ramcDeg = normDeg(ramc * DEG);
  // The ascendant should be in the eastern hemisphere
  // Adjust quadrant: if RAMC is in 0-180, asc should be in 180-360 range, and vice versa
  if (ramcDeg >= 0 && ramcDeg < 180) {
    if (asc < 180) asc += 180;
  } else {
    if (asc >= 180) asc -= 180;
  }

  return normDeg(asc);
}

/**
 * Compute Rahu (North Node) tropical longitude.
 * Uses the mean lunar node formula.
 */
function rahuTropicalLon(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  // Mean ascending node of Moon (degrees)
  const omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000;
  return normDeg(omega);
}

// ── Main Export ──────────────────────────────────────────────────────────────

/**
 * Calculate Vedic Kundali for given birth details.
 *
 * @param {string} birthDate   "YYYY-MM-DD"
 * @param {number} birthHour   1–12
 * @param {number} birthMinute 0–59
 * @param {string} birthPeriod "AM" | "PM"
 * @param {number} lat         -90 to 90
 * @param {number} lng         -180 to 180
 * @returns {{ lagna, rashi, nakshatra, manglik, planetaryPositions, dashaSequence }}
 * @throws {Error} with descriptive message on invalid input or calculation failure
 */
function calculateKundali(birthDate, birthHour, birthMinute, birthPeriod, lat, lng) {
  // ── Input Validation ──────────────────────────────────────────────────────
  if (!birthDate || typeof birthDate !== 'string') {
    throw new Error('Invalid birthDate: must be a non-empty string in YYYY-MM-DD format');
  }
  const dateMatch = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) {
    throw new Error('Invalid birthDate format: expected YYYY-MM-DD');
  }

  const year = parseInt(dateMatch[1], 10);
  const month = parseInt(dateMatch[2], 10);
  const day = parseInt(dateMatch[3], 10);

  if (month < 1 || month > 12) throw new Error('Invalid birthDate: month must be 1–12');
  if (day < 1 || day > 31) throw new Error('Invalid birthDate: day must be 1–31');

  if (typeof birthHour !== 'number' || !Number.isFinite(birthHour) ||
      birthHour < 1 || birthHour > 12) {
    throw new Error('Invalid birthHour: must be a number between 1 and 12');
  }
  if (typeof birthMinute !== 'number' || !Number.isFinite(birthMinute) ||
      birthMinute < 0 || birthMinute > 59) {
    throw new Error('Invalid birthMinute: must be a number between 0 and 59');
  }
  if (birthPeriod !== 'AM' && birthPeriod !== 'PM') {
    throw new Error('Invalid birthPeriod: must be "AM" or "PM"');
  }
  if (typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error('Invalid lat: must be a number between -90 and 90');
  }
  if (typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new Error('Invalid lng: must be a number between -180 and 180');
  }

  // ── Convert to UTC Julian Day ─────────────────────────────────────────────
  // Convert 12-hour to 24-hour
  let hour24 = birthHour % 12;
  if (birthPeriod === 'PM') hour24 += 12;

  // Fractional day
  const dayFrac = day + (hour24 + birthMinute / 60) / 24;
  const jd = julian.CalendarGregorianToJD(year, month, dayFrac);

  if (!Number.isFinite(jd)) {
    throw new Error('Failed to compute Julian Day from birth date/time');
  }

  // ── Ayanamsa ──────────────────────────────────────────────────────────────
  const ayanamsa = lahiriAyanamsa(jd);

  // ── Planet Objects ────────────────────────────────────────────────────────
  const earth = new planetposition.Planet(vsop87Bearth.default);
  const mars = new planetposition.Planet(vsop87Bmars.default);
  const mercury = new planetposition.Planet(vsop87Bmercury.default);
  const jupiter = new planetposition.Planet(vsop87Bjupiter.default);
  const venus = new planetposition.Planet(vsop87Bvenus.default);
  const saturn = new planetposition.Planet(vsop87Bsaturn.default);

  // ── Tropical Longitudes ───────────────────────────────────────────────────
  const tropicalLons = {
    Sun:     sunTropicalLon(earth, jd),
    Moon:    moonTropicalLon(jd),
    Mars:    planetTropicalLon(mars, earth, jd),
    Mercury: planetTropicalLon(mercury, earth, jd),
    Jupiter: planetTropicalLon(jupiter, earth, jd),
    Venus:   planetTropicalLon(venus, earth, jd),
    Saturn:  planetTropicalLon(saturn, earth, jd),
    Rahu:    rahuTropicalLon(jd),
  };
  // Ketu is exactly opposite Rahu
  tropicalLons.Ketu = normDeg(tropicalLons.Rahu + 180);

  // ── Sidereal Longitudes ───────────────────────────────────────────────────
  const siderealLons = {};
  for (const [graha, tLon] of Object.entries(tropicalLons)) {
    siderealLons[graha] = toSidereal(tLon, ayanamsa);
  }

  // ── Lagna (Ascendant) ─────────────────────────────────────────────────────
  const lagnaTropical = computeLagnaTropical(jd, lat, lng);
  const lagnaSidereal = toSidereal(lagnaTropical, ayanamsa);
  const lagnaRashi = rashiFromLon(lagnaSidereal);

  // ── Planetary Positions ───────────────────────────────────────────────────
  const GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const planetaryPositions = {};

  for (const graha of GRAHAS) {
    const sLon = siderealLons[graha];
    const { sign, degree } = rashiFromLon(sLon);
    const house = houseFromLon(sLon, lagnaSidereal);
    planetaryPositions[graha] = { house, sign, degree };
  }

  // ── Rashi (Moon's sidereal sign) ──────────────────────────────────────────
  const rashi = planetaryPositions.Moon.sign;

  // ── Nakshatra (Moon's nakshatra) ──────────────────────────────────────────
  const moonSiderealDeg = siderealLons.Moon;
  const nakshatraIndex = Math.floor(moonSiderealDeg / (360 / 27)) % 27;
  const nakshatra = NAKSHATRA_NAMES[nakshatraIndex];

  // ── Manglik ───────────────────────────────────────────────────────────────
  const manglikHouses = [1, 4, 7, 8, 12];
  const manglik = manglikHouses.includes(planetaryPositions.Mars.house);

  // ── Vimshottari Dasha ─────────────────────────────────────────────────────
  const dashaSequence = computeVimshottariDasha(moonSiderealDeg, birthDate, hour24, birthMinute);

  return {
    lagna: lagnaRashi.sign,
    rashi,
    nakshatra,
    manglik,
    planetaryPositions,
    dashaSequence,
  };
}

/**
 * Compute Vimshottari Dasha sequence starting from birth.
 *
 * @param {number} moonSiderealDeg - Moon's sidereal longitude in degrees
 * @param {string} birthDate - "YYYY-MM-DD"
 * @param {number} hour24 - 0–23
 * @param {number} minute - 0–59
 * @returns {Array<{ planet, startDate, endDate }>}
 */
function computeVimshottariDasha(moonSiderealDeg, birthDate, hour24, minute) {
  // Each nakshatra spans 360/27 = 13.333... degrees
  const nakshatraSpan = 360 / 27;
  const nakshatraIndex = Math.floor(moonSiderealDeg / nakshatraSpan) % 27;
  const posWithinNakshatra = moonSiderealDeg % nakshatraSpan;
  const fractionElapsed = posWithinNakshatra / nakshatraSpan;

  // Starting dasha lord index in VIMSHOTTARI_ORDER
  const startLordIdx = NAKSHATRA_DASHA_LORD[nakshatraIndex];
  const startLord = VIMSHOTTARI_ORDER[startLordIdx];

  // Years already elapsed in the starting dasha
  const yearsElapsed = fractionElapsed * startLord.years;
  const yearsRemaining = startLord.years - yearsElapsed;

  // Birth datetime as JS Date
  const [y, m, d] = birthDate.split('-').map(Number);
  const birthDt = new Date(Date.UTC(y, m - 1, d, hour24, minute, 0));

  const sequence = [];
  let currentDate = new Date(birthDt);

  // First dasha: partial (remaining years)
  const firstEnd = addYears(currentDate, yearsRemaining);
  sequence.push({
    planet: startLord.planet,
    startDate: formatDate(currentDate),
    endDate: formatDate(firstEnd),
  });
  currentDate = firstEnd;

  // Subsequent dashas: full cycles until we cover 120 years total
  // We need to cover the full 120-year cycle from birth
  // Total dashas = 9 (one full cycle), but we start mid-cycle
  // So we go through the remaining lords in order, then wrap around
  let totalYearsCovered = yearsRemaining;
  let lordIdx = (startLordIdx + 1) % 9;

  while (totalYearsCovered < 120) {
    const lord = VIMSHOTTARI_ORDER[lordIdx];
    const yearsToAdd = Math.min(lord.years, 120 - totalYearsCovered);
    const endDate = addYears(currentDate, yearsToAdd);
    sequence.push({
      planet: lord.planet,
      startDate: formatDate(currentDate),
      endDate: formatDate(endDate),
    });
    currentDate = endDate;
    totalYearsCovered += yearsToAdd;
    lordIdx = (lordIdx + 1) % 9;
  }

  return sequence;
}

/**
 * Add fractional years to a Date object.
 * Uses 365.25 days/year for simplicity.
 */
function addYears(date, years) {
  const ms = years * 365.25 * 24 * 60 * 60 * 1000;
  return new Date(date.getTime() + ms);
}

/**
 * Format a Date as "YYYY-MM-DD".
 */
function formatDate(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export { calculateKundali };
