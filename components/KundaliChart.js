'use client';
import { useState } from 'react';

// ── Language Data ─────────────────────────────────────────────────────────────
const LANG = {
  en: {
    title: 'Kundali Chart',
    lagna: 'Lagna (Ascendant)',
    rashi: 'Rashi (Moon Sign)',
    nakshatra: 'Nakshatra',
    manglik: 'Manglik',
    yes: '✅ Yes',
    no: '❌ No',
    planetPos: 'Planetary Positions',
    planet: 'Planet',
    sign: 'Sign',
    degree: 'Degree',
    house: 'House',
    nature: 'Nature',
    dasha: 'Vimshottari Dasha',
    current: 'Current',
    rashiDetails: 'Rashi Details',
    jatak: 'Jatak (Native) Profile',
    gunMilan: 'Guna Milan',
    totalGun: 'Total Gunas',
    shubhGraha: 'Benefic Planets',
    ashubhGraha: 'Malefic Planets',
    neutralGraha: 'Neutral Planets',
    grahaStrength: 'Graha Strength',
    personality: 'Personality',
    element: 'Element',
    ruler: 'Ruling Planet',
    quality: 'Quality',
    lucky: 'Lucky',
    color: 'Color',
    number: 'Number',
    day: 'Day',
    gem: 'Gemstone',
    noKundali: 'No Kundali Generated',
    noKundaliDesc: 'Generate your Vedic birth chart to see planetary positions and dasha sequence.',
    generate: 'Generate Kundali',
    hindi: 'हिंदी',
    english: 'English',
    birthChart: 'Birth Chart',
    dashaPeriod: 'Dasha Period',
    grahaCount: 'Total Grahas',
    lagnaSign: 'Lagna Sign',
    moonSign: 'Moon Sign',
    sunSign: 'Sun Sign',
  },
  hi: {
    title: 'कुंडली चार्ट',
    lagna: 'लग्न (उदय राशि)',
    rashi: 'राशि (चंद्र राशि)',
    nakshatra: 'नक्षत्र',
    manglik: 'मांगलिक',
    yes: '✅ हाँ',
    no: '❌ नहीं',
    planetPos: 'ग्रह स्थिति',
    planet: 'ग्रह',
    sign: 'राशि',
    degree: 'अंश',
    house: 'भाव',
    nature: 'स्वभाव',
    dasha: 'विंशोत्तरी दशा',
    current: 'वर्तमान',
    rashiDetails: 'राशि विवरण',
    jatak: 'जातक प्रोफाइल',
    gunMilan: 'गुण मिलान',
    totalGun: 'कुल गुण',
    shubhGraha: 'शुभ ग्रह',
    ashubhGraha: 'अशुभ ग्रह',
    neutralGraha: 'तटस्थ ग्रह',
    grahaStrength: 'ग्रह बल',
    personality: 'व्यक्तित्व',
    element: 'तत्व',
    ruler: 'स्वामी ग्रह',
    quality: 'गुण',
    lucky: 'शुभ',
    color: 'रंग',
    number: 'अंक',
    day: 'दिन',
    gem: 'रत्न',
    noKundali: 'कुंडली उपलब्ध नहीं',
    noKundaliDesc: 'ग्रह स्थिति और दशा क्रम देखने के लिए अपनी वैदिक जन्म कुंडली बनाएं।',
    generate: 'कुंडली बनाएं',
    hindi: 'हिंदी',
    english: 'English',
    birthChart: 'जन्म कुंडली',
    dashaPeriod: 'दशा काल',
    grahaCount: 'कुल ग्रह',
    lagnaSign: 'लग्न राशि',
    moonSign: 'चंद्र राशि',
    sunSign: 'सूर्य राशि',
  },
};

