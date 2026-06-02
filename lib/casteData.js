/**
 * India matrimony caste / community data
 * Structure: Religion → Community category → State/region → names (NO surnames)
 * Example: Hindu → Brahmin → Uttar Pradesh → "Kanyakubja Brahmin"
 *          Hindu → Yadav / Ahir → Gujarat → "Ahir (Gujarat)"
 */

import {
  MUSLIM_COMMUNITIES,
  CHRISTIAN_DENOMINATIONS,
  SIKH_CASTES,
  JAIN_CASTES,
  BUDDHIST_CASTES,
  PARSI_CASTES,
  JEWISH_CASTES,
  NO_RELIGION_COMMUNITIES,
  OTHER_RELIGION_COMMUNITIES,
} from './casteDataNonHindu.js';

export {
  MUSLIM_COMMUNITIES,
  CHRISTIAN_DENOMINATIONS,
  SIKH_CASTES,
  JAIN_CASTES,
  BUDDHIST_CASTES,
  PARSI_CASTES,
  JEWISH_CASTES,
  NO_RELIGION_COMMUNITIES,
  OTHER_RELIGION_COMMUNITIES,
};

export const INDIAN_STATES_UTS = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi NCR', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
];

const COMMON_END = ["Doesn't Matter", 'Inter-Caste / Inter-Community', 'Prefer Not to Say'];

