/**
 * Ashtakoot Guna Milan — pairwise kundali compatibility (36 points max).
 */

const RASHIS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

// Varna: Brahmin, Kshatriya, Vaishya, Shudra (by rashi index)
const VARNA = [2, 1, 4, 4, 1, 3, 4, 2, 1, 3, 3, 4];

const RASHI_LORD = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};

const LORD_FRIENDS = {
  Sun: ['Moon', 'Mars', 'Jupiter'],
  Moon: ['Sun', 'Mercury'],
  Mars: ['Sun', 'Moon', 'Jupiter'],
  Mercury: ['Sun', 'Venus'],
  Jupiter: ['Sun', 'Moon', 'Mars'],
  Venus: ['Mercury', 'Saturn'],
  Saturn: ['Mercury', 'Venus'],
};

const LORD_ENEMIES = {
  Sun: ['Venus', 'Saturn'],
  Moon: [],
  Mars: ['Mercury'],
  Mercury: ['Moon'],
  Jupiter: ['Mercury', 'Venus'],
  Venus: ['Sun', 'Moon'],
  Saturn: ['Sun', 'Moon', 'Mars'],
};

// Vashya groups: Chatushpada(0), Manav(1), Jal(2), Vanachara(3), Keet(4)
const VASHYA_GROUP = [0, 0, 1, 2, 3, 1, 1, 4, 0, 0, 1, 2];

const VASHYA_SCORE = [
  [2, 1, 1, 1.5, 1],
  [1, 2, 0.5, 0, 1],
  [1, 0.5, 2, 1, 1],
  [1.5, 0, 1, 2, 0],
  [1, 1, 1, 0, 2],
];

// Gana by nakshatra index (0=Deva, 1=Manushya, 2=Rakshasa)
const NAKSHATRA_GANA = [
  0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0,
];

const GANA_SCORE = [
  [6, 5, 1],
  [5, 6, 3],
  [1, 3, 6],
];

// Yoni by nakshatra (0-13 animal pairs)
const NAKSHATRA_YONI = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
];

const YONI_NAMES = [
  'Horse', 'Elephant', 'Sheep', 'Serpent', 'Dog', 'Cat', 'Rat', 'Cow',
  'Buffalo', 'Tiger', 'Deer', 'Monkey', 'Mongoose', 'Lion',
];

// Same yoni = 4, friendly = 3, neutral = 2, enemy = 0
const YONI_ENEMIES = [[1, 4], [0, 5], [2, 6], [3, 7], [8, 9], [10, 11]];

// Nadi: 0=Aadi, 1=Madhya, 2=Antya (repeating every 3 nakshatras offset)
const NAKSHATRA_NADI = [0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2];

function rashiIndex(name) {
  const i = RASHIS.indexOf(name);
  return i >= 0 ? i : 0;
}

function nakshatraIndex(name) {
  const i = NAKSHATRAS.indexOf(name);
  return i >= 0 ? i : 0;
}

function calcVarna(groomRashi, brideRashi) {
  const g = VARNA[rashiIndex(groomRashi)];
  const b = VARNA[rashiIndex(brideRashi)];
  if (g >= b) return { points: 1, max: 1, note: 'Compatible varna' };
  return { points: 0, max: 1, note: 'Varna mismatch' };
}

function calcVashya(groomRashi, brideRashi) {
  const g = VASHYA_GROUP[rashiIndex(groomRashi)];
  const b = VASHYA_GROUP[rashiIndex(brideRashi)];
  const pts = VASHYA_SCORE[g]?.[b] ?? 0;
  return { points: pts, max: 2, note: `${VASHYA_GROUP[g]}–${VASHYA_GROUP[b]} vashya` };
}

function calcTara(groomNak, brideNak) {
  const g = nakshatraIndex(groomNak);
  const b = nakshatraIndex(brideNak);
  const count = ((b - g + 27) % 27) + 1;
  const rem = count % 9 || 9;
  let pts = 0;
  if ([1, 3, 5, 7].includes(rem)) pts = 3;
  else if ([2, 4, 6, 8].includes(rem)) pts = 1.5;
  return { points: pts, max: 3, note: `Tara count ${count} (remainder ${rem})` };
}