// ── Rashi Data ────────────────────────────────────────────────────────────────
const RASHI_DATA = {
  Aries: {
    en: { name: 'Aries', hindi: 'मेष', element: 'Fire', ruler: 'Mars', quality: 'Cardinal', personality: 'Energetic, courageous, pioneering, impulsive, natural leader', color: 'Red', number: '9', day: 'Tuesday', gem: 'Red Coral', lucky: 'Red, Scarlet' },
    hi: { name: 'मेष', hindi: 'मेष', element: 'अग्नि', ruler: 'मंगल', quality: 'चर', personality: 'ऊर्जावान, साहसी, अग्रणी, आवेगी, प्राकृतिक नेता', color: 'लाल', number: '९', day: 'मंगलवार', gem: 'मूंगा', lucky: 'लाल, सिंदूरी' },
  },
  Taurus: {
    en: { name: 'Taurus', hindi: 'वृषभ', element: 'Earth', ruler: 'Venus', quality: 'Fixed', personality: 'Patient, reliable, determined, artistic, stubborn', color: 'Green', number: '6', day: 'Friday', gem: 'Diamond', lucky: 'Green, Pink' },
    hi: { name: 'वृषभ', hindi: 'वृषभ', element: 'पृथ्वी', ruler: 'शुक्र', quality: 'स्थिर', personality: 'धैर्यवान, विश्वसनीय, दृढ़, कलात्मक, जिद्दी', color: 'हरा', number: '६', day: 'शुक्रवार', gem: 'हीरा', lucky: 'हरा, गुलाबी' },
  },
  Gemini: {
    en: { name: 'Gemini', hindi: 'मिथुन', element: 'Air', ruler: 'Mercury', quality: 'Mutable', personality: 'Curious, adaptable, witty, communicative, restless', color: 'Yellow', number: '5', day: 'Wednesday', gem: 'Emerald', lucky: 'Yellow, Green' },
    hi: { name: 'मिथुन', hindi: 'मिथुन', element: 'वायु', ruler: 'बुध', quality: 'द्विस्वभाव', personality: 'जिज्ञासु, अनुकूलनीय, बुद्धिमान, संचारी, बेचैन', color: 'पीला', number: '५', day: 'बुधवार', gem: 'पन्ना', lucky: 'पीला, हरा' },
  },
  Cancer: {
    en: { name: 'Cancer', hindi: 'कर्क', element: 'Water', ruler: 'Moon', quality: 'Cardinal', personality: 'Nurturing, intuitive, emotional, protective, moody', color: 'White', number: '2', day: 'Monday', gem: 'Pearl', lucky: 'White, Silver' },
    hi: { name: 'कर्क', hindi: 'कर्क', element: 'जल', ruler: 'चंद्र', quality: 'चर', personality: 'पोषणकारी, सहज, भावनात्मक, सुरक्षात्मक, मूडी', color: 'सफेद', number: '२', day: 'सोमवार', gem: 'मोती', lucky: 'सफेद, चांदी' },
  },
  Leo: {
    en: { name: 'Leo', hindi: 'सिंह', element: 'Fire', ruler: 'Sun', quality: 'Fixed', personality: 'Confident, generous, dramatic, loyal, dominant', color: 'Gold', number: '1', day: 'Sunday', gem: 'Ruby', lucky: 'Gold, Orange' },
    hi: { name: 'सिंह', hindi: 'सिंह', element: 'अग्नि', ruler: 'सूर्य', quality: 'स्थिर', personality: 'आत्मविश्वासी, उदार, नाटकीय, वफादार, प्रभावशाली', color: 'सोना', number: '१', day: 'रविवार', gem: 'माणिक', lucky: 'सोना, नारंगी' },
  },
  Virgo: {
    en: { name: 'Virgo', hindi: 'कन्या', element: 'Earth', ruler: 'Mercury', quality: 'Mutable', personality: 'Analytical, practical, meticulous, helpful, critical', color: 'Green', number: '5', day: 'Wednesday', gem: 'Emerald', lucky: 'Green, Brown' },
    hi: { name: 'कन्या', hindi: 'कन्या', element: 'पृथ्वी', ruler: 'बुध', quality: 'द्विस्वभाव', personality: 'विश्लेषणात्मक, व्यावहारिक, सूक्ष्म, सहायक, आलोचनात्मक', color: 'हरा', number: '५', day: 'बुधवार', gem: 'पन्ना', lucky: 'हरा, भूरा' },
  },
  Libra: {
    en: { name: 'Libra', hindi: 'तुला', element: 'Air', ruler: 'Venus', quality: 'Cardinal', personality: 'Diplomatic, charming, fair-minded, social, indecisive', color: 'Blue', number: '6', day: 'Friday', gem: 'Diamond', lucky: 'Blue, Pink' },
    hi: { name: 'तुला', hindi: 'तुला', element: 'वायु', ruler: 'शुक्र', quality: 'चर', personality: 'कूटनीतिक, आकर्षक, न्यायप्रिय, सामाजिक, अनिर्णायक', color: 'नीला', number: '६', day: 'शुक्रवार', gem: 'हीरा', lucky: 'नीला, गुलाबी' },
  },
  Scorpio: {
    en: { name: 'Scorpio', hindi: 'वृश्चिक', element: 'Water', ruler: 'Mars', quality: 'Fixed', personality: 'Intense, passionate, secretive, determined, magnetic', color: 'Red', number: '9', day: 'Tuesday', gem: 'Red Coral', lucky: 'Red, Black' },
    hi: { name: 'वृश्चिक', hindi: 'वृश्चिक', element: 'जल', ruler: 'मंगल', quality: 'स्थिर', personality: 'तीव्र, जुनूनी, रहस्यमय, दृढ़, आकर्षक', color: 'लाल', number: '९', day: 'मंगलवार', gem: 'मूंगा', lucky: 'लाल, काला' },
  },
  Sagittarius: {
    en: { name: 'Sagittarius', hindi: 'धनु', element: 'Fire', ruler: 'Jupiter', quality: 'Mutable', personality: 'Optimistic, adventurous, philosophical, honest, restless', color: 'Yellow', number: '3', day: 'Thursday', gem: 'Yellow Sapphire', lucky: 'Yellow, Purple' },
    hi: { name: 'धनु', hindi: 'धनु', element: 'अग्नि', ruler: 'बृहस्पति', quality: 'द्विस्वभाव', personality: 'आशावादी, साहसी, दार्शनिक, ईमानदार, बेचैन', color: 'पीला', number: '३', day: 'गुरुवार', gem: 'पुखराज', lucky: 'पीला, बैंगनी' },
  },
  Capricorn: {
    en: { name: 'Capricorn', hindi: 'मकर', element: 'Earth', ruler: 'Saturn', quality: 'Cardinal', personality: 'Disciplined, ambitious, patient, responsible, reserved', color: 'Black', number: '8', day: 'Saturday', gem: 'Blue Sapphire', lucky: 'Black, Dark Blue' },
    hi: { name: 'मकर', hindi: 'मकर', element: 'पृथ्वी', ruler: 'शनि', quality: 'चर', personality: 'अनुशासित, महत्वाकांक्षी, धैर्यवान, जिम्मेदार, संयमित', color: 'काला', number: '८', day: 'शनिवार', gem: 'नीलम', lucky: 'काला, गहरा नीला' },
  },
  Aquarius: {
    en: { name: 'Aquarius', hindi: 'कुंभ', element: 'Air', ruler: 'Saturn', quality: 'Fixed', personality: 'Innovative, humanitarian, independent, eccentric, intellectual', color: 'Blue', number: '8', day: 'Saturday', gem: 'Blue Sapphire', lucky: 'Blue, Violet' },
    hi: { name: 'कुंभ', hindi: 'कुंभ', element: 'वायु', ruler: 'शनि', quality: 'स्थिर', personality: 'नवाचारी, मानवतावादी, स्वतंत्र, विलक्षण, बौद्धिक', color: 'नीला', number: '८', day: 'शनिवार', gem: 'नीलम', lucky: 'नीला, बैंगनी' },
  },
  Pisces: {
    en: { name: 'Pisces', hindi: 'मीन', element: 'Water', ruler: 'Jupiter', quality: 'Mutable', personality: 'Compassionate, artistic, intuitive, gentle, wise', color: 'Yellow', number: '3', day: 'Thursday', gem: 'Yellow Sapphire', lucky: 'Yellow, Sea Green' },
    hi: { name: 'मीन', hindi: 'मीन', element: 'जल', ruler: 'बृहस्पति', quality: 'द्विस्वभाव', personality: 'दयालु, कलात्मक, सहज, कोमल, बुद्धिमान', color: 'पीला', number: '३', day: 'गुरुवार', gem: 'पुखराज', lucky: 'पीला, समुद्री हरा' },
  },
};

