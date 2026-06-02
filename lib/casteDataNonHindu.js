/**
 * Non-Hindu + Other religion community trees (Category → State → Community)
 * No surnames — only biradari, denomination, sect, regional identity
 */

const END = ["Doesn't Matter", 'Inter-Community', 'Prefer Not to Say'];

// ─── MUSLIM ───────────────────────────────────────────────────────────────────
export const MUSLIM_COMMUNITIES = {
  'Ashraf — Syed / Sheikh / Pathan': {
    'Uttar Pradesh': ['Syed (UP — Lucknow)', 'Syed (UP — Barabanki)', 'Sheikh (UP)', 'Pathan (UP)', 'Qureshi (UP)', 'Mughal (UP)'],
    Bihar: ['Syed (Bihar)', 'Sheikh (Bihar)', 'Pathan (Bihar)', 'Ashraf (Bihar)'],
    'West Bengal': ['Syed (Bengal)', 'Sheikh (Bengal)', 'Ashraf (Bengal)'],
    'Jammu & Kashmir': ['Kashmiri Syed', 'Kashmiri Sheikh', 'Kashmiri Muslim (Ashraf)'],
    Delhi: ['Syed (Delhi)', 'Sheikh (Delhi)', 'Pathan (Delhi)', 'Mughal (Delhi)'],
    Rajasthan: ['Pathan (Rajasthan)', 'Sheikh (Rajasthan)', 'Syed (Rajasthan)'],
    Gujarat: ['Syed (Gujarat)', 'Sheikh (Gujarat)', 'Pathan (Gujarat)'],
    Maharashtra: ['Syed (Maharashtra)', 'Pathan (Maharashtra)'],
    'Madhya Pradesh': ['Syed (MP)', 'Sheikh (MP)', 'Pathan (MP)'],
    Punjab: ['Pathan (Punjab)', 'Syed (Punjab)'],
    Haryana: ['Pathan (Haryana)', 'Sheikh (Haryana)'],
    Kerala: ['Thangal (Syed — Kerala)', 'Mapilla Syed'],
    Assam: ['Syed (Assam)', 'Sheikh (Assam)'],
    'Pan India': ['Syed', 'Sheikh', 'Pathan / Pashtun', 'Mughal (Muslim)', 'Qureshi', 'Mirza', 'Malik (Muslim)'],
  },

  'Ajlaf — Ansari / Julaha / Artisans': {
    'Uttar Pradesh': ['Ansari (UP)', 'Julaha (Muslim UP)', 'Mansoori (UP)', 'Qassab (UP)', 'Darzi (Muslim UP)', 'Lohar (Muslim UP)', 'Nai (Muslim UP)', 'Teli (Muslim UP)'],
    Bihar: ['Ansari (Bihar)', 'Julaha (Bihar)', 'Qassab (Bihar)', 'Halalkhor (Bihar)', 'Dhobi (Muslim Bihar)'],
    'West Bengal': ['Julaha (Muslim Bengal)', 'Ansari (Bengal)', 'Teli (Muslim Bengal)', 'Namasudra Muslim'],
    Assam: ['Muslim Assamese (Goria)', 'Moria (Assam Muslim)', 'Deshi Muslim (Assam)'],
    Gujarat: ['Ansari (Gujarat)', 'Ghanchi (Muslim)', 'Teli (Muslim Gujarat)', 'Julaha (Gujarat)'],
    Maharashtra: ['Ansari (Maharashtra)', 'Momina', 'Dhobi (Muslim Maharashtra)'],
    'Madhya Pradesh': ['Ansari (MP)', 'Julaha (MP Muslim)', 'Teli (Muslim MP)'],
    Rajasthan: ['Ansari (Rajasthan)', 'Meo (see Meo section)', 'Julaha (Rajasthan Muslim)'],
    Odisha: ['Ansari (Odisha)', 'Julaha (Odisha Muslim)'],
    Jharkhand: ['Ansari (Jharkhand)'],
    Karnataka: ['Ansari (Karnataka)'],
    'Andhra Pradesh': ['Ansari (AP)', 'Dudekula (weaver — AP)'],
    Telangana: ['Ansari (Telangana)', 'Dudekula (Telangana)'],
    'Pan India': ['Ansari', 'Julaha (Muslim)', 'Qassab', 'Darzi (Muslim)', 'Lohar (Muslim)', 'Kumhar (Muslim)'],
  },

  'Meo / Mewati (Mewat belt)': {
    Haryana: ['Meo (Mewat — Haryana)', 'Mewati (Haryana)'],
    Rajasthan: ['Meo (Alwar — Bharatpur)', 'Mewati (Rajasthan)'],
    'Uttar Pradesh': ['Meo (UP — Mewat border)', 'Mewati (UP)'],
    Delhi: ['Meo (Delhi NCR)'],
  },

  'Gujarat — Memon / Bohra / Khoja': {
    Gujarat: [
      'Memon (Gujarat)', 'Dawoodi Bohra', 'Sulaimani Bohra', 'Alavi Bohra',
      'Khoja (Ismaili — Nizari)', 'Khoja (Ithna Ashari)', 'Sunni Gujarati',
      'Shia Gujarati (Bohra-adjacent)', 'Ghanchi (Muslim Gujarat)',
    ],
    Maharashtra: ['Memon (Maharashtra)', 'Bohra (Maharashtra)', 'Khoja (Mumbai)'],
    'Madhya Pradesh': ['Memon (MP)', 'Bohra (MP)'],
    Rajasthan: ['Memon (Rajasthan border)'],
    'Pan India': ['Memon', 'Dawoodi Bohra', 'Khoja (Ismaili)'],
  },

  'Kerala / Lakshadweep — Mapilla': {
    Kerala: ['Mapilla / Moplah', 'Muslim Mappila (North Kerala)', 'Mapilla (Central Kerala)', 'Thangal (Kerala)'],
    'Tamil Nadu': ['Labbai (TN coast)', 'Rowther (TN)'],
    Karnataka: ['Beary (Dakshina Kannada)', 'Navayath (Uttara Kannada)'],
    Lakshadweep: ['Mapilla (Lakshadweep)'],
  },

  'Deccan / Hyderabad': {
    Telangana: ['Hyderabadi Muslim', 'Deccani Muslim (Telangana)', 'Dakhni Muslim', 'Chowdhury (Deccan)'],
    'Andhra Pradesh': ['Deccani Muslim (AP)', 'Dudekula (AP)', 'Shaik (AP)'],
    Maharashtra: ['Deccani Muslim (Maharashtra)', 'Konkani Muslim', 'Dakhni (Marathwada)'],
    Karnataka: ['Deccani Muslim (Karnataka)'],
  },

  'Punjab / Haryana / Himachal': {
    Punjab: ['Muslim Rajput (Punjab)', 'Jat Muslim (Punjab)', 'Gujjar Muslim (Punjab)', 'Kashmiri Muslim (Punjab diaspora)'],
    Haryana: ['Jat Muslim (Haryana)', 'Rajput Muslim (Haryana)', 'Gujjar Muslim (Haryana)'],
    'Himachal Pradesh': ['Muslim Gaddi', 'Pathan (HP)'],
    Uttarakhand: ['Muslim Rajput (Uttarakhand)', 'Pathan (Uttarakhand)'],
  },

  'Sunni — Barelvi / Deobandi / Ahl-e-Hadith': {
    'Uttar Pradesh': ['Sunni Barelvi (UP)', 'Sunni Deobandi (UP)', 'Ahl-e-Hadith (UP)', 'Sunni (Bareilly tradition)', 'Sunni (Deoband tradition)'],
    Bihar: ['Sunni Barelvi (Bihar)', 'Sunni Deobandi (Bihar)'],
    'West Bengal': ['Sunni (Bengal — Furfura / local)', 'Sunni Deobandi (Bengal)'],
    Delhi: ['Sunni Barelvi (Delhi)', 'Sunni Deobandi (Delhi)', 'Ahl-e-Hadith (Delhi)'],
    Maharashtra: ['Sunni (Maharashtra)', 'Sunni Barelvi (Maharashtra)'],
    Gujarat: ['Sunni (Gujarat)', 'Sunni Barelvi (Gujarat)'],
    'Madhya Pradesh': ['Sunni (MP)', 'Sunni Deobandi (MP)'],
    'Pan India': ['Sunni (Hanafi majority)', 'Sunni (general)'],
  },

  'Shia — Twelver / Ismaili': {
    'Uttar Pradesh': ['Shia (Lucknow — Twelver)', 'Shia (Amroha)', 'Shia (Jaunpur)'],
    Bihar: ['Shia (Bihar — small pockets)'],
    'Jammu & Kashmir': ['Shia (Kargil)', 'Shia (Budgam)', 'Shia (Srinagar — Imambara tradition)'],
    Gujarat: ['Shia (Gujarat)', 'Shia Bohra-related'],
    Maharashtra: ['Shia (Mumbai)', 'Shia (Pune)'],
    Karnataka: ['Shia (Karnataka coast)'],
    'Pan India': ['Shia (Twelver)', 'Shia (general)'],
  },

  'Rajput / Jat / Yadav Muslim': {
    Rajasthan: ['Rajput Muslim (Rajasthan)', 'Ranghar (Rajasthan)'],
    'Uttar Pradesh': ['Rajput Muslim (UP)', 'Yadav Muslim (UP)', 'Jat Muslim (UP border)'],
    Bihar: ['Yadav Muslim (Bihar)', 'Rajput Muslim (Bihar)'],
    Gujarat: ['Rajput Muslim (Gujarat)'],
    Punjab: ['Rajput Muslim (Punjab)', 'Jat Muslim (Punjab)'],
    Haryana: ['Rajput Muslim (Haryana)', 'Jat Muslim (Haryana)'],
  },

  'Tribal / Pasmanda (NE & tribal belts)': {
    Assam: ['Goria', 'Moria', 'Deshi', 'Maimal', 'Jolha (Assam)'],
    'West Bengal': ['Jolha (Bengal tribal Muslim)'],
    Tripura: ['Tripuri Muslim', 'Bengali Muslim (Tripura)'],
    Manipur: ['Meitei Pangal (Manipuri Muslim)'],
    'Arunachal Pradesh': ['Muslim (Arunachal — migrant communities)'],
    Jharkhand: ['Pasmanda (Jharkhand)', 'Ansari (Jharkhand tribal belt)'],
    Odisha: ['Muslim (Odisha — coastal)'],
  },

  'Ahmadiyya / Other schools': {
    'Pan India': ['Ahmadiyya', 'Qadiani (Ahmadiyya)', 'Sufi tradition (Chishti)', 'Sufi tradition (Nizami)'],
    Kerala: ['Ahmadiyya (Kerala)'],
    Punjab: ['Ahmadiyya (Punjab — historical)'],
  },

  Other: {
    'Pan India': [...END, 'Converted Muslim (Revert)', 'Muslim (community not listed)'],
  },
};

