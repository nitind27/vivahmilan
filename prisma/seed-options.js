// Seed default profile options from static data
// Run: node prisma/seed-options.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const { randomUUID } = require('crypto');

const conn_config = {
  host:     process.env.DATABASE_HOST,
  user:     process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port:     parseInt(process.env.DATABASE_PORT),
};

// All options to seed
const OPTIONS = [
  // Religions
  ...['Hindu','Muslim','Christian','Sikh','Buddhist','Jain','Parsi','Jewish','No Religion','Other']
    .map((v,i) => ({ category: 'religion', value: v, label: v, group: null, sortOrder: i })),

  // Castes - Hindu (grouped)
  ...Object.entries({
    'Brahmin - UP / Bihar': ['Kanyakubja','Saryupareen','Gaur Brahmin','Maithil Brahmin','Bhumihar Brahmin','Tyagi','Pandey','Mishra','Shukla','Tiwari','Upadhyay','Pathak','Dubey','Tripathi','Bajpai','Dixit','Awasthi','Srivastava','Sharma (UP)','Joshi (UP)'],
    'Brahmin - Maharashtra': ['Deshastha Rigvedi','Deshastha Madhyandin','Chitpavan / Konkanastha','Karhade','CKP','Deshpande','Kulkarni','Joshi (Maharashtra)'],
    'Brahmin - Tamil Nadu': ['Iyer - Smartha','Iyengar - Vaishnava','Gurukkal','Dikshitar','Ashtasahasram','Vadama','Vathima'],
    'Brahmin - Andhra / Telangana': ['Niyogi','Vaidiki','Smartha (Telugu)','Velanadu','Mulakanadu'],
    'Brahmin - Karnataka': ['Havyaka','Shivalli','Kota','Sthanika','Saraswat (Karnataka)'],
    'Brahmin - Gujarat / Rajasthan': ['Audichya','Mewada','Nagar','Modh Brahmin','Shrimali Brahmin','Pushkarna','Pareek','Dadhich'],
    'Brahmin - Punjab / Himachal': ['Mohyal','Saraswat (Punjab)','Gaur (Punjab)','Trigarta','Dogra Brahmin','Kashmiri Pandit'],
    'Brahmin - Bengal / Odisha': ['Rarhi Brahmin','Barendra Brahmin','Utkal Brahmin','Shrotriya'],
    'Brahmin - Kerala': ['Namboothiri','Embrantiri','Potti'],
    'Rajput - UP / Bihar / MP': ['Chauhan','Rathore','Sisodia','Tomar','Chandela','Bhati','Kachwaha','Jadeja','Solanki','Parmar','Bundela','Baghel','Sengar','Bisen'],
    'Rajput - Rajasthan': ['Rathore (Marwar)','Shekhawat','Sisodia (Mewar)','Hada','Bhati (Jaisalmer)','Kachwaha (Jaipur)'],
    'Rajput - Gujarat': ['Jadeja (Kutch)','Zala','Gohil','Vaghela','Chudasama'],
    'Maratha / Kunbi': ['Maratha (96 Kuli)','Kunbi Maratha','Deshmukh','Patil','Bhosale','Shinde','Holkar','Gaekwad','Jadhav','Pawar','Chavan','Kadam'],
    'Agarwal': ['Agarwal - Garg','Agarwal - Bansal','Agarwal - Singhal','Agarwal - Mittal','Agarwal - Goyal','Agarwal - Jindal','Agarwal - Gupta'],
    'Maheshwari': ['Maheshwari - Laddha','Maheshwari - Rathi','Maheshwari - Somani','Maheshwari - Bangur','Maheshwari - Bajaj','Maheshwari - Birla'],
    'Baniya - UP / Bihar': ['Gupta','Vaishya','Rastogi','Khandelwal','Oswal','Porwal','Sahu','Kalwar'],
    'Baniya - Gujarat': ['Leva Patel','Kadva Patel','Bhatia','Lohana','Vania','Kapol','Modh Vanik','Soni (Gujarat)'],
    'Kayastha': ['Srivastava (Kayastha)','Mathur Kayastha','Bhatnagar','Saxena','Ambastha','Nigam','Kulshrestha'],
    'Khatri': ['Khatri - Kapoor','Khatri - Khanna','Khatri - Malhotra','Khatri - Mehra','Khatri - Sethi','Khatri - Chopra','Khatri - Kohli','Khatri - Ahuja'],
    'Arora': ['Arora - Sharma','Arora - Verma','Arora - Gupta','Arora - Chawla','Arora - Dhawan'],
    'Patel / Patil': ['Leva Patel','Kadva Patel','Anjana Patel','Matiya Patel','Patil (Maharashtra)','Patidar'],
    'Yadav': ['Ahir (UP)','Ahir (Bihar)','Ahir (Haryana)','Gwala','Goala (Bengal)','Yadav (Rajasthan)','Yadav (Maharashtra)'],
    'Jat': ['Jat (UP)','Jat (Haryana)','Jat (Rajasthan)','Jat (Punjab)','Jat (Delhi)'],
    'South India - Andhra / Telangana': ['Kamma','Kapu','Naidu','Velama','Reddy','Balija','Telaga','Raju'],
    'South India - Kerala': ['Nair','Ezhava / Thiyya','Menon','Pillai','Kurup','Panikkar','Varma'],
    'South India - Karnataka': ['Vokkaliga','Gowda','Lingayat','Banajiga','Panchamasali','Kuruba','Bunt'],
    'South India - Tamil Nadu': ['Mudaliar','Gounder','Thevar','Nadar','Chettiar','Pillai (Tamil)','Vellalar','Vanniyar'],
    'Scheduled Caste': ['Chamar / Jatav','Dhobi','Pasi','Kori','Balmiki','Dusadh / Paswan','Mahar','Mang','Madiga','Mala','Paraiyar','Pallar'],
    'Scheduled Tribe': ['Bhil','Gond','Santhal','Munda','Oraon','Meena / Mina','Bodo','Naga','Mizo','Khasi'],
    'Other Hindu': ["Doesn't Matter",'Inter-Caste','Any Caste'],
  }).flatMap(([group, values]) =>
    values.map((v,i) => ({ category: 'caste_Hindu', value: v, label: v, group, sortOrder: i }))
  ),

  // Castes - Muslim
  ...['Syed','Sheikh','Mughal','Pathan / Pashtun','Ansari','Qureshi','Siddiqui','Farooqi','Hashmi','Alvi','Memon (Gujarat)','Bohra (Dawoodi)','Khoja (Ismaili)','Mapilla / Moplah (Kerala)','Rajput Muslim',"Doesn't Matter"]
    .map((v,i) => ({ category: 'caste_Muslim', value: v, label: v, group: 'Muslim Community', sortOrder: i })),

  // Castes - Christian
  ...['Roman Catholic','Latin Catholic','Syro-Malabar Catholic','Jacobite Syrian Church','Orthodox Syrian Church','Marthoma Syrian Church','Church of South India (CSI)','Church of North India (CNI)','Pentecostal','Baptist','Methodist','Anglican',"Doesn't Matter"]
    .map((v,i) => ({ category: 'caste_Christian', value: v, label: v, group: 'Denomination', sortOrder: i })),

  // Castes - Sikh
  ...['Jat Sikh','Khatri Sikh','Arora Sikh','Ramgarhia (Tarkhan)','Saini Sikh','Mazabi Sikh','Ramdasia',"Doesn't Matter"]
    .map((v,i) => ({ category: 'caste_Sikh', value: v, label: v, group: 'Sikh Community', sortOrder: i })),

  // Castes - Jain
  ...['Digambar - Agarwal','Digambar - Khandelwal','Digambar - Porwal','Shwetambar - Oswal','Shwetambar - Shrimali','Shwetambar - Porwal','Sthanakvasi','Terapanthi',"Doesn't Matter"]
    .map((v,i) => ({ category: 'caste_Jain', value: v, label: v, group: 'Jain Community', sortOrder: i })),

  // Gotra
  ...['Kashyap','Bharadwaj','Vashistha','Atri','Vishwamitra','Gautam','Jamadagni','Agastya','Garg','Parashar','Sandilya','Kaushik','Shandilya','Angiras','Other',"Don't Know"]
    .map((v,i) => ({ category: 'gotra', value: v, label: v, group: null, sortOrder: i })),

  // Mother Tongue
  ...['Hindi','Marathi','Gujarati','Bengali','Tamil','Telugu','Kannada','Malayalam','Punjabi','Odia','Urdu','Rajasthani','Bhojpuri','Maithili','Kashmiri','English','Other']
    .map((v,i) => ({ category: 'motherTongue', value: v, label: v, group: null, sortOrder: i })),

  // Education
  ...['High School','Diploma',"Bachelor's","Master's",'PhD','MBBS','CA','LLB','B.Tech','MBA','B.Com','B.Sc','M.Sc','B.Ed','Other']
    .map((v,i) => ({ category: 'education', value: v, label: v, group: null, sortOrder: i })),

  // Profession
  ...['Software Engineer','Doctor','Teacher','Business / Entrepreneur','Lawyer','Engineer','Accountant / CA','Government Employee','Defence / Military','Banker','Scientist','Artist / Designer','Nurse','Pharmacist','Architect','Professor','Journalist','Other']
    .map((v,i) => ({ category: 'profession', value: v, label: v, group: null, sortOrder: i })),

  // Income
  ...['Below ₹2 Lakh','₹2-5 Lakh','₹5-10 Lakh','₹10-20 Lakh','₹20-30 Lakh','₹30-50 Lakh','₹50 Lakh - 1 Crore','Above 1 Crore','Not Disclosed']
    .map((v,i) => ({ category: 'income', value: v, label: v, group: null, sortOrder: i })),

  // Diet
  ...['Vegetarian','Non-Vegetarian','Eggetarian','Vegan','Jain Vegetarian','Occasionally Non-Veg','Halal']
    .map((v,i) => ({ category: 'diet', value: v, label: v, group: null, sortOrder: i })),

  // Body Type
  ...['Slim','Athletic','Average','Heavy']
    .map((v,i) => ({ category: 'bodyType', value: v, label: v, group: null, sortOrder: i })),

  // Complexion
  ...['Very Fair','Fair','Wheatish','Wheatish Brown','Dark']
    .map((v,i) => ({ category: 'complexion', value: v, label: v, group: null, sortOrder: i })),

  // Family Type
  ...['Nuclear','Joint','Extended']
    .map((v,i) => ({ category: 'familyType', value: v, label: v, group: null, sortOrder: i })),

  // Family Status
  ...['Middle Class','Upper Middle Class','Rich / Affluent','High Net Worth']
    .map((v,i) => ({ category: 'familyStatus', value: v, label: v, group: null, sortOrder: i })),

  // Horoscope Signs
  ...['Mesh (Aries)','Vrishabh (Taurus)','Mithun (Gemini)','Kark (Cancer)','Simha (Leo)','Kanya (Virgo)','Tula (Libra)','Vrishchik (Scorpio)','Dhanu (Sagittarius)','Makar (Capricorn)','Kumbh (Aquarius)','Meen (Pisces)']
    .map((v,i) => ({ category: 'horoscopeSign', value: v, label: v, group: null, sortOrder: i })),

  // Nakshatra
  ...['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati']
    .map((v,i) => ({ category: 'nakshatra', value: v, label: v, group: null, sortOrder: i })),
];

async function main() {
  const conn = await mysql.createConnection(conn_config);
  console.log('🌱 Seeding profile options...');
  let inserted = 0, skipped = 0;

  for (const opt of OPTIONS) {
    const [ex] = await conn.execute(
      'SELECT id FROM profileoption WHERE category = ? AND value = ?',
      [opt.category, opt.value]
    );
    if (ex.length > 0) { skipped++; continue; }
    await conn.execute(
      'INSERT INTO profileoption (id, category, value, label, `group`, sortOrder, isActive, createdAt) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())',
      [randomUUID(), opt.category, opt.value, opt.label, opt.group || null, opt.sortOrder]
    );
    inserted++;
  }

  await conn.end();
  console.log(`✅ Done! Inserted: ${inserted}, Skipped (already exist): ${skipped}`);
  console.log(`📊 Total options: ${OPTIONS.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