// ── Graha Data ────────────────────────────────────────────────────────────────
const GRAHA_DATA = {
  en: {
    Sun:     { name: 'Sun',     hindi: 'सूर्य',    nature: 'Neutral', shubh: false, color: '#FF6B35', symbol: '☀️' },
    Moon:    { name: 'Moon',    hindi: 'चंद्र',    nature: 'Benefic', shubh: true,  color: '#C0C0C0', symbol: '🌙' },
    Mars:    { name: 'Mars',    hindi: 'मंगल',     nature: 'Malefic', shubh: false, color: '#FF4444', symbol: '♂️' },
    Mercury: { name: 'Mercury', hindi: 'बुध',      nature: 'Benefic', shubh: true,  color: '#4CAF50', symbol: '☿' },
    Jupiter: { name: 'Jupiter', hindi: 'बृहस्पति', nature: 'Benefic', shubh: true,  color: '#FFD700', symbol: '♃' },
    Venus:   { name: 'Venus',   hindi: 'शुक्र',    nature: 'Benefic', shubh: true,  color: '#FF69B4', symbol: '♀️' },
    Saturn:  { name: 'Saturn',  hindi: 'शनि',      nature: 'Malefic', shubh: false, color: '#607D8B', symbol: '♄' },
    Rahu:    { name: 'Rahu',    hindi: 'राहु',     nature: 'Malefic', shubh: false, color: '#9C27B0', symbol: '☊' },
    Ketu:    { name: 'Ketu',    hindi: 'केतु',     nature: 'Malefic', shubh: false, color: '#795548', symbol: '☋' },
  },
  hi: {
    Sun:     { name: 'सूर्य',    hindi: 'सूर्य',    nature: 'तटस्थ',  shubh: false, color: '#FF6B35', symbol: '☀️' },
    Moon:    { name: 'चंद्र',    hindi: 'चंद्र',    nature: 'शुभ',    shubh: true,  color: '#C0C0C0', symbol: '🌙' },
    Mars:    { name: 'मंगल',     hindi: 'मंगल',     nature: 'अशुभ',   shubh: false, color: '#FF4444', symbol: '♂️' },
    Mercury: { name: 'बुध',      hindi: 'बुध',      nature: 'शुभ',    shubh: true,  color: '#4CAF50', symbol: '☿' },
    Jupiter: { name: 'बृहस्पति', hindi: 'बृहस्पति', nature: 'शुभ',    shubh: true,  color: '#FFD700', symbol: '♃' },
    Venus:   { name: 'शुक्र',    hindi: 'शुक्र',    nature: 'शुभ',    shubh: true,  color: '#FF69B4', symbol: '♀️' },
    Saturn:  { name: 'शनि',      hindi: 'शनि',      nature: 'अशुभ',   shubh: false, color: '#607D8B', symbol: '♄' },
    Rahu:    { name: 'राहु',     hindi: 'राहु',     nature: 'अशुभ',   shubh: false, color: '#9C27B0', symbol: '☊' },
    Ketu:    { name: 'केतु',     hindi: 'केतु',     nature: 'अशुभ',   shubh: false, color: '#795548', symbol: '☋' },
  },
};