// ─── CHRISTIAN ────────────────────────────────────────────────────────────────
export const CHRISTIAN_DENOMINATIONS = {
  'Catholic — Roman & Eastern': {
    Kerala: ['Syro-Malabar Catholic', 'Syro-Malankara Catholic', 'Latin Catholic (Kerala)', 'Roman Catholic (Kerala)'],
    'Tamil Nadu': ['Latin Catholic (TN)', 'Roman Catholic (TN — coastal)', 'Mukkuvar Catholic'],
    Karnataka: ['Roman Catholic (Karnataka — Mangalore)', 'Latin Catholic (Karnataka)'],
    Goa: ['Goan Catholic', 'Roman Catholic (Goa)', 'East Indian Catholic'],
    Maharashtra: ['Roman Catholic (Mumbai)', 'East Indian (Maharashtra)'],
    'West Bengal': ['Roman Catholic (Bengal)', 'Anglo-Indian Catholic (Bengal)'],
    'North East': ['Roman Catholic (Nagaland)', 'Roman Catholic (Mizoram)', 'Roman Catholic (Meghalaya)', 'Roman Catholic (Manipur)'],
    'Andhra Pradesh': ['Roman Catholic (AP)'],
    'Madhya Pradesh': ['Roman Catholic (MP — Chhindwara belt)'],
    Chhattisgarh: ['Roman Catholic (Chhattisgarh)'],
    Odisha: ['Roman Catholic (Odisha)'],
    Jharkhand: ['Roman Catholic (Jharkhand)'],
    'Pan India': ['Roman Catholic'],
  },

  'Syrian / Orthodox / Nasrani': {
    Kerala: [
      'Jacobite Syrian Christian', 'Malankara Orthodox Syrian', 'Marthoma Syrian',
      'Knanaya Christian', 'St. Thomas Christian (Nasrani)', 'Syro-Oriental Orthodox (Kerala)',
    ],
    'Tamil Nadu': ['Syrian Christian (TN — diaspora)', 'Nadar Christian (Syrian tradition)'],
    Karnataka: ['Malankara (Karnataka diaspora)'],
  },

  'Protestant — CSI / CNI / Anglican': {
    'Tamil Nadu': ['Church of South India (CSI — TN)', 'Anglican (TN legacy)'],
    Kerala: ['Church of South India (CSI — Kerala)', 'Mar Thoma (Protestant-leaning)'],
    Karnataka: ['CSI (Karnataka)', 'Methodist (Karnataka)'],
    'Andhra Pradesh': ['CSI (Andhra)', 'Andhra Baptist'],
    Telangana: ['CSI (Telangana)'],
    Maharashtra: ['CSI (Maharashtra)', 'Anglican (Mumbai)'],
    'West Bengal': ['CNI (Bengal)', 'Anglican (Kolkata)'],
    'North East': ['Baptist (Nagaland)', 'Presbyterian (Mizoram)', 'Presbyterian (Nagaland)', 'Baptist (Manipur)'],
    Punjab: ['Anglican (Punjab — colonial)', 'CNI (Punjab)'],
    Delhi: ['CNI (Delhi)', 'Anglican (Delhi)'],
    'Pan India': ['Church of South India (CSI)', 'Church of North India (CNI)', 'Anglican / Episcopal', 'Methodist', 'Baptist', 'Lutheran', 'Presbyterian'],
  },

  'Pentecostal / Evangelical / Charismatic': {
    Kerala: ['Pentecostal (Kerala)', 'Brethren (Kerala)', 'Assemblies of God (Kerala)'],
    'Tamil Nadu': ['Pentecostal (TN)', 'Evangelical (TN)'],
    'Andhra Pradesh': ['Pentecostal (AP)', 'Telugu Christian (Evangelical)'],
    Telangana: ['Pentecostal (Telangana)'],
    Karnataka: ['Pentecostal (Karnataka)'],
    Maharashtra: ['Pentecostal (Mumbai / Pune)'],
    'North East': ['Pentecostal (NE India)'],
    'Pan India': ['Pentecostal', 'Assembly of God', 'Seventh-day Adventist', 'Evangelical', 'Born Again Christian', 'Brethren', 'Charismatic'],
  },

  'Dalit / Adivasi Christian': {
    'Tamil Nadu': ['Dalit Christian (Paraiyar church)', 'Adi Dravida Christian'],
    'Andhra Pradesh': ['Dalit Christian (AP)', 'Madiga Christian'],
    Punjab: ['Dalit Christian (Punjab — Mazhabi background)'],
    Maharashtra: ['Dalit Christian (Maharashtra — Mahar church)'],
    'North East': ['Tribal Christian (Naga)', 'Tribal Christian (Mizo)', 'Tribal Christian (Khasi — Christian)', 'Tribal Christian (Garo)'],
    Odisha: ['Dalit Christian (Odisha)', 'Pano Christian'],
    Chhattisgarh: ['Gond Christian', 'Dalit Christian (CG)'],
    Jharkhand: ['Santhal Christian', 'Oraon Christian'],
  },

  'Anglo-Indian / Konkani / Regional': {
    'West Bengal': ['Anglo-Indian (Bengal)', 'Anglo-Indian (Kolkata)'],
    Maharashtra: ['Anglo-Indian (Mumbai)', 'East Indian (Mumbai)'],
    Goa: ['Goan Catholic (Konkani)', 'Protestant (Goa — rare)'],
    Karnataka: ['Mangalorean Christian', 'Konkani Christian'],
    Delhi: ['Anglo-Indian (Delhi)'],
    'Pan India': ['Anglo-Indian'],
  },

  Other: {
    'Pan India': [...END, 'Christian (denomination not listed)'],
  },
};

