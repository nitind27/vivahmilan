// Complete religion-based data for matrimonial profiles
// Jeevansathi.com level detail

export const RELIGION_DATA = {
  Hindu: {
    castes: [
      'Brahmin', 'Kshatriya', 'Vaishya', 'Shudra',
      'Agarwal', 'Baniya', 'Bania', 'Gupta',
      'Jat', 'Rajput', 'Maratha', 'Patel / Patil',
      'Yadav', 'Kurmi', 'Kunbi', 'Koli',
      'Kayastha', 'Khatri', 'Arora', 'Bhatia',
      'Nair', 'Menon', 'Pillai', 'Iyer', 'Iyengar',
      'Reddy', 'Naidu', 'Kamma', 'Kapu', 'Velama',
      'Lingayat', 'Vokkaliga', 'Gowda',
      'Baidya', 'Mahishya', 'Teli',
      'Scheduled Caste', 'Scheduled Tribe',
      'Inter-Caste', 'Doesn\'t Matter', 'Other'
    ],
    subCastes: {
      Brahmin: ['Iyer', 'Iyengar', 'Saraswat', 'Niyogi', 'Smartha', 'Vaidiki', 'Kanyakubja', 'Maithil', 'Gaur', 'Deshastha', 'Chitpavan', 'Karhade', 'Rigvedi', 'Namboothiri', 'Other'],
      Rajput: ['Chauhan', 'Rathore', 'Sisodia', 'Kachwaha', 'Tomar', 'Chandela', 'Gahlot', 'Bhati', 'Jadeja', 'Solanki', 'Other'],
      Yadav: ['Ahir', 'Gwala', 'Goala', 'Gopa', 'Other'],
      Patel: ['Leva Patel', 'Kadva Patel', 'Anjana Patel', 'Matiya Patel', 'Other'],
    },
    gotra: [
      'Kashyap', 'Bharadwaj', 'Vashistha', 'Atri', 'Vishwamitra',
      'Gautam', 'Jamadagni', 'Agastya', 'Garg', 'Parashar',
      'Sandilya', 'Kaushik', 'Shandilya', 'Angiras', 'Other', 'Don\'t Know'
    ],
    horoscope: {
      required: true,
      signs: ['Mesh (Aries)', 'Vrishabh (Taurus)', 'Mithun (Gemini)', 'Kark (Cancer)', 'Simha (Leo)', 'Kanya (Virgo)', 'Tula (Libra)', 'Vrishchik (Scorpio)', 'Dhanu (Sagittarius)', 'Makar (Capricorn)', 'Kumbh (Aquarius)', 'Meen (Pisces)'],
      nakshatra: ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'],
      manglik: ['Yes', 'No', 'Anshik Manglik (Partial)', 'Don\'t Know'],
      kundliMatch: ['Must Match', 'Preferred but not mandatory', 'Not Required'],
    },
    extraFields: ['Gotra', 'Nakshatra', 'Rashi', 'Manglik', 'Kundli Match Required'],
    motherTongues: ['Hindi', 'Marathi', 'Gujarati', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Punjabi', 'Odia', 'Rajasthani', 'Bhojpuri', 'Maithili', 'Other'],
  },

  Muslim: {
    castes: [
      'Syed', 'Sheikh', 'Pathan / Pathan', 'Mughal', 'Ansari',
      'Qureshi', 'Siddiqui', 'Farooqi', 'Hashmi', 'Alvi',
      'Rajput Muslim', 'Memon', 'Bohra', 'Khoja', 'Dawoodi Bohra',
      'Sunni', 'Shia', 'Ahmadiyya',
      'Doesn\'t Matter', 'Other'
    ],
    sects: ['Sunni', 'Shia', 'Ahmadiyya', 'Sufi', 'Ismaili', 'Bohra', 'Other'],
    horoscope: { required: false },
    extraFields: ['Sect', 'Maslak', 'Namaz (Prayer)', 'Hijab'],
    maslak: ['Hanafi', 'Shafi\'i', 'Maliki', 'Hanbali', 'Deobandi', 'Barelvi', 'Ahl-e-Hadith', 'Other'],
    motherTongues: ['Urdu', 'Hindi', 'Arabic', 'Persian', 'Punjabi', 'Bengali', 'Gujarati', 'Kashmiri', 'Other'],
  },

  Christian: {
    castes: [
      'Roman Catholic', 'Protestant', 'Church of South India (CSI)',
      'Church of North India (CNI)', 'Pentecostal', 'Baptist',
      'Methodist', 'Anglican', 'Orthodox', 'Jacobite',
      'Marthoma', 'Knanaya', 'Latin Catholic',
      'Scheduled Caste Christian', 'Doesn\'t Matter', 'Other'
    ],
    denominations: ['Roman Catholic', 'Protestant', 'Pentecostal', 'Baptist', 'Methodist', 'Anglican / Episcopal', 'Orthodox', 'Seventh-day Adventist', 'Jehovah\'s Witness', 'Other'],
    horoscope: { required: false },
    extraFields: ['Denomination', 'Church Attendance'],
    motherTongues: ['English', 'Malayalam', 'Tamil', 'Telugu', 'Kannada', 'Hindi', 'Konkani', 'Other'],
  },

  Sikh: {
    castes: [
      'Jat Sikh', 'Khatri', 'Arora', 'Ramgarhia', 'Saini',
      'Mazabi Sikh', 'Ramdasia', 'Bhatia', 'Gursikh',
      'Rajput Sikh', 'Labana', 'Doesn\'t Matter', 'Other'
    ],
    horoscope: {
      required: false,
      signs: ['Mesh', 'Vrishabh', 'Mithun', 'Kark', 'Simha', 'Kanya', 'Tula', 'Vrishchik', 'Dhanu', 'Makar', 'Kumbh', 'Meen'],
    },
    extraFields: ['Amritdhari', 'Keshdhari', 'Mona'],
    amritdhari: ['Yes', 'No', 'Prefer Amritdhari partner'],
    motherTongues: ['Punjabi', 'Hindi', 'English', 'Other'],
  },

  Buddhist: {
    castes: [
      'Ambedkarite Buddhist', 'Tibetan Buddhist', 'Zen Buddhist',
      'Theravada', 'Mahayana', 'Vajrayana',
      'Doesn\'t Matter', 'Other'
    ],
    sects: ['Theravada', 'Mahayana', 'Vajrayana / Tibetan', 'Zen', 'Pure Land', 'Other'],
    horoscope: { required: false },
    extraFields: ['Sect / School'],
    motherTongues: ['Hindi', 'Marathi', 'Bengali', 'Tibetan', 'Sinhala', 'Other'],
  },

  Jain: {
    castes: [
      'Digambar', 'Shwetambar', 'Oswal', 'Porwal', 'Shrimali',
      'Khandelwal', 'Agarwal Jain', 'Humad', 'Navnat',
      'Doesn\'t Matter', 'Other'
    ],
    sects: ['Digambar', 'Shwetambar', 'Sthanakvasi', 'Terapanthi', 'Other'],
    horoscope: { required: false },
    extraFields: ['Sect', 'Paryushana Observance'],
    motherTongues: ['Gujarati', 'Rajasthani', 'Hindi', 'Marwari', 'Other'],
  },

  Jewish: {
    castes: ['Ashkenazi', 'Sephardi', 'Mizrahi', 'Ethiopian', 'Other'],
    sects: ['Orthodox', 'Conservative', 'Reform', 'Reconstructionist', 'Secular', 'Other'],
    horoscope: { required: false },
    extraFields: ['Observance Level', 'Kosher'],
    motherTongues: ['Hebrew', 'Yiddish', 'English', 'Other'],
  },

  Parsi: {
    castes: ['Irani Zoroastrian', 'Parsi', 'Other'],
    horoscope: { required: false },
    extraFields: ['Navjote Done'],
    motherTongues: ['Gujarati', 'English', 'Other'],
  },

  'No Religion': {
    castes: ['Atheist', 'Agnostic', 'Spiritual but not religious', 'Other'],
    horoscope: { required: false },
    extraFields: [],
    motherTongues: [],
  },

  Other: {
    castes: ['Doesn\'t Matter', 'Other'],
    horoscope: { required: false },
    extraFields: [],
    motherTongues: [],
  },
};

export const ALL_RELIGIONS = Object.keys(RELIGION_DATA);

import { getCastesByReligion } from './casteData.js';

export { getCastesByReligion as getCastes };

export function getHoroscopeConfig(religion) {
  return RELIGION_DATA[religion]?.horoscope || { required: false };
}

export function getExtraFields(religion) {
  return RELIGION_DATA[religion]?.extraFields || [];
}

export function getMotherTongues(religion) {
  return RELIGION_DATA[religion]?.motherTongues || ['Hindi', 'English', 'Other'];
}

export function getSects(religion) {
  return RELIGION_DATA[religion]?.sects || RELIGION_DATA[religion]?.denominations || [];
}

export function getGotra(religion) {
  return religion === 'Hindu' ? RELIGION_DATA.Hindu.gotra : [];
}