// Nakshatra Hindi names
const NAKSHATRA_HINDI = {
  'Ashwini': 'अश्विनी', 'Bharani': 'भरणी', 'Krittika': 'कृत्तिका',
  'Rohini': 'रोहिणी', 'Mrigashira': 'मृगशिरा', 'Ardra': 'आर्द्रा',
  'Punarvasu': 'पुनर्वसु', 'Pushya': 'पुष्य', 'Ashlesha': 'आश्लेषा',
  'Magha': 'मघा', 'Purva Phalguni': 'पूर्व फाल्गुनी', 'Uttara Phalguni': 'उत्तर फाल्गुनी',
  'Hasta': 'हस्त', 'Chitra': 'चित्रा', 'Swati': 'स्वाती',
  'Vishakha': 'विशाखा', 'Anuradha': 'अनुराधा', 'Jyeshtha': 'ज्येष्ठा',
  'Mula': 'मूल', 'Purva Ashadha': 'पूर्वाषाढ़ा', 'Uttara Ashadha': 'उत्तराषाढ़ा',
  'Shravana': 'श्रवण', 'Dhanishtha': 'धनिष्ठा', 'Shatabhisha': 'शतभिषा',
  'Purva Bhadrapada': 'पूर्व भाद्रपद', 'Uttara Bhadrapada': 'उत्तर भाद्रपद', 'Revati': 'रेवती',
};

// Planet Hindi names for dasha
const PLANET_HINDI = {
  Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध',
  Jupiter: 'बृहस्पति', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु',
};

// Guna Milan table (simplified 36-gun system based on rashi)
// Returns approximate gun count based on rashi compatibility
function getGunaCount(rashi) {
  const RASHI_GUN = {
    Aries: 28, Taurus: 24, Gemini: 26, Cancer: 30, Leo: 22, Virgo: 27,
    Libra: 25, Scorpio: 20, Sagittarius: 29, Capricorn: 23, Aquarius: 21, Pisces: 31,
  };
  return RASHI_GUN[rashi] || 25;
}

// ── SVG Chart Constants ───────────────────────────────────────────────────────
const GRAHA_ABBR_EN = { Sun:'Su', Moon:'Mo', Mars:'Ma', Mercury:'Me', Jupiter:'Ju', Venus:'Ve', Saturn:'Sa', Rahu:'Ra', Ketu:'Ke' };
const GRAHA_ABBR_HI = { Sun:'सू', Moon:'चं', Mars:'मं', Mercury:'बु', Jupiter:'गु', Venus:'शु', Saturn:'श', Rahu:'रा', Ketu:'के' };
const RASHI_FULL  = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const RASHI_SHORT_EN = ['Ari','Tau','Gem','Can','Leo','Vir','Lib','Sco','Sag','Cap','Aqu','Pis'];
const RASHI_SHORT_HI = ['मेष','वृष','मिथु','कर्क','सिंह','कन्या','तुला','वृश्चि','धनु','मकर','कुंभ','मीन'];

const S = 280, C = S/2, Q = S/4;
const OT=[C,0], OR=[S,C], OB=[C,S], OL=[0,C];
const OTR=[S,0], OBR=[S,S], OBL=[0,S], OTL=[0,0];
const IT=[C,Q], IR=[S-Q,C], IB=[C,S-Q], IL=[Q,C];

function poly(pts) { return pts.map(p=>p.join(',')).join(' '); }