/** Flatten nested { Category: { State: [names] } } → select options */
function flattenByState(tree, religionLabel = '') {
  const result = [];
  for (const [category, regions] of Object.entries(tree)) {
    if (!regions || typeof regions !== 'object') continue;
    for (const [region, names] of Object.entries(regions)) {
      if (!Array.isArray(names)) continue;
      const group = region === 'Pan India'
        ? category
        : `${category} — ${region}`;
      names.forEach((name) => {
        result.push({
          val: name,
          label: name,
          group,
          category,
          region,
          religion: religionLabel,
        });
      });
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HINDU — Category → State/Region → Community (no surnames)
// ═══════════════════════════════════════════════════════════════════════════════
export const HINDU_CASTES = {
  Brahmin: {
    'Uttar Pradesh': [
      'Kanyakubja Brahmin', 'Saryupareen Brahmin', 'Gaur Brahmin', 'Maithil Brahmin',
      'Bhumihar Brahmin', 'Tyagi Brahmin', 'Jijhotia Brahmin', 'Awadhi Brahmin',
      'Shakdwipi Brahmin', 'Pushkarna Brahmin (UP)',
    ],
    Bihar: [
      'Maithil Brahmin', 'Bhumihar Brahmin', 'Saryupareen Brahmin', 'Kanyakubja Brahmin (Bihar)',
    ],
    'Madhya Pradesh': [
      'Sanadhya Brahmin', 'Jijhotia Brahmin (MP)', 'Malvi Brahmin', 'Chhattisgarhi Brahmin',
      'Kurmanchal Brahmin',
    ],
    Chhattisgarh: ['Chhattisgarhi Brahmin', 'Sarayuparin Brahmin (CG)'],
    Rajasthan: [
      'Gaud Brahmin (Rajasthan)', 'Pushkarna Brahmin', 'Pareek Brahmin', 'Dadhich Brahmin',
      'Mewada Brahmin', 'Shrimali Brahmin',
    ],
    Gujarat: [
      'Audichya Brahmin', 'Modh Brahmin', 'Shrimali Brahmin', 'Nagar Brahmin',
      'Saraswat Brahmin (Gujarat)', 'Khedawal Brahmin', 'Anavil Brahmin', 'Rajgor Brahmin',
    ],
    Maharashtra: [
      'Deshastha Brahmin (Rigvedi)', 'Deshastha Brahmin (Yajurvedi)', 'Chitpavan Brahmin (Konkanastha)',
      'Karhade Brahmin', 'Saraswat Brahmin (Konkan)', 'CKP Brahmin', 'Devrukhe Brahmin',
    ],
    Goa: ['Saraswat Brahmin (Goa)', 'Chitpavan Brahmin (Goa)'],
    Punjab: ['Mohyal Brahmin', 'Saraswat Brahmin (Punjab)', 'Gaur Brahmin (Punjab)', 'Trigarta Brahmin'],
    'Himachal Pradesh': ['Dogra Brahmin', 'Gaur Brahmin (HP)', 'Khashatriya Brahmin (HP)'],
    'Jammu & Kashmir': ['Kashmiri Pandit', 'Dogra Brahmin (J&K)'],
    Uttarakhand: ['Garhwali Brahmin', 'Kumaoni Brahmin', 'Joshi Brahmin (Kumaon)'],
    'West Bengal': [
      'Rarhi Brahmin', 'Barendra Brahmin', 'Vaidik Brahmin (Bengal)', 'Kulin Brahmin',
      'Shrotriya Brahmin',
    ],
    Odisha: ['Utkal Brahmin', 'Halua Brahmin', 'Karan Brahmin (Odisha)'],
    Assam: ['Assamese Brahmin', 'Gaur Brahmin (Assam)'],
    'Tamil Nadu': [
      'Iyer (Smartha)', 'Iyer (Vadakalai)', 'Iyer (Thenkalai)', 'Iyengar (Vaishnava)',
      'Iyengar (Sri Vaishnava)', 'Gurukkal Brahmin', 'Dikshitar Brahmin',
    ],
    Kerala: ['Namboothiri Brahmin', 'Embranthiri Brahmin', 'Potti Brahmin', 'Pushpaka Brahmin'],
    Karnataka: [
      'Havyaka Brahmin', 'Shivalli Brahmin', 'Madhwa Brahmin', 'Sthanika Brahmin',
      'Badaganadu Brahmin', 'Hoysala Brahmin', 'Saraswat Brahmin (Karnataka)',
    ],
    'Andhra Pradesh': [
      'Niyogi Brahmin', 'Vaidiki Brahmin', 'Velanadu Brahmin', 'Mulakanadu Brahmin',
      'Dravida Brahmin', 'Golkonda Brahmin',
    ],
    Telangana: [
      'Niyogi Brahmin (Telangana)', 'Vaidiki Brahmin (Telangana)', 'Velanadu Brahmin (TS)',
    ],
  },

  'Rajput / Kshatriya': {
    'Uttar Pradesh': [
      'Rajput (UP — Chauhan clan)', 'Rajput (UP — Rathore clan)', 'Rajput (UP — Sisodia clan)',
      'Rajput (UP — Tomar clan)', 'Rajput (UP — Gahlot clan)', 'Rajput (UP — Kachwaha clan)',
      'Rajput (UP — Parihar)', 'Rajput (UP — Gaur)', 'Rajput (UP — Bisen)', 'Thakur (UP)',
    ],
    Bihar: ['Rajput (Bihar)', 'Thakur (Bihar)', 'Ujjainiya Rajput', 'Bhojpuri Rajput'],
    'Madhya Pradesh': ['Rajput (MP)', 'Bundela Rajput', 'Baghel Rajput', 'Chandel Rajput'],
    Rajasthan: [
      'Rathore Rajput (Marwar)', 'Shekhawat Rajput', 'Sisodia Rajput (Mewar)', 'Kachwaha Rajput (Dhundhar)',
      'Bhati Rajput (Jaisalmer)', 'Hada Rajput', 'Chauhan Rajput (Rajasthan)', 'Jhala Rajput',
      'Gaur Rajput', 'Naruka Rajput', 'Rajawat Rajput',
    ],
    Gujarat: [
      'Jadeja Rajput (Kutch/Saurashtra)', 'Gohil Rajput', 'Vaghela Rajput', 'Chudasama Rajput',
      'Parmar Rajput (Gujarat)', 'Zala Rajput',
    ],
    'Himachal Pradesh': ['Katoch Rajput', 'Guleria Rajput', 'Jaswal Rajput', 'Pathania Rajput'],
    Uttarakhand: ['Rawat Rajput', 'Negi Rajput', 'Bisht Rajput', 'Garhwali Rajput'],
    Maharashtra: ['Maratha Kshatriya (96 Kuli)', 'Kunbi (Kshatriya status — local)'],
    Punjab: ['Rajput Sikh lineage (ancestral)', 'Dogra Rajput'],
    'Jammu & Kashmir': ['Dogra Rajput (J&K)'],
    Haryana: ['Rajput (Haryana)', 'Jat-Rajput (ancestral)'],
  },

  'Yadav / Ahir / Gwala': {
    'Uttar Pradesh': ['Ahir (Uttar Pradesh)', 'Yadav (Uttar Pradesh)', 'Gwala (UP)', 'Gope (UP)'],
    Bihar: ['Ahir (Bihar)', 'Yadav (Bihar)', 'Gwala (Bihar)', 'Gope (Bihar)'],
    Haryana: ['Ahir (Haryana)', 'Rao Ahir (Haryana)', 'Yadav (Haryana)'],
    Rajasthan: ['Ahir (Rajasthan)', 'Yadav (Rajasthan)', 'Gwala (Rajasthan)'],
    Gujarat: ['Ahir (Gujarat)', 'Yadav (Gujarat)', 'Ahirani (North Gujarat)'],
    'Madhya Pradesh': ['Ahir (Madhya Pradesh)', 'Yadav (MP)', 'Gwala (MP)'],
    Chhattisgarh: ['Yadav (Chhattisgarh)', 'Ahir (Chhattisgarh)'],
    Jharkhand: ['Yadav (Jharkhand)', 'Ahir (Jharkhand)'],
    Delhi: ['Ahir (Delhi NCR)', 'Yadav (Delhi NCR)'],
    Punjab: ['Yadav (Punjab)', 'Ahir (Punjab — Malwa)'],
    Maharashtra: ['Yadav (Maharashtra)', 'Gavli / Gop (Maharashtra)'],
    'West Bengal': ['Goala (Bengal)', 'Yadav (Bengal)'],
    'Andhra Pradesh': ['Yadav (Andhra)', 'Golla (Andhra)'],
    Telangana: ['Yadav (Telangana)', 'Golla (Telangana)'],
    Karnataka: ['Yadav (Karnataka)', 'Golla (Karnataka)'],
    Odisha: ['Yadav (Odisha)', 'Gope (Odisha)'],
    Assam: ['Yadav (Assam)'],
  },

  Jat: {
    Haryana: ['Jat (Haryana)', 'Jat (Rohtak region)', 'Jat (Hisar region)'],
    Punjab: ['Jat (Punjab)', 'Jat Sikh (ancestral Hindu Jat)'],
    Rajasthan: ['Jat (Rajasthan — border belt)', 'Jat (Bharatpur region)'],
    'Uttar Pradesh': ['Jat (Western UP)', 'Jat (Mathura region)'],
    Delhi: ['Jat (Delhi NCR)'],
    'Madhya Pradesh': ['Jat (MP — Gwalior belt)'],
    Uttarakhand: ['Jat (Uttarakhand — Terai)'],
    Gujarat: ['Jat (Gujarat — Kutch)'],
  },

  Gujjar: {
    'Uttar Pradesh': ['Gujjar (Western UP)', 'Gujjar (Mathura belt)'],
    Rajasthan: ['Gujjar (Rajasthan)', 'Gujjar (Mewar)', 'Gujjar (Marwar)'],
    'Madhya Pradesh': ['Gujjar (MP)', 'Gujjar (Malwa)'],
    Delhi: ['Gujjar (Delhi NCR)'],
    Haryana: ['Gujjar (Haryana)'],
    'Himachal Pradesh': ['Gujjar (HP)'],
    Uttarakhand: ['Gujjar (Uttarakhand)'],
    'Jammu & Kashmir': ['Gujjar (J&K)', 'Bakarwal (Gujjar pastoral)'],
  },

  'Kurmi / Kunbi / Patidar': {
    'Uttar Pradesh': ['Kurmi (Uttar Pradesh)', 'Patidar (UP belt)'],
    Bihar: ['Kurmi (Bihar)', 'Koeri / Koiri'],
    'Madhya Pradesh': ['Kurmi (MP)', 'Patidar (MP)'],
    Chhattisgarh: ['Kurmi (Chhattisgarh)'],
    Jharkhand: ['Kurmi (Jharkhand)'],
    Maharashtra: ['Kunbi (Maharashtra)', 'Kunbi Maratha', 'Patidar (Maharashtra)'],
    Gujarat: [
      'Patidar (Leuva)', 'Patidar (Kadva)', 'Patidar (Anjana)', 'Patidar (Matiya)',
      'Kurmi-Kunbi (Gujarat border)',
    ],
    Odisha: ['Kurmi (Odisha)'],
  },

  Maratha: {
    Maharashtra: [
      'Maratha (96 Kuli)', 'Maratha (Deshastha)', 'Deshmukh (Maratha)', 'Patil (Maratha)',
      'Bhosale lineage (Maratha)', 'Shinde / Scindia lineage', 'Holkar lineage', 'Gaekwad lineage',
      'Kunbi Maratha', 'Maratha (Konkan)', 'Maratha (Vidarbha)', 'Maratha (Marathwada)',
    ],
    Goa: ['Maratha (Goa)', 'Hindu Maratha (Goa)'],
    Karnataka: ['Maratha (Belgaum region)', 'Maratha (Border Karnataka)'],
    'Madhya Pradesh': ['Maratha (MP — Malwa)'],
    Gujarat: ['Maratha (Gujarat — Surat belt)'],
  },

  'Patel / Patidar (Gujarat & diaspora)': {
    Gujarat: [
      'Leuva Patel', 'Kadva Patel', 'Anjana Patel', 'Matiya Patel', 'Chaudhari Patel',
      'Desai Patel', 'Patidar (Central Gujarat)', 'Patidar (Saurashtra)', 'Patidar (North Gujarat)',
    ],
    Maharashtra: ['Leuva Patel (Maharashtra)', 'Patel (Maharashtra)'],
    'Madhya Pradesh': ['Patel (MP)', 'Patidar (MP)'],
    Rajasthan: ['Patel (Rajasthan border)'],
    'Uttar Pradesh': ['Patel (UP — diaspora)'],
    Delhi: ['Patel (Delhi NCR)'],
  },

  'Agarwal / Maheshwari / Baniya (Vaishya)': {
    'Uttar Pradesh': [
      'Agarwal (UP)', 'Vaishya (UP)', 'Khandelwal (UP)', 'Oswal (UP)', 'Porwal (UP)',
      'Rastogi (Vaishya)', 'Kalwar (Vaishya)', 'Mahajan (UP)',
    ],
    Bihar: ['Agarwal (Bihar)', 'Vaishya (Bihar)', 'Sahu (Vaishya — Bihar)'],
    Rajasthan: [
      'Agarwal (Rajasthan)', 'Maheshwari (Rajasthan)', 'Oswal (Rajasthan)', 'Khandelwal (Rajasthan)',
      'Marwari Vaishya', 'Saraogi (Jain-Vaishya overlap)',
    ],
    Gujarat: [
      'Agarwal (Gujarat)', 'Bhatia (Vaishya)', 'Lohana (Gujarat)', 'Vania (Gujarat)',
      'Modh Vanik', 'Shrimali Vanik', 'Khadayata Vanik',
    ],
    'Madhya Pradesh': ['Agarwal (MP)', 'Maheshwari (MP)', 'Vaishya (MP)'],
    Delhi: ['Agarwal (Delhi NCR)', 'Vaishya (Delhi)', 'Khandelwal (Delhi)'],
    Punjab: ['Agarwal (Punjab)', 'Bania (Punjab)'],
    Haryana: ['Agarwal (Haryana)', 'Vaishya (Haryana)'],
    Maharashtra: ['Agarwal (Maharashtra)', 'Vaishya (Maharashtra)'],
    'West Bengal': ['Agarwal (Bengal)', 'Marwari (Bengal)'],
  },

  Kayastha: {
    'Uttar Pradesh': ['Kayastha (UP)', 'Chitraguptavanshi Kayastha (UP)'],
    Bihar: ['Kayastha (Bihar)', 'Ambastha Kayastha (Bihar)'],
    'West Bengal': ['Kayastha (Bengal)', 'Baidya (Bengal — Kayastha status)'],
    Odisha: ['Karan (Odisha Kayastha)', 'Kayastha (Odisha)'],
    Assam: ['Kayastha (Assam)'],
    Delhi: ['Kayastha (Delhi NCR)'],
    'Madhya Pradesh': ['Kayastha (MP)'],
    Jharkhand: ['Kayastha (Jharkhand)'],
  },

  'Khatri / Arora (Punjab & North)': {
    Punjab: ['Khatri (Punjab)', 'Arora (Punjab)', 'Bhatia (Punjab Khatri)'],
    Delhi: ['Khatri (Delhi NCR)', 'Arora (Delhi NCR)'],
    'Himachal Pradesh': ['Khatri (HP)', 'Arora (HP)'],
    'Jammu & Kashmir': ['Khatri (J&K)', 'Arora (J&K)'],
    Haryana: ['Khatri (Haryana)', 'Arora (Haryana)'],
    Uttarakhand: ['Khatri (Uttarakhand)'],
  },

  'Reddy / Kamma / Kapu / Velama (Andhra & Telangana)': {
    'Andhra Pradesh': [
      'Reddy', 'Kamma', 'Kapu', 'Velama', 'Balija', 'Telaga', 'Ontari', 'Gavara',
      'Munnuru Kapu', 'Turpu Kapu', 'Raju (Kshatriya Reddy)', 'Golla (Andhra)',
    ],
    Telangana: [
      'Reddy (Telangana)', 'Kamma (Telangana)', 'Kapu (Telangana)', 'Velama (Telangana)',
      'Golla (Telangana)',
    ],
    Karnataka: ['Reddy (Karnataka border)', 'Kapu (Karnataka)'],
    'Tamil Nadu': ['Reddy (TN — diaspora)'],
    Odisha: ['Reddy (Odisha border)'],
  },

  'Nair / Ezhava / Namboothiri (Kerala)': {
    Kerala: [
      'Nair', 'Ezhava / Thiyya', 'Menon', 'Pillai (Kerala)', 'Kurup', 'Panikkar',
      'Kaimal', 'Varma (Kerala)', 'Ambalavasi', 'Vishwakarma (Kerala)',
    ],
    'Tamil Nadu': ['Nair (TN — diaspora)', 'Menon (TN)'],
    Karnataka: ['Nair (Karnataka — Mangalore)'],
  },

  'Vokkaliga / Lingayat / Gowda (Karnataka)': {
    Karnataka: [
      'Vokkaliga', 'Gowda (Karnataka)', 'Lingayat', 'Panchamasali Lingayat',
      'Sadar Lingayat', 'Kuruba', 'Bunt (Tulu region)', 'Billava', 'Devanga',
      'Uppara', 'Mogaveera', 'Idiga',
    ],
    'Tamil Nadu': ['Vokkaliga (TN border)', 'Lingayat (TN)'],
    'Andhra Pradesh': ['Lingayat (AP border)'],
    Maharashtra: ['Lingayat (Maharashtra — border)'],
  },

  'Mudaliar / Gounder / Vanniyar / Mukkulathor (Tamil Nadu)': {
    'Tamil Nadu': [
      'Mudaliar', 'Gounder', 'Vellalar', 'Vanniyar', 'Nadar', 'Chettiar',
      'Thevar / Mukkulathor', 'Agamudayar', 'Kallar', 'Maravar', 'Servai',
      'Konar', 'Udayar', 'Pillai (Tamil Nadu)', 'Naicker',
    ],
    Kerala: ['Mudaliar (Kerala — diaspora)', 'Nadar (Kerala)'],
    Karnataka: ['Gounder (Karnataka border)', 'Mudaliar (Karnataka)'],
    'Andhra Pradesh': ['Nadar (AP)', 'Mudaliar (AP)'],
  },

  'Bengali Hindu': {
    'West Bengal': [
      'Baidya (Bengal)', 'Mahishya', 'Namasudra (Hindu)', 'Rajbanshi (Hindu)',
      'Sadgop', 'Teli (Bengal Hindu)', 'Bagdi (Hindu)', 'Pod (Hindu)',
    ],
    Assam: ['Bengali Hindu (Assam)', 'Rajbanshi (Assam)'],
    Tripura: ['Bengali Hindu (Tripura)'],
    Jharkhand: ['Bengali Hindu (Jharkhand)'],
  },

  'Odia Hindu': {
    Odisha: [
      'Khandayat (Odia Kshatriya)', 'Chasa', 'Gouda (Odia)', 'Keuta', 'Teli (Odia)',
      'Karan (Odia)', 'Brahmin (Odia — see Brahmin section)',
    ],
    'Andhra Pradesh': ['Odia diaspora (AP border)'],
  },

  'Assamese / Northeast Hindu': {
    Assam: ['Ahom (Hindu lineage)', 'Assamese Hindu', 'Kalita (Hindu)', 'Koch (Hindu)'],
    Manipur: ['Meitei Hindu', 'Manipuri Hindu'],
    Tripura: ['Tripuri Hindu', 'Bengali Hindu (Tripura)'],
    'Arunachal Pradesh': ['Hindu tribes (Arunachal)'],
    Nagaland: ['Hindu Naga (minority)'],
    Meghalaya: ['Hindu Khasi / Garo (minority)'],
    Mizoram: ['Hindu Mizo (minority)'],
    Sikkim: ['Nepali Hindu (Sikkim)', 'Limbu (Hindu)'],
  },

  'Teli / Sahu / Gandla': {
    'Uttar Pradesh': ['Teli (UP)', 'Sahu (UP)'],
    Bihar: ['Teli (Bihar)', 'Sahu (Bihar)'],
    'Madhya Pradesh': ['Teli (MP)', 'Sahu (MP)'],
    Chhattisgarh: ['Teli (Chhattisgarh)'],
    Maharashtra: ['Teli (Maharashtra)', 'Sahu (Maharashtra)'],
    Gujarat: ['Teli (Gujarat)', 'Gandla (Gujarat)'],
    'Andhra Pradesh': ['Gandla (Andhra)', 'Teli (Andhra)'],
    Odisha: ['Teli (Odisha)'],
    'West Bengal': ['Teli (Bengal)'],
  },

  'Kumhar / Prajapati / Kumbhar': {
    'Uttar Pradesh': ['Kumhar (UP)', 'Prajapati (UP)'],
    Bihar: ['Kumhar (Bihar)', 'Prajapati (Bihar)'],
    Rajasthan: ['Kumhar (Rajasthan)', 'Prajapati (Rajasthan)'],
    Gujarat: ['Kumbhar (Gujarat)', 'Prajapati (Gujarat)'],
    Maharashtra: ['Kumbhar (Maharashtra)', 'Prajapati (Maharashtra)'],
    Punjab: ['Kumhar (Punjab)'],
    'Madhya Pradesh': ['Kumhar (MP)', 'Prajapati (MP)'],
  },

  'Lohar / Vishwakarma / Sonar': {
    'Pan India': ['Vishwakarma', 'Panchal (Vishwakarma)', 'Sutar', 'Badhai', 'Sonar / Soni'],
    'Uttar Pradesh': ['Lohar (UP)', 'Vishwakarma (UP)', 'Sonar (UP)'],
    Rajasthan: ['Sonar (Rajasthan)', 'Vishwakarma (Rajasthan)'],
    Gujarat: ['Vishwakarma (Gujarat)', 'Sonar (Gujarat)'],
    Maharashtra: ['Lohar (Maharashtra)', 'Vishwakarma (Maharashtra)'],
    Punjab: ['Lohar (Punjab)', 'Tarkhan (Punjab)'],
    'Tamil Nadu': ['Vishwakarma (Tamil Nadu)', 'Kammalar'],
    'Andhra Pradesh': ['Kammari (Andhra)', 'Vishwakarma (Andhra)'],
  },

  'Scheduled Caste (SC)': {
    'Uttar Pradesh': [
      'Chamar / Jatav (UP)', 'Pasi (UP)', 'Kori (UP)', 'Balmiki / Valmiki (UP)',
      'Dusadh / Paswan (UP)', 'Khatik (UP)', 'Dhanuk (UP)', 'Dom (UP)',
    ],
    Bihar: ['Chamar (Bihar)', 'Dusadh (Bihar)', 'Mushahar (Bihar)', 'Dom (Bihar)'],
    Rajasthan: ['Meghwal (Rajasthan)', 'Bairwa (Rajasthan)', 'Regar (Rajasthan)'],
    Gujarat: ['Chamar (Gujarat)', 'Rohit (Gujarat)', 'Vankar (Gujarat)'],
    Maharashtra: ['Mahar', 'Mang', 'Chambhar', 'Matang', 'Dhor'],
    Punjab: ['Chamar (Punjab)', 'Mazhabi (SC — see Sikh)', 'Balmiki (Punjab)'],
    'West Bengal': ['Namasudra (SC)', 'Pod (SC)', 'Rajbanshi (SC)'],
    'Tamil Nadu': ['Paraiyar', 'Pallar', 'Adi Dravida'],
    'Andhra Pradesh': ['Madiga', 'Mala'],
    Telangana: ['Madiga (TS)', 'Mala (TS)'],
    Karnataka: ['Holeya', 'Madiga (Karnataka)', 'Adi Karnataka'],
    Kerala: ['Pulayar', 'Parayan', 'Cheruman'],
    Odisha: ['Pano', 'Dom (Odisha SC)'],
    Assam: ['Namshudra (Assam SC)'],
  },

  'Scheduled Tribe (ST)': {
    Rajasthan: ['Bhil', 'Bhilala', 'Meena / Mina', 'Garasia'],
    Gujarat: ['Bhil (Gujarat)', 'Gamit', 'Dhodia', 'Chaudhri'],
    'Madhya Pradesh': ['Gond', 'Baiga', 'Bhil (MP)', 'Korku', 'Halba'],
    Chhattisgarh: ['Gond (Chhattisgarh)', 'Oraon (CG)', 'Halba (CG)'],
    Jharkhand: ['Santhal', 'Munda', 'Oraon', 'Ho', 'Kharia'],
    Odisha: ['Santal (Odisha)', 'Kondh', 'Saura', 'Gond (Odisha)'],
    Maharashtra: ['Warli', 'Kokna', 'Bhil (Maharashtra)', 'Mahadeo Koli (ST)'],
    'North East': ['Bodo', 'Naga', 'Mizo', 'Khasi', 'Garo', 'Tripuri', 'Adi', 'Apatani'],
    'Tamil Nadu': ['Irula', 'Badaga (ST status)', 'Kurumba'],
    Kerala: ['Irula (Kerala)', 'Kurichchan'],
    'Andhra Pradesh': ['Gond (AP)', 'Koya', 'Yanadi'],
    'Himachal Pradesh': ['Gaddi', 'Kinnaura', 'Lahaula'],
    Uttarakhand: ['Tharu', 'Jaunsari', 'Bhotiya (ST)'],
    Assam: ['Bodo (Assam)', 'Mishing', 'Karbi'],
    Sikkim: ['Bhutia (ST)', 'Lepcha'],
  },

  'Other Hindu OBC / Service communities': {
    'Uttar Pradesh': ['Nai / Hajam (UP)', 'Dhobi (UP)', 'Kahar (UP)', 'Bind (UP)', 'Mallah (UP)'],
    Bihar: ['Nai (Bihar)', 'Dhobi (Bihar)', 'Noniya', 'Tanti (Bihar)'],
    Rajasthan: ['Nai (Rajasthan)', 'Dhobi (Rajasthan)', 'Regar (OBC)'],
    Gujarat: ['Ghanchi', 'Darzi (Gujarat OBC)', 'Mochi (Gujarat)'],
    Maharashtra: ['Mali', 'Sutar (OBC)', 'Dhobi (Maharashtra)'],
    Punjab: ['Tarkhan (OBC)', 'Lohar (Punjab OBC)'],
    'Pan India': ['Dhobi', 'Nai / Hajam', 'Darzi', 'Rangrez', 'Julaha (Hindu weaver)'],
  },

  Other: {
    'Pan India': [...COMMON_END],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

export function getCommunityFieldLabel(religion) {
  switch (religion) {
    case 'Muslim': return 'Community / Biradari';
    case 'Christian': return 'Denomination / Church';
    case 'Sikh': return 'Community / Sampradaya';
    case 'Jain': return 'Jain Sangh / Community';
    case 'Buddhist': return 'Buddhist Community';
    case 'Parsi': return 'Parsi / Irani Community';
    case 'Jewish': return 'Jewish Community';
    case 'No Religion': return 'Belief / Identity';
    case 'Other': return 'Community / Faith';
    default: return 'Caste / Community';
  }
}

export function getCastesByReligion(religion) {
  switch (religion) {
    case 'Hindu':
      return flattenByState(HINDU_CASTES, 'Hindu');
    case 'Muslim':
      return flattenByState(MUSLIM_COMMUNITIES, 'Muslim');
    case 'Christian':
      return flattenByState(CHRISTIAN_DENOMINATIONS, 'Christian');
    case 'Sikh':
      return flattenByState(SIKH_CASTES, 'Sikh');
    case 'Jain':
      return flattenByState(JAIN_CASTES, 'Jain');
    case 'Buddhist':
      return flattenByState(BUDDHIST_CASTES, 'Buddhist');
    case 'Parsi':
      return flattenByState(PARSI_CASTES, 'Parsi');
    case 'Jewish':
      return flattenByState(JEWISH_CASTES, 'Jewish');
    case 'No Religion':
      return flattenByState(NO_RELIGION_COMMUNITIES, 'No Religion');
    case 'Other':
      return flattenByState(OTHER_RELIGION_COMMUNITIES, 'Other');
    default:
      return [{ val: "Doesn't Matter", label: "Doesn't Matter", group: 'Other' }];
  }
}

/** Browse hierarchy: categories for a religion */
export function getCasteCategoriesByReligion(religion) {
  const tree = getCasteTreeByReligion(religion);
  return tree ? Object.keys(tree) : [];
}

/** States/regions under a category */
export function getCasteRegionsByReligion(religion, category) {
  const tree = getCasteTreeByReligion(religion);
  if (!tree || !tree[category]) return [];
  return Object.keys(tree[category]);
}

/** Communities under category + region */
export function getCastesByReligionAndRegion(religion, category, region) {
  const tree = getCasteTreeByReligion(religion);
  const list = tree?.[category]?.[region];
  return Array.isArray(list) ? list.map((c) => ({ val: c, label: c })) : [];
}

export function getCasteTreeByReligion(religion) {
  switch (religion) {
    case 'Hindu': return HINDU_CASTES;
    case 'Muslim': return MUSLIM_COMMUNITIES;
    case 'Christian': return CHRISTIAN_DENOMINATIONS;
    case 'Sikh': return SIKH_CASTES;
    case 'Jain': return JAIN_CASTES;
    case 'Buddhist': return BUDDHIST_CASTES;
    case 'Parsi': return PARSI_CASTES;
    case 'Jewish': return JEWISH_CASTES;
    case 'No Religion': return NO_RELIGION_COMMUNITIES;
    case 'Other': return OTHER_RELIGION_COMMUNITIES;
    default: return null;
  }
}

/** Stats for admin / debug */
export function getCasteDataStats() {
  const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Parsi', 'Jewish', 'No Religion', 'Other'];
  return religions.map((r) => {
    const opts = getCastesByReligion(r);
    const categories = getCasteCategoriesByReligion(r);
    return { religion: r, totalOptions: opts.length, categories: categories.length };
  });
}