function calcYoni(groomNak, brideNak) {
  const gy = NAKSHATRA_YONI[nakshatraIndex(groomNak)];
  const by = NAKSHATRA_YONI[nakshatraIndex(brideNak)];
  if (gy === by) return { points: 4, max: 4, note: `Same yoni (${YONI_NAMES[gy]})` };
  const isEnemy = YONI_ENEMIES.some(([a, b]) => (a === gy && b === by) || (a === by && b === gy));
  if (isEnemy) return { points: 0, max: 4, note: `Enemy yoni (${YONI_NAMES[gy]} vs ${YONI_NAMES[by]})` };
  return { points: 2, max: 4, note: `Neutral yoni (${YONI_NAMES[gy]} vs ${YONI_NAMES[by]})` };
}

function calcGrahaMaitri(groomRashi, brideRashi) {
  const gl = RASHI_LORD[groomRashi];
  const bl = RASHI_LORD[brideRashi];
  if (!gl || !bl) return { points: 2.5, max: 5, note: 'Partial graha maitri' };
  if (gl === bl) return { points: 5, max: 5, note: `Same lord (${gl})` };
  const gFriends = LORD_FRIENDS[gl] || [];
  const bFriends = LORD_FRIENDS[bl] || [];
  const gEnemies = LORD_ENEMIES[gl] || [];
  const bEnemies = LORD_ENEMIES[bl] || [];
  if (gFriends.includes(bl) && bFriends.includes(gl)) return { points: 5, max: 5, note: 'Mutual friends' };
  if (gEnemies.includes(bl) || bEnemies.includes(gl)) return { points: 0, max: 5, note: 'Enemy lords' };
  return { points: 2.5, max: 5, note: 'Neutral lordship' };
}

function calcGana(groomNak, brideNak) {
  const gg = NAKSHATRA_GANA[nakshatraIndex(groomNak)];
  const bg = NAKSHATRA_GANA[nakshatraIndex(brideNak)];
  const ganaNames = ['Deva', 'Manushya', 'Rakshasa'];
  const pts = GANA_SCORE[gg]?.[bg] ?? 0;
  return { points: pts, max: 6, note: `${ganaNames[gg]}–${ganaNames[bg]} gana` };
}

function calcBhakoot(groomRashi, brideRashi) {
  const g = rashiIndex(groomRashi);
  const b = rashiIndex(brideRashi);
  const diff = ((b - g + 12) % 12) + 1;
  const doshaPairs = [2, 12, 5, 9, 6, 8];
  if (doshaPairs.includes(diff)) {
    return { points: 0, max: 7, note: `Bhakoot dosha (${diff}th position)` };
  }
  if (diff === 1 || diff === 7) return { points: 7, max: 7, note: 'Excellent bhakoot' };
  return { points: 4, max: 7, note: `Bhakoot position ${diff}` };
}

function calcNadi(groomNak, brideNak) {
  const gn = NAKSHATRA_NADI[nakshatraIndex(groomNak)];
  const bn = NAKSHATRA_NADI[nakshatraIndex(brideNak)];
  const nadiNames = ['Aadi', 'Madhya', 'Antya'];
  if (gn === bn) return { points: 0, max: 8, note: `Nadi dosha (${nadiNames[gn]})` };
  return { points: 8, max: 8, note: 'Different nadi — compatible' };
}

function calcManglik(groomManglik, brideManglik) {
  if (groomManglik && brideManglik) {
    return { status: 'cancelled', note: 'Both Manglik — dosha cancelled', compatible: true };
  }
  if (groomManglik || brideManglik) {
    return { status: 'dosha', note: 'One partner is Manglik — remedies suggested', compatible: false };
  }
  return { status: 'none', note: 'No Manglik dosha', compatible: true };
}

