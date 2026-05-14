/**
 * Vedic Kundali Calculator
 * Uses astronomia library for VSOP87 planetary positions.
 * Applies Lahiri (Chitrapaksha) ayanamsa to convert tropical → sidereal.
 *
 * Key fixes:
 * - Uses ecliptic longitude (_lon) not right ascension (_ra)
 * - Correct Lahiri ayanamsa formula (IAU standard)
 * - Correct Lagna (ascendant) quadrant resolution
 * - Birth time treated as local time; converted to UT via longitude offset
 */

const { julian, sidereal, planetposition, moonposition } = require('astronomia');
const vsop87Bearth   = require('astronomia/data/vsop87Bearth');
const vsop87Bmars    = require('astronomia/data/vsop87Bmars');
const vsop87Bmercury = require('astronomia/data/vsop87Bmercury');
const vsop87Bjupiter = require('astronomia/data/vsop87Bjupiter');
const vsop87Bvenus   = require('astronomia/data/vsop87Bvenus');
const vsop87Bsaturn  = require('astronomia/data/vsop87Bsaturn');

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

// Vimshottari Dasha order and durations (total = 120 years)
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

// Each nakshatra maps to a dasha lord (0-indexed into VIMSHOTTARI_ORDER)
const NAKSHATRA_DASHA_LORD = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, // Ashwini–Ashlesha  (Ketu–Mercury)
  0, 1, 2, 3, 4, 5, 6, 7, 8, // Magha–Jyeshtha
  0, 1, 2, 3, 4, 5, 6, 7, 8, // Mula–Revati
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function normDeg(deg) {
  return ((deg % 360) + 360) % 360;
}

function normRad(rad) {
  return ((rad % TAU) + TAU) % TAU;
}

/**
 * Lahiri (Chitrapaksha) ayanamsa — IAU standard formula.
 * Reference epoch: JD 2396758.0 (22 Jan 1900 UT), ayanamsa = 22°27'38" = 22.4606°
 * Annual precession rate: 50.2564" per year = 0.013960° per year
 */
function lahiriAyanamsa(jd) {
  const T = (jd - 2451545.0) / 36525.0; // Julian centuries from J2000.0
  // Lahiri ayanamsa at J2000.0 ≈ 23.853°, precession ≈ 50.2564"/yr
  const ayanamsa = 23.853 + T * (50.2564 / 3600) * 100;
  return normDeg(ayanamsa);
}

function toSidereal(tropicalDeg, ayanamsa) {
  return normDeg(tropicalDeg - ayanamsa);
}

function rashiFromLon(siderealDeg) {
  const idx = Math.floor(siderealDeg / 30) % 12;
  const degree = siderealDeg % 30;
  return { sign: RASHI_NAMES[idx], degree: parseFloat(degree.toFixed(4)) };
}

function houseFromLon(planetSiderealDeg, lagnaSiderealDeg) {
  const lagnaSign  = Math.floor(lagnaSiderealDeg / 30);
  const planetSign = Math.floor(planetSiderealDeg / 30);
  return ((planetSign - lagnaSign + 12) % 12) + 1;
}

/**
 * Geocentric ecliptic longitude of a planet (degrees, tropical).
 * Uses VSOP87 heliocentric positions; converts to geocentric.
 * FIX: uses ._lon (ecliptic longitude) not ._ra (right ascension).
 */
function planetTropicalLon(planetObj, earthObj, jd) {
  const pPos = planetObj.position(jd);
  const ePos = earthObj.position(jd);

  // VSOP87B gives heliocentric ecliptic longitude in radians via ._lon
  // Fall back to ._ra if ._lon is not available (older astronomia versions)
  const pLon = normRad(pPos._lon !== undefined ? pPos._lon : pPos._ra);
  const eLon = normRad(ePos._lon !== undefined ? ePos._lon : ePos._ra);

  // Geocentric = heliocentric_planet - heliocentric_earth + 180°
  const geoLon = normRad(pLon - eLon + Math.PI);
  return normDeg(geoLon * DEG);
}