// ─── SIKH ─────────────────────────────────────────────────────────────────────
export const SIKH_CASTES = {
  'Jat Sikh': {
    Punjab: ['Jat Sikh (Majha — Amritsar / Gurdaspur)', 'Jat Sikh (Doaba — Jalandhar / Hoshiarpur)', 'Jat Sikh (Malwa — Ludhiana / Patiala)'],
    Haryana: ['Jat Sikh (Haryana — Sirsa / Fatehabad)'],
    Rajasthan: ['Jat Sikh (Sri Ganganagar / Hanumangarh)'],
    Delhi: ['Jat Sikh (Delhi NCR)'],
    Uttarakhand: ['Jat Sikh (Uttarakhand — Terai)'],
    'Uttar Pradesh': ['Jat Sikh (UP — border belt)'],
  },

  'Khatri / Arora': {
    Punjab: ['Khatri Sikh', 'Arora Sikh', 'Bhatia Sikh', 'Khatri (Amritsar)', 'Khatri (Lahore diaspora)'],
    Delhi: ['Khatri Sikh (Delhi NCR)', 'Arora Sikh (Delhi)'],
    Haryana: ['Khatri Sikh (Haryana)'],
    'Jammu & Kashmir': ['Khatri Sikh (Jammu)'],
    'Pan India': ['Khatri Sikh', 'Arora Sikh'],
  },

  'Ramgarhia / Tarkhan / Artisan': {
    Punjab: ['Ramgarhia (Tarkhan Sikh)', 'Lohar Sikh', 'Sunar Sikh', 'Kumhar Sikh', 'Nai Sikh', 'Carpenter Sikh (Ramgarhia)'],
    Haryana: ['Ramgarhia (Haryana)'],
    Delhi: ['Ramgarhia (Delhi NCR)'],
    'Pan India': ['Ramgarhia'],
  },

  'Rajput / Labana / Saini / Gujjar Sikh': {
    Punjab: ['Rajput Sikh', 'Labana Sikh', 'Saini Sikh', 'Gujjar Sikh', 'Gursikh (general)'],
    Haryana: ['Rajput Sikh (Haryana)', 'Saini Sikh (Haryana)'],
    'Pan India': ['Gursikh', 'Sikh (community not listed)'],
  },

  'Mazhabi / Ravidassia / SC Sikh': {
    Punjab: ['Mazhabi Sikh', 'Ramdasia Sikh', 'Balmiki Sikh', 'Ravidassia Sikh', 'Ad-Dharmi Sikh'],
    Haryana: ['Mazhabi Sikh (Haryana)', 'Ravidassia (Haryana)'],
    'Uttar Pradesh': ['Ravidassia (UP)', 'Mazhabi (UP border)'],
  },

  'Sikh sect / observance': {
    'Pan India': ['Amritdhari Sikh', 'Sahajdhari Sikh', 'Keshdhari Sikh', 'Namdhari Sikh', 'Nihang (rare)'],
    Punjab: ['Amritdhari (Punjab)', 'Sahajdhari (Punjab)'],
  },

  Other: {
    'Pan India': [...END],
  },
};