function orderByGender(profileA, profileB, kundaliA, kundaliB, nameA, nameB) {
  const gA = profileA?.gender;
  const gB = profileB?.gender;
  if (gA === 'FEMALE' && gB === 'MALE') {
    return { groom: kundaliB, bride: kundaliA, groomName: nameB, brideName: nameA };
  }
  if (gA === 'MALE' && gB === 'FEMALE') {
    return { groom: kundaliA, bride: kundaliB, groomName: nameA, brideName: nameB };
  }
  return { groom: kundaliA, bride: kundaliB, groomName: nameA, brideName: nameB };
}

export function computeKundaliMatch(kundaliA, kundaliB, profileA = {}, profileB = {}, nameA = 'You', nameB = 'Partner') {
  const { groom, bride, groomName, brideName } = orderByGender(profileA, profileB, kundaliA, kundaliB, nameA, nameB);

  const kootas = {
    varna: calcVarna(groom.rashi, bride.rashi),
    vashya: calcVashya(groom.rashi, bride.rashi),
    tara: calcTara(groom.nakshatra, bride.nakshatra),
    yoni: calcYoni(groom.nakshatra, bride.nakshatra),
    grahaMaitri: calcGrahaMaitri(groom.rashi, bride.rashi),
    gana: calcGana(groom.nakshatra, bride.nakshatra),
    bhakoot: calcBhakoot(groom.rashi, bride.rashi),
    nadi: calcNadi(groom.nakshatra, bride.nakshatra),
  };

  const totalGunas = Object.values(kootas).reduce((s, k) => s + k.points, 0);
  const maxGunas = 36;
  const percentage = Math.round((totalGunas / maxGunas) * 100);
  const manglik = calcManglik(!!groom.manglik, !!bride.manglik);

  let verdict, verdictHi, color;
  if (totalGunas >= 28 && manglik.compatible) {
    verdict = 'Excellent Match';
    verdictHi = 'उत्तम मिलान';
    color = 'green';
  } else if (totalGunas >= 18) {
    verdict = manglik.compatible ? 'Good Match' : 'Average — Manglik attention needed';
    verdictHi = manglik.compatible ? 'अच्छा मिलान' : 'मध्यम — मांगलिक ध्यान दें';
    color = totalGunas >= 24 ? 'blue' : 'yellow';
  } else {
    verdict = 'Low Compatibility';
    verdictHi = 'कम अनुकूलता';
    color = 'orange';
  }

  return {
    totalGunas: Math.round(totalGunas * 10) / 10,
    maxGunas,
    percentage,
    verdict,
    verdictHi,
    color,
    manglik,
    kootas: {
      varna: { label: 'Varna', labelHi: 'वर्ण', ...kootas.varna },
      vashya: { label: 'Vashya', labelHi: 'वश्य', ...kootas.vashya },
      tara: { label: 'Tara', labelHi: 'तारा', ...kootas.tara },
      yoni: { label: 'Yoni', labelHi: 'योनि', ...kootas.yoni },
      grahaMaitri: { label: 'Graha Maitri', labelHi: 'ग्रह मैत्री', ...kootas.grahaMaitri },
      gana: { label: 'Gana', labelHi: 'गण', ...kootas.gana },
      bhakoot: { label: 'Bhakoot', labelHi: 'भकूट', ...kootas.bhakoot },
      nadi: { label: 'Nadi', labelHi: 'नाड़ी', ...kootas.nadi },
    },
    groom: {
      name: groomName,
      rashi: groom.rashi,
      nakshatra: groom.nakshatra,
      lagna: groom.lagna,
      manglik: !!groom.manglik,
    },
    bride: {
      name: brideName,
      rashi: bride.rashi,
      nakshatra: bride.nakshatra,
      lagna: bride.lagna,
      manglik: !!bride.manglik,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function parseKundaliRow(row) {
  if (!row) return null;
  return {
    ...row,
    manglik: !!row.manglik,
    planetaryPositions: typeof row.planetaryPositions === 'string'
      ? JSON.parse(row.planetaryPositions || '{}')
      : row.planetaryPositions,
    dashaSequence: typeof row.dashaSequence === 'string'
      ? JSON.parse(row.dashaSequence || '[]')
      : row.dashaSequence,
  };
}