/**
 * Sun's geocentric tropical longitude (degrees).
 * Sun geocentric = Earth heliocentric + 180°.
 */
function sunTropicalLon(earthObj, jd) {
  const ePos = earthObj.position(jd);
  const eLon = normRad(ePos._lon !== undefined ? ePos._lon : ePos._ra);
  return normDeg((eLon + Math.PI) * DEG);
}

/**
 * Moon's tropical longitude using astronomia/moonposition.
 * moonposition.position() returns ecliptic coordinates; use ._lon.
 */
function moonTropicalLon(jd) {
  const pos = moonposition.position(jd);
  // moonposition returns { _lon, _lat, _delta } in radians
  const lon = pos._lon !== undefined ? pos._lon : pos._ra;
  return normDeg(lon * DEG);
}

/**
 * Rahu (Mean North Node) tropical longitude.
 * Standard mean node formula (IAU).
 */
function rahuTropicalLon(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  // Mean ascending node of Moon
  const omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000;
  return normDeg(omega);
}

/**
 * Compute Lagna (Ascendant) tropical longitude.
 *
 * Standard formula:
 *   tan(Asc) = -cos(RAMC) / (sin(ε)·tan(φ) + cos(ε)·sin(RAMC))
 *
 * Quadrant is resolved by checking which hemisphere the ascendant falls in
 * relative to the RAMC: the ascendant must be in the eastern half of the sky
 * (i.e., rising), so it is always 90°–270° away from the MC.
 *
 * @param {number} jd  - Julian Day (UT)
 * @param {number} lat - Geographic latitude (degrees, north positive)
 * @param {number} lng - Geographic longitude (degrees, east positive)
 */
function computeLagnaTropical(jd, lat, lng) {
  // Local Sidereal Time (radians)
  const gmst = normRad(sidereal.mean(jd));
  const lst  = normRad(gmst + lng * RAD);
  const ramc = lst; // RAMC = LST

  // Obliquity of ecliptic
  const T   = (jd - 2451545.0) / 36525.0;
  const eps = (23.439291111 - 0.013004167 * T) * RAD;

  const latRad = lat * RAD;

  // Ascendant formula
  const num = -Math.cos(ramc);
  const den =  Math.sin(eps) * Math.tan(latRad) + Math.cos(eps) * Math.sin(ramc);

  // atan2 gives result in (-180, 180]; shift to [0, 360)
  let asc = normDeg(Math.atan2(num, den) * DEG);

  // Quadrant correction:
  // The MC (Midheaven) is at RAMC converted to ecliptic longitude.
  // The Ascendant must be exactly 90° east of the MC on the ecliptic,
  // meaning it should be in the opposite semicircle from the MC + 180°.
  // Simpler rule: atan2 gives two possible solutions 180° apart.
  // The correct one is the one where the ecliptic is actually rising
  // (eastern horizon). We pick the solution where asc is in the
  // quadrant consistent with RAMC:
  //   RAMC 0–180°  → Asc should be in 0–180° (eastern sky rising)
  //   RAMC 180–360° → Asc should be in 180–360°
  const ramcDeg = normDeg(ramc * DEG);

  // The ascendant sign index must be consistent with LST quadrant
  // Use the MC longitude to anchor the correct quadrant
  const mcLon = normDeg(Math.atan2(Math.sin(ramc) * Math.cos(eps) - Math.tan(0) * Math.sin(eps), Math.cos(ramc)) * DEG);

  // Ascendant is always ~90° ahead of MC (in the direction of increasing longitude)
  // If our atan2 result is more than 90° away from MC+90, flip by 180°
  const expectedAsc = normDeg(mcLon + 90);
  const diff = normDeg(asc - expectedAsc);
  if (diff > 90 && diff < 270) {
    asc = normDeg(asc + 180);
  }

  return asc;
}

// ── Main Export ──────────────────────────────────────────────────────────────