// ─── JAIN ─────────────────────────────────────────────────────────────────────
export const JAIN_CASTES = {
  Digambar: {
    'Madhya Pradesh': ['Digambar Jain (MP)', 'Digambar — Golalare', 'Digambar — Humad', 'Digambar — Bisa Oswal (MP)'],
    Rajasthan: ['Digambar — Khandelwal (Rajasthan)', 'Digambar — Porwal (Rajasthan)', 'Digambar (Marwar)'],
    Karnataka: ['Digambar (Karnataka)', 'Digambar — Bisa Oswal (Karnataka)', 'Digambar (North Karnataka)'],
    Maharashtra: ['Digambar (Maharashtra)', 'Digambar (Vidarbha)'],
    'Uttar Pradesh': ['Digambar (UP — Bundelkhand)', 'Digambar (Agra region)'],
    Bihar: ['Digambar (Bihar)'],
    'Pan India': ['Digambar Jain'],
  },

  Shwetambar: {
    Gujarat: [
      'Shwetambar — Oswal (Gujarat)', 'Shwetambar — Shrimali', 'Shwetambar — Porwal',
      'Shwetambar — Khadayata', 'Shwetambar — Visa Oswal', 'Shwetambar — Dasa Oswal',
      'Shwetambar — Modh', 'Shwetambar — Parwar',
    ],
    Rajasthan: ['Shwetambar — Oswal (Rajasthan)', 'Shwetambar — Agrawal Jain (Rajasthan)', 'Shwetambar (Jaipur)'],
    'Madhya Pradesh': ['Shwetambar (MP)', 'Shwetambar — Oswal (MP)'],
    Maharashtra: ['Shwetambar (Maharashtra)', 'Shwetambar — Oswal (Mumbai)'],
    Delhi: ['Shwetambar (Delhi NCR)'],
    'Uttar Pradesh': ['Shwetambar (UP)', 'Shwetambar — Oswal (UP)'],
    'Pan India': ['Shwetambar Jain', 'Oswal Jain', 'Porwal Jain', 'Shrimali Jain'],
  },

  'Sthanakvasi / Terapanthi / Murtipujak': {
    Rajasthan: ['Sthanakvasi (Rajasthan)', 'Terapanthi (Rajasthan)', 'Terapanthi (Bikaner)'],
    Gujarat: ['Sthanakvasi (Gujarat)', 'Terapanthi (Gujarat)', 'Murtipujak (Gujarat)'],
    Maharashtra: ['Sthanakvasi (Maharashtra)'],
    'Pan India': ['Sthanakvasi', 'Terapanthi', 'Murtipujak'],
  },

  Other: {
    'Pan India': [...END, 'Jain (sect not listed)'],
  },
};