const NI_CELLS = [
  { house:1,  points:poly([OT,OTR,IR,IT]),   cx:C+Q*0.85, cy:Q*0.55   },
  { house:2,  points:poly([OTR,OR,IR]),       cx:S-Q*0.45, cy:Q*0.45   },
  { house:3,  points:poly([IT,IR,IB]),        cx:C+Q*0.5,  cy:C        },
  { house:4,  points:poly([IR,OBR,OB,IB]),   cx:C+Q*0.85, cy:S-Q*0.55 },
  { house:5,  points:poly([OBR,OB,IR]),       cx:S-Q*0.45, cy:S-Q*0.45 },
  { house:6,  points:poly([OBL,OB,IB,IL]),   cx:C-Q*0.85, cy:S-Q*0.55 },
  { house:7,  points:poly([OL,OBL,IL]),       cx:Q*0.45,   cy:S-Q*0.45 },
  { house:8,  points:poly([IT,IL,IB]),        cx:C-Q*0.5,  cy:C        },
  { house:9,  points:poly([OTL,OL,IL,IT]),   cx:C-Q*0.85, cy:Q*0.55   },
  { house:10, points:poly([OTL,OT,IT]),       cx:Q*0.45,   cy:Q*0.45   },
  { house:11, points:poly([OTL,OL,IL]),       cx:Q*0.45,   cy:C-Q*0.5  },
  { house:12, points:poly([OT,OTL,IT]),       cx:C-Q*0.45, cy:Q*0.45   },
];

function HouseCell({ cell, grahas, isLagna, signName, lang }) {
  const { points, cx, cy } = cell;
  const lines = [signName, ...grahas];
  const totalH = lines.length * 11;
  const startY = cy - totalH/2 + 5;
  return (
    <g>
      <polygon points={points} fill={isLagna ? 'rgba(200,164,92,0.18)' : 'none'} stroke="var(--vd-border,#d1d5db)" strokeWidth="1" />
      <text x={cx} y={startY-6} textAnchor="middle" fontSize="7" fill="var(--vd-text-light,#9ca3af)">{cell.house}</text>
      {lines.map((line,i) => (
        <text key={i} x={cx} y={startY+i*11} textAnchor="middle"
          fontSize={i===0?7:9} fontWeight={isLagna&&i===0?'bold':'normal'}
          fill={i===0 ? (isLagna?'var(--vd-primary,#c8a45c)':'var(--vd-text-light,#6b7280)') : 'var(--vd-text-heading,#1f2937)'}>
          {line}
        </text>
      ))}
    </g>
  );
}

function KundaliSVG({ kundali, lang }) {
  const { lagna, planetaryPositions } = kundali;
  const lagnaIdx = RASHI_FULL.indexOf(lagna);
  const ABBR = lang==='hi' ? GRAHA_ABBR_HI : GRAHA_ABBR_EN;
  const RASHI_SHORT = lang==='hi' ? RASHI_SHORT_HI : RASHI_SHORT_EN;
  const lagnaLabel = lang==='hi' ? (RASHI_DATA[lagna]?.hi?.name || lagna) : lagna;

  const grahasByHouse = {};
  for (let h=1;h<=12;h++) grahasByHouse[h]=[];
  Object.entries(planetaryPositions).forEach(([graha,pos]) => {
    if (pos.house>=1&&pos.house<=12) grahasByHouse[pos.house].push(ABBR[graha]||graha);
  });

  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="w-full max-w-sm mx-auto"
      style={{background:'var(--vd-bg-section,#fff)'}} aria-label="North Indian Kundali Chart">
      <rect x="0" y="0" width={S} height={S} fill="none" stroke="var(--vd-border,#d1d5db)" strokeWidth="1.5"/>
      <polygon points={poly([OT,OR,OB,OL])} fill="none" stroke="var(--vd-border,#d1d5db)" strokeWidth="1.5"/>
      <polygon points={poly([IT,IR,IB,IL])} fill="var(--vd-accent-soft,#fdf6e3)" stroke="var(--vd-border,#d1d5db)" strokeWidth="1"/>
      <text x={C} y={C-10} textAnchor="middle" fontSize="16" fill="var(--vd-primary,#c8a45c)" fontWeight="bold">ॐ</text>
      <text x={C} y={C+4}  textAnchor="middle" fontSize="7"  fill="var(--vd-text-light,#9ca3af)">{lang==='hi'?'कुंडली':'Kundali'}</text>
      <text x={C} y={C+15} textAnchor="middle" fontSize="8"  fill="var(--vd-primary,#c8a45c)" fontWeight="bold">{lagnaLabel}</text>
      {NI_CELLS.map(cell => {
        const signIdx = lagnaIdx>=0 ? (lagnaIdx+cell.house-1)%12 : cell.house-1;
        return (
          <HouseCell key={cell.house} cell={cell} grahas={grahasByHouse[cell.house]}
            isLagna={cell.house===1} signName={RASHI_SHORT[signIdx]} lang={lang} />
        );
      })}
    </svg>
  );
}