/**
 * Calculate Vedic Kundali for given birth details.
 *
 * Birth time is treated as LOCAL time at the birth location.
 * It is converted to UT by subtracting the longitude-based timezone offset
 * (lng / 15 hours), which is the standard astronomical approximation.
 *
 * @param {string} birthDate   "YYYY-MM-DD"
 * @param {number} birthHour   1–12
 * @param {number} birthMinute 0–59
 * @param {string} birthPeriod "AM" | "PM"
 * @param {number} lat         -90 to 90
 * @param {number} lng         -180 to 180
 */
function calculateKundali(birthDate, birthHour, birthMinute, birthPeriod, lat, lng) {
  // ── Validation ────────────────────────────────────────────────────────────
  if (!birthDate || typeof birthDate !== 'string')
    throw new Error('Invalid birthDate: must be a non-empty string in YYYY-MM-DD format');

  const dateMatch = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) throw new Error('Invalid birthDate format: expected YYYY-MM-DD');

  const year  = parseInt(dateMatch[1], 10);
  const month = parseInt(dateMatch[2], 10);
  const day   = parseInt(dateMatch[3], 10);

  if (month < 1 || month > 12) throw new Error('Invalid birthDate: month must be 1–12');
  if (day   < 1 || day   > 31) throw new Error('Invalid birthDate: day must be 1–31');

  if (typeof birthHour !== 'number' || !Number.isFinite(birthHour) || birthHour < 1 || birthHour > 12)
    throw new Error('Invalid birthHour: must be 1–12');
  if (typeof birthMinute !== 'number' || !Number.isFinite(birthMinute) || birthMinute < 0 || birthMinute > 59)
    throw new Error('Invalid birthMinute: must be 0–59');
  if (birthPeriod !== 'AM' && birthPeriod !== 'PM')
    throw new Error('Invalid birthPeriod: must be "AM" or "PM"');
  if (typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90)
    throw new Error('Invalid lat: must be -90 to 90');
  if (typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180)
    throw new Error('Invalid lng: must be -180 to 180');

  // ── Local time → UT ───────────────────────────────────────────────────────
  let hour24 = birthHour % 12;
  if (birthPeriod === 'PM') hour24 += 12;

  // Convert local time to UT using longitude offset (lng/15 = hours from UTC)
  // This is the standard astronomical approximation for historical/unknown timezone
  const localHourDecimal = hour24 + birthMinute / 60;
  const utHourDecimal    = localHourDecimal - lng / 15;

  // Handle day rollover
  let utDay   = day;
  let utMonth = month;
  let utYear  = year;
  let utH     = utHourDecimal;

  if (utH < 0) {
    utH += 24;
    // Go back one day
    utDay -= 1;
    if (utDay < 1) {
      utMonth -= 1;
      if (utMonth < 1) { utMonth = 12; utYear -= 1; }
      const daysInMonth = new Date(utYear, utMonth, 0).getDate();
      utDay = daysInMonth;
    }
  } else if (utH >= 24) {
    utH -= 24;
    utDay += 1;
    const daysInMonth = new Date(utYear, utMonth, 0).getDate();
    if (utDay > daysInMonth) { utDay = 1; utMonth += 1; }
    if (utMonth > 12) { utMonth = 1; utYear += 1; }
  }

  const dayFrac = utDay + utH / 24;
  const jd = julian.CalendarGregorianToJD(utYear, utMonth, dayFrac);

  if (!Number.isFinite(jd)) throw new Error('Failed to compute Julian Day');

  // ── Ayanamsa ──────────────────────────────────────────────────────────────
  const ayanamsa = lahiriAyanamsa(jd);

  // ── Planet Objects ────────────────────────────────────────────────────────
  const earth   = new planetposition.Planet(vsop87Bearth.default);
  const mars    = new planetposition.Planet(vsop87Bmars.default);
  const mercury = new planetposition.Planet(vsop87Bmercury.default);
  const jupiter = new planetposition.Planet(vsop87Bjupiter.default);
  const venus   = new planetposition.Planet(vsop87Bvenus.default);
  const saturn  = new planetposition.Planet(vsop87Bsaturn.default);

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
  tropicalLons.Ketu = normDeg(tropicalLons.Rahu + 180);

  // ── Sidereal Longitudes ───────────────────────────────────────────────────
  const siderealLons = {};
  for (const [graha, tLon] of Object.entries(tropicalLons)) {
    siderealLons[graha] = toSidereal(tLon, ayanamsa);
  }

  // ── Lagna ─────────────────────────────────────────────────────────────────
  const lagnaTropical = computeLagnaTropical(jd, lat, lng);
  const lagnaSidereal = toSidereal(lagnaTropical, ayanamsa);
  const lagnaRashi    = rashiFromLon(lagnaSidereal);

  // ── Planetary Positions ───────────────────────────────────────────────────
  const GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const planetaryPositions = {};

  for (const graha of GRAHAS) {
    const sLon = siderealLons[graha];
    const { sign, degree } = rashiFromLon(sLon);
    const house = houseFromLon(sLon, lagnaSidereal);
    planetaryPositions[graha] = { house, sign, degree };
  }

  // ── Rashi & Nakshatra (Moon) ──────────────────────────────────────────────
  const rashi          = planetaryPositions.Moon.sign;
  const moonSiderealDeg = siderealLons.Moon;
  const nakshatraIndex = Math.floor(moonSiderealDeg / (360 / 27)) % 27;
  const nakshatra      = NAKSHATRA_NAMES[nakshatraIndex];

  // ── Manglik ───────────────────────────────────────────────────────────────
  const manglik = [1, 4, 7, 8, 12].includes(planetaryPositions.Mars.house);

  // ── Vimshottari Dasha ─────────────────────────────────────────────────────
  const dashaSequence = computeVimshottariDasha(moonSiderealDeg, utYear, utMonth, utDay, utH);

  return { lagna: lagnaRashi.sign, rashi, nakshatra, manglik, planetaryPositions, dashaSequence };
}