// ─── BUDDHIST ─────────────────────────────────────────────────────────────────
export const BUDDHIST_CASTES = {
  'Navayana / Ambedkarite (Neo-Buddhist)': {
    Maharashtra: ['Mahar Buddhist', 'Chambhar Buddhist', 'Mang Buddhist', 'Ambedkarite Buddhist (Maharashtra)'],
    'Madhya Pradesh': ['Neo-Buddhist (MP)', 'Chamar Buddhist (MP)'],
    'Uttar Pradesh': ['Jatav Buddhist', 'Neo-Buddhist (UP)', 'Chamar Buddhist (UP)'],
    Bihar: ['Neo-Buddhist (Bihar)', 'Mushahar Buddhist'],
    Karnataka: ['Dalit Buddhist (Karnataka)', 'Neo-Buddhist (Karnataka)'],
    Gujarat: ['Neo-Buddhist (Gujarat)'],
    Delhi: ['Neo-Buddhist (Delhi NCR)'],
    'Pan India': ['Ambedkarite Buddhist', 'Navayana Buddhist'],
  },

  'Himalayan / Tibetan tradition': {
    Ladakh: ['Ladakhi Buddhist', 'Tibetan Buddhist (Ladakh)', 'Mahayana (Ladakh)'],
    'Jammu & Kashmir': ['Tibetan Buddhist (J&K)', 'Buddhist (Leh district)'],
    Sikkim: ['Mahayana Buddhist (Sikkim)', 'Vajrayana (Sikkim)', 'Nyingma (Sikkim)'],
    'Arunachal Pradesh': ['Theravada (Arunachal)', 'Mahayana (Arunachal — Monpa)', 'Vajrayana (Tawang)'],
    'Himachal Pradesh': ['Tibetan Buddhist (Dharmshala / Spiti)', 'Mahayana (Kinnaur / Lahaul)'],
    'West Bengal': ['Bengali Buddhist (Darjeeling — Tamang)', 'Tibetan diaspora (Darjeeling)'],
    Uttarakhand: ['Buddhist (Uttarakhand — Tibetan diaspora)'],
    'Pan India': ['Tibetan Buddhist', 'Theravada Buddhist', 'Mahayana Buddhist', 'Vajrayana Buddhist'],
  },

  'Theravada / Maritime (rare in India)': {
    'Andaman and Nicobar': ['Theravada (Nicobar — small)'],
    'Pan India': ['Theravada (general)', 'Zen Buddhist (diaspora)'],
  },

  Other: {
    'Pan India': [...END],
  },
};