// ── Summary Panel ─────────────────────────────────────────────────────────────
function SummaryPanel({ kundali, lang }) {
  const t = LANG[lang];
  const { lagna, rashi, nakshatra, manglik } = kundali;
  const rashiHindi = RASHI_DATA[rashi]?.hi?.name || rashi;
  const lagnaHindi = RASHI_DATA[lagna]?.hi?.name || lagna;
  const nakshatraDisplay = lang==='hi' ? (NAKSHATRA_HINDI[nakshatra]||nakshatra) : nakshatra;

  const items = [
    { label: t.lagna,     value: lang==='hi' ? lagnaHindi : lagna,   icon: '⬆️' },
    { label: t.rashi,     value: lang==='hi' ? rashiHindi : rashi,   icon: '🌙' },
    { label: t.nakshatra, value: nakshatraDisplay,                    icon: '⭐' },
    { label: t.manglik,   value: manglik ? t.yes : t.no,             icon: '🔴' },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 mt-4">
      {items.map(({ label, value, icon }) => (
        <div key={label} className="bg-vd-bg-alt rounded-xl p-3 border border-vd-border">
          <p className="text-xs text-vd-text-light mb-0.5 flex items-center gap-1">{icon} {label}</p>
          <p className="text-sm font-semibold text-vd-text-heading">{value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Rashi Details Panel ───────────────────────────────────────────────────────
function RashiDetailsPanel({ rashi, lang }) {
  const t = LANG[lang];
  const data = RASHI_DATA[rashi]?.[lang];
  if (!data) return null;
  const items = [
    { label: t.element,     value: data.element,     icon: '🌊' },
    { label: t.ruler,       value: data.ruler,       icon: '👑' },
    { label: t.quality,     value: data.quality,     icon: '⚖️' },
    { label: t.color,       value: data.color,       icon: '🎨' },
    { label: t.number,      value: data.number,      icon: '🔢' },
    { label: t.day,         value: data.day,         icon: '📅' },
    { label: t.gem,         value: data.gem,         icon: '💎' },
    { label: t.lucky,       value: data.lucky,       icon: '🍀' },
  ];
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-vd-text-light uppercase tracking-wide mb-2 flex items-center gap-1">
        🔯 {t.rashiDetails} — {data.name}
      </p>
      <div className="bg-vd-bg-alt rounded-xl p-3 border border-vd-border mb-3">
        <p className="text-xs text-vd-text-light mb-1 flex items-center gap-1">🧠 {t.personality}</p>
        <p className="text-sm text-vd-text-heading leading-relaxed">{data.personality}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map(({ label, value, icon }) => (
          <div key={label} className="bg-vd-bg-alt rounded-xl p-2.5 border border-vd-border">
            <p className="text-xs text-vd-text-light mb-0.5">{icon} {label}</p>
            <p className="text-xs font-semibold text-vd-text-heading">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Jatak Profile ─────────────────────────────────────────────────────────────
function JatakPanel({ kundali, lang }) {
  const t = LANG[lang];
  const { lagna, rashi, nakshatra, manglik, planetaryPositions } = kundali;
  const sunSign = planetaryPositions?.Sun?.sign || '—';
  const sunHindi = RASHI_DATA[sunSign]?.hi?.name || sunSign;
  const rashiHindi = RASHI_DATA[rashi]?.hi?.name || rashi;
  const lagnaHindi = RASHI_DATA[lagna]?.hi?.name || lagna;
  const nakshatraDisplay = lang==='hi' ? (NAKSHATRA_HINDI[nakshatra]||nakshatra) : nakshatra;
  const gunas = getGunaCount(rashi);

  const items = [
    { label: t.lagnaSign, value: lang==='hi' ? lagnaHindi : lagna,   icon: '⬆️' },
    { label: t.moonSign,  value: lang==='hi' ? rashiHindi : rashi,   icon: '🌙' },
    { label: t.sunSign,   value: lang==='hi' ? sunHindi : sunSign,   icon: '☀️' },
    { label: t.nakshatra, value: nakshatraDisplay,                    icon: '⭐' },
    { label: t.manglik,   value: manglik ? t.yes : t.no,             icon: '🔴' },
    { label: t.totalGun,  value: `${gunas}/36`,                      icon: '⚖️' },
  ];

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-vd-text-light uppercase tracking-wide mb-2 flex items-center gap-1">
        👤 {t.jatak}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {items.map(({ label, value, icon }) => (
          <div key={label} className="bg-vd-bg-alt rounded-xl p-2.5 border border-vd-border">
            <p className="text-xs text-vd-text-light mb-0.5">{icon} {label}</p>
            <p className="text-sm font-semibold text-vd-text-heading">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Graha Shubh/Ashubh Panel ──────────────────────────────────────────────────
function GrahaPanel({ planetaryPositions, lang }) {
  const t = LANG[lang];
  const gData = GRAHA_DATA[lang];
  const GRAHAS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];

  const shubh = [], ashubh = [], neutral = [];
  GRAHAS.forEach(g => {
    const info = gData[g];
    if (!info) return;
    const pos = planetaryPositions[g];
    const entry = { key: g, info, pos };
    if (info.nature === (lang==='hi'?'शुभ':'Benefic')) shubh.push(entry);
    else if (info.nature === (lang==='hi'?'अशुभ':'Malefic')) ashubh.push(entry);
    else neutral.push(entry);
  });

  const GrahaTag = ({ entry }) => (
    <div className="flex items-center gap-2 bg-vd-bg-alt rounded-xl px-3 py-2 border border-vd-border">
      <span className="text-base">{entry.info.symbol}</span>
      <div>
        <p className="text-xs font-semibold text-vd-text-heading">{entry.info.name}</p>
        {entry.pos && <p className="text-xs text-vd-text-light">{lang==='hi'?(RASHI_DATA[entry.pos.sign]?.hi?.name||entry.pos.sign):entry.pos.sign} • {lang==='hi'?'भाव':'H'}{entry.pos.house}</p>}
      </div>
    </div>
  );

  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs font-semibold text-vd-text-light uppercase tracking-wide flex items-center gap-1">
        🪐 {t.grahaStrength}
      </p>
      <div>
        <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1.5 flex items-center gap-1">✅ {t.shubhGraha} ({shubh.length})</p>
        <div className="grid grid-cols-2 gap-1.5">{shubh.map(e=><GrahaTag key={e.key} entry={e}/>)}</div>
      </div>
      <div>
        <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1.5 flex items-center gap-1">⚠️ {t.ashubhGraha} ({ashubh.length})</p>
        <div className="grid grid-cols-2 gap-1.5">{ashubh.map(e=><GrahaTag key={e.key} entry={e}/>)}</div>
      </div>
      {neutral.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 mb-1.5 flex items-center gap-1">⚖️ {t.neutralGraha} ({neutral.length})</p>
          <div className="grid grid-cols-2 gap-1.5">{neutral.map(e=><GrahaTag key={e.key} entry={e}/>)}</div>
        </div>
      )}
    </div>
  );
}

// ── Planet Table ──────────────────────────────────────────────────────────────
function PlanetTable({ planetaryPositions, lang }) {
  const t = LANG[lang];
  const gData = GRAHA_DATA[lang];
  const GRAHAS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-vd-text-light uppercase tracking-wide mb-2">🔭 {t.planetPos}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-vd-bg-alt">
              {[t.planet, t.sign, t.degree, t.house, t.nature].map(h => (
                <th key={h} className="text-left px-2 py-1.5 text-vd-text-light font-semibold border border-vd-border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GRAHAS.map(g => {
              const pos = planetaryPositions[g];
              const info = gData[g];
              if (!pos) return null;
              const signDisplay = lang==='hi' ? (RASHI_DATA[pos.sign]?.hi?.name||pos.sign) : pos.sign;
              const natureColor = info?.nature===(lang==='hi'?'शुभ':'Benefic') ? 'text-green-600' :
                                  info?.nature===(lang==='hi'?'अशुभ':'Malefic') ? 'text-red-500' : 'text-yellow-600';
              return (
                <tr key={g} className="border-b border-vd-border hover:bg-vd-bg-alt/50">
                  <td className="px-2 py-1.5 font-semibold text-vd-text-heading border border-vd-border">
                    <span className="mr-1">{info?.symbol}</span>{info?.name||g}
                  </td>
                  <td className="px-2 py-1.5 text-vd-text-heading border border-vd-border">{signDisplay}</td>
                  <td className="px-2 py-1.5 text-vd-text-light border border-vd-border">{Number(pos.degree).toFixed(2)}°</td>
                  <td className="px-2 py-1.5 text-vd-text-light border border-vd-border">{pos.house}</td>
                  <td className={`px-2 py-1.5 border border-vd-border font-medium ${natureColor}`}>{info?.nature}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Dasha List ────────────────────────────────────────────────────────────────
function DashaList({ dashaSequence, lang }) {
  const t = LANG[lang];
  if (!dashaSequence?.length) return null;
  const now = new Date().toISOString().slice(0,10);
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-vd-text-light uppercase tracking-wide mb-2">⏳ {t.dasha}</p>
      <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
        {dashaSequence.map((entry,i) => {
          const isCurrent = entry.startDate<=now && now<=entry.endDate;
          const planetName = lang==='hi' ? (PLANET_HINDI[entry.planet]||entry.planet) : entry.planet;
          return (
            <div key={i} className={`flex items-center justify-between rounded-xl px-3 py-1.5 border text-xs ${
              isCurrent ? 'bg-vd-accent-soft border-vd-primary font-semibold' : 'bg-vd-bg-alt border-vd-border'
            }`}>
              <span className="w-24 text-vd-text-heading">{planetName}{isCurrent ? ` ◀ ${t.current}` : ''}</span>
              <span className="text-vd-text-light">{entry.startDate}</span>
              <span className="text-vd-text-light mx-1">→</span>
              <span className="text-vd-text-light">{entry.endDate}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Guna Milan Panel ──────────────────────────────────────────────────────────
function GunaMilanPanel({ rashi, lang }) {
  const t = LANG[lang];
  const gunas = getGunaCount(rashi);
  const pct = Math.round((gunas/36)*100);
  const color = gunas>=28 ? 'bg-green-500' : gunas>=18 ? 'bg-yellow-500' : 'bg-red-500';
  const label = gunas>=28 ? (lang==='hi'?'उत्तम':'Excellent') : gunas>=18 ? (lang==='hi'?'मध्यम':'Average') : (lang==='hi'?'अल्प':'Low');
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-vd-text-light uppercase tracking-wide mb-2 flex items-center gap-1">
        ⚖️ {t.gunMilan}
      </p>
      <div className="bg-vd-bg-alt rounded-xl p-3 border border-vd-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-vd-text-heading">{t.totalGun}: {gunas}/36</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white ${color}`}>{label}</span>
        </div>
        <div className="w-full bg-vd-border rounded-full h-2">
          <div className={`h-2 rounded-full ${color} transition-all`} style={{width:`${pct}%`}}></div>
        </div>
        <p className="text-xs text-vd-text-light mt-1.5">
          {lang==='hi'
            ? `${gunas} गुण — ${pct}% अनुकूलता`
            : `${gunas} Gunas — ${pct}% compatibility score`}
        </p>
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function KundaliChart({ kundali, onGenerateClick }) {
  const [lang, setLang] = useState('en');

  if (!kundali) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 bg-vd-bg-section rounded-2xl border border-vd-border text-center">
        <div className="text-5xl mb-3">🪐</div>
        <p className="text-vd-text-heading font-semibold mb-1">No Kundali Generated</p>
        <p className="text-vd-text-light text-sm mb-4">
          Generate your Vedic birth chart to see planetary positions and dasha sequence.
        </p>
        {onGenerateClick && (
          <button onClick={onGenerateClick}
            className="vd-gradient-gold text-white px-6 py-2.5 rounded-2xl font-semibold text-sm hover:opacity-90 transition-opacity"
            style={{boxShadow:'0 4px 16px rgba(200,164,92,0.35)'}}>
            Generate Kundali
          </button>
        )}
      </div>
    );
  }

  const planetaryPositions = typeof kundali.planetaryPositions==='string'
    ? JSON.parse(kundali.planetaryPositions) : kundali.planetaryPositions;
  const dashaSequence = typeof kundali.dashaSequence==='string'
    ? JSON.parse(kundali.dashaSequence) : kundali.dashaSequence;
  const normalized = { ...kundali, planetaryPositions, dashaSequence };
  const t = LANG[lang];

  return (
    <div className="bg-vd-bg-section rounded-2xl border border-vd-border p-4">
      {/* Header with language toggle */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-vd-text-heading flex items-center gap-2">
          🪐 {t.title}
        </p>
        <div className="flex items-center gap-1 bg-vd-bg-alt rounded-xl p-1 border border-vd-border">
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              lang==='en' ? 'bg-vd-primary text-white shadow-sm' : 'text-vd-text-light hover:text-vd-text-heading'
            }`}>
            English
          </button>
          <button
            onClick={() => setLang('hi')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              lang==='hi' ? 'bg-vd-primary text-white shadow-sm' : 'text-vd-text-light hover:text-vd-text-heading'
            }`}>
            हिंदी
          </button>
        </div>
      </div>

      {/* Birth Chart SVG */}
      <div className="mb-1">
        <p className="text-xs font-semibold text-vd-text-light uppercase tracking-wide mb-2 flex items-center gap-1">
          🗺️ {t.birthChart}
        </p>
        <KundaliSVG kundali={normalized} lang={lang} />
      </div>

      {/* Jatak Profile */}
      <JatakPanel kundali={normalized} lang={lang} />

      {/* Summary */}
      <SummaryPanel kundali={normalized} lang={lang} />

      {/* Rashi Details */}
      <RashiDetailsPanel rashi={normalized.rashi} lang={lang} />

      {/* Guna Milan */}
      <GunaMilanPanel rashi={normalized.rashi} lang={lang} />

      {/* Graha Shubh/Ashubh */}
      <GrahaPanel planetaryPositions={normalized.planetaryPositions} lang={lang} />

      {/* Planet Table */}
      <PlanetTable planetaryPositions={normalized.planetaryPositions} lang={lang} />

      {/* Dasha */}
      <DashaList dashaSequence={normalized.dashaSequence} lang={lang} />
    </div>
  );
}