/**
 * Compute Vimshottari Dasha sequence from birth.
 */
function computeVimshottariDasha(moonSiderealDeg, year, month, day, hourDecimal) {
  const nakshatraSpan    = 360 / 27;
  const nakshatraIndex   = Math.floor(moonSiderealDeg / nakshatraSpan) % 27;
  const posWithinNakshatra = moonSiderealDeg % nakshatraSpan;
  const fractionElapsed  = posWithinNakshatra / nakshatraSpan;

  const startLordIdx  = NAKSHATRA_DASHA_LORD[nakshatraIndex];
  const startLord     = VIMSHOTTARI_ORDER[startLordIdx];
  const yearsElapsed  = fractionElapsed * startLord.years;
  const yearsRemaining = startLord.years - yearsElapsed;

  const hour = Math.floor(hourDecimal);
  const min  = Math.round((hourDecimal - hour) * 60);
  const birthDt = new Date(Date.UTC(year, month - 1, day, hour, min, 0));

  const sequence = [];
  let currentDate = new Date(birthDt);

  // First dasha (partial)
  const firstEnd = addYears(currentDate, yearsRemaining);
  sequence.push({ planet: startLord.planet, startDate: formatDate(currentDate), endDate: formatDate(firstEnd) });
  currentDate = firstEnd;

  let totalYearsCovered = yearsRemaining;
  let lordIdx = (startLordIdx + 1) % 9;

  while (totalYearsCovered < 120) {
    const lord       = VIMSHOTTARI_ORDER[lordIdx];
    const yearsToAdd = Math.min(lord.years, 120 - totalYearsCovered);
    const endDate    = addYears(currentDate, yearsToAdd);
    sequence.push({ planet: lord.planet, startDate: formatDate(currentDate), endDate: formatDate(endDate) });
    currentDate = endDate;
    totalYearsCovered += yearsToAdd;
    lordIdx = (lordIdx + 1) % 9;
  }

  return sequence;
}

function addYears(date, years) {
  return new Date(date.getTime() + years * 365.25 * 24 * 60 * 60 * 1000);
}

function formatDate(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export { calculateKundali };
