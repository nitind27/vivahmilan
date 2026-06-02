/**
 * Single source for Profile Options Manager — builds rows for `profileoption` table
 */
import { getCastesByReligion } from './casteData.js';
import { ALL_RELIGIONS, RELIGION_DATA } from './religionData.js';

const CASTE_DB_CATEGORY = {
  Hindu: 'caste_Hindu',
  Muslim: 'caste_Muslim',
  Christian: 'caste_Christian',
  Sikh: 'caste_Sikh',
  Jain: 'caste_Jain',
  Buddhist: 'caste_Buddhist',
  Parsi: 'caste_Parsi',
  Jewish: 'caste_Jewish',
  'No Religion': 'caste_NoReligion',
  Other: 'caste_Other',
};

const STATIC = {
  education: [
    'High School', 'Diploma', "Bachelor's", "Master's", 'PhD', 'MBBS', 'CA', 'LLB',
    'B.Tech', 'MBA', 'B.Com', 'B.Sc', 'M.Sc', 'B.Ed', 'M.Tech', 'Other',
  ],
  profession: [
    'Software Engineer', 'Doctor', 'Teacher', 'Business / Entrepreneur', 'Lawyer',
    'Engineer', 'Accountant / CA', 'Government Employee', 'Defence / Military',
    'Banker', 'Scientist', 'Artist / Designer', 'Nurse', 'Pharmacist', 'Architect',
    'Professor', 'Journalist', 'Other',
  ],
  income: [
    'Below ₹2 Lakh', '₹2-5 Lakh', '₹5-10 Lakh', '₹10-20 Lakh', '₹20-30 Lakh',
    '₹30-50 Lakh', '₹50 Lakh - 1 Crore', 'Above 1 Crore', 'Not Disclosed',
  ],
  diet: [
    'Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan', 'Jain Vegetarian',
    'Occasionally Non-Veg', 'Halal',
  ],
  bodyType: ['Slim', 'Athletic', 'Average', 'Heavy'],
  complexion: ['Very Fair', 'Fair', 'Wheatish', 'Wheatish Brown', 'Dark'],
  familyType: ['Nuclear', 'Joint', 'Extended'],
  familyStatus: ['Middle Class', 'Upper Middle Class', 'Rich / Affluent', 'High Net Worth'],
  horoscopeSign: [
    'Mesh (Aries)', 'Vrishabh (Taurus)', 'Mithun (Gemini)', 'Kark (Cancer)',
    'Simha (Leo)', 'Kanya (Virgo)', 'Tula (Libra)', 'Vrishchik (Scorpio)',
    'Dhanu (Sagittarius)', 'Makar (Capricorn)', 'Kumbh (Aquarius)', 'Meen (Pisces)',
  ],
  nakshatra: [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu',
    'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra',
    'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha',
    'Shravana', 'Dhanishtha', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
  ],
};

function pushSimple(category, values, out) {
  values.forEach((v, i) => {
    out.push({ category, value: v, label: v, group: null, sortOrder: i });
  });
}

function pushCastes(religion, out) {
  const category = CASTE_DB_CATEGORY[religion];
  if (!category) return;

  const list = getCastesByReligion(religion);
  const seen = new Set();
  let order = 0;

  for (const c of list) {
    if (!c.val || c.val === '__OTHER__' || seen.has(c.val)) continue;
    seen.add(c.val);
    out.push({
      category,
      value: c.val,
      label: c.label || c.val,
      group: c.group || null,
      sortOrder: order++,
    });
  }

  out.push({
    category,
    value: '__OTHER__',
    label: 'Other — not in list (type on form)',
    group: 'Other',
    sortOrder: 9999,
  });
}

/** @returns {Array<{category,value,label,group,sortOrder}>} */
export function buildProfileOptionsSeed() {
  const out = [];

  pushSimple('religion', ALL_RELIGIONS, out);

  for (const religion of Object.keys(CASTE_DB_CATEGORY)) {
    pushCastes(religion, out);
  }

  const gotra = RELIGION_DATA.Hindu?.gotra || [];
  pushSimple('gotra', gotra, out);

  const tongues = new Set();
  for (const r of Object.values(RELIGION_DATA)) {
    (r.motherTongues || []).forEach((t) => tongues.add(t));
  }
  ['Hindi', 'English', 'Urdu', 'Konkani', 'Sindhi', 'Assamese', 'Other'].forEach((t) => tongues.add(t));
  pushSimple('motherTongue', [...tongues], out);

  for (const [cat, values] of Object.entries(STATIC)) {
    pushSimple(cat, values, out);
  }

  return out;
}

export function getProfileOptionCategories() {
  return [
    { key: 'religion', label: 'Religion' },
    ...Object.entries(CASTE_DB_CATEGORY).map(([rel, key]) => ({
      key,
      label: `Community — ${rel}`,
    })),
    { key: 'gotra', label: 'Gotra' },
    { key: 'motherTongue', label: 'Mother Tongue' },
    { key: 'education', label: 'Education' },
    { key: 'profession', label: 'Profession' },
    { key: 'income', label: 'Income' },
    { key: 'diet', label: 'Diet' },
    { key: 'bodyType', label: 'Body Type' },
    { key: 'complexion', label: 'Complexion' },
    { key: 'familyType', label: 'Family Type' },
    { key: 'familyStatus', label: 'Family Status' },
    { key: 'horoscopeSign', label: 'Horoscope Sign' },
    { key: 'nakshatra', label: 'Nakshatra' },
  ];
}