// ─── PARSI / ZOROASTRIAN ──────────────────────────────────────────────────────
export const PARSI_CASTES = {
  'Parsi / Irani Zoroastrian': {
    Gujarat: ['Parsi (Gujarat — Surat)', 'Parsi (Navsari)', 'Irani Zoroastrian (Gujarat)'],
    Maharashtra: ['Parsi (Mumbai)', 'Parsi (Pune)', 'Irani Zoroastrian (Mumbai)'],
    Delhi: ['Parsi (Delhi diaspora)'],
    'Pan India': ['Parsi', 'Irani Zoroastrian'],
  },
  Other: {
    'Pan India': [...END],
  },
};

// ─── JEWISH ───────────────────────────────────────────────────────────────────
export const JEWISH_CASTES = {
  'Indian Jewish communities': {
    Maharashtra: ['Bene Israel (Maharashtra)', 'Baghdadi Jewish (Mumbai)', 'Bene Israel (Konkan)'],
    Kerala: ['Cochin Jewish (Kerala)', 'Paradesi Jewish (Kochi)', 'Malabar Jewish'],
    'West Bengal': ['Baghdadi Jewish (Kolkata — historical)'],
    Delhi: ['Jewish (Delhi diaspora)'],
    'Pan India': ['Bene Israel', 'Cochin Jewish', 'Baghdadi Jewish (India)'],
  },
  'Global Jewish heritage (Indian resident)': {
    'Pan India': ['Ashkenazi (India)', 'Sephardi (India)', 'Mizrahi (India)', 'Reform Jewish', 'Orthodox Jewish', 'Conservative Jewish'],
  },
  Other: {
    'Pan India': [...END],
  },
};

// ─── NO RELIGION ──────────────────────────────────────────────────────────────
export const NO_RELIGION_COMMUNITIES = {
  Identity: {
    'Pan India': ['Atheist', 'Agnostic', 'Humanist', 'Secular', 'Spiritual but not religious', 'Free Thinker'],
  },
  Other: {
    'Pan India': [...END],
  },
};

// ─── OTHER FAITHS ─────────────────────────────────────────────────────────────
export const OTHER_RELIGION_COMMUNITIES = {
  'Baháʼí / Sindhi / Multi-faith': {
    'Pan India': ['Baháʼí', 'Sindhi (Sikh-Hindu overlap)', 'Sufi (non-Muslim heritage)', 'Tribal faith (documented)'],
  },
  'Inter-faith / Not classified': {
    'Pan India': ['Inter-faith family', 'Multi-religious background', 'Faith not listed', ...END],
  },
};
