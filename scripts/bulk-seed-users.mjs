#!/usr/bin/env node
/**
 * Bulk insert dummy matrimonial users into the database.
 *
 * Usage:
 *   node scripts/bulk-seed-users.mjs --count 5000
 *   node scripts/bulk-seed-users.mjs --count 10000 --batch 200
 *   node scripts/bulk-seed-users.mjs --count 1000 --prefix testbatch1
 *
 * All users password: 12345678
 * Login requires: emailVerified + adminVerified + complete profile (all set by this script)
 */

import { config } from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { randomUUID, randomInt } from 'crypto';

config({ path: '.env.production' });

const PASSWORD_PLAIN = '12345678';

const MALE_FIRST = ['Aarav','Vivaan','Aditya','Arjun','Rohan','Karan','Rahul','Nitin','Suresh','Manoj','Deepak','Vikram','Harsh','Yash','Dev','Ankit','Pranav','Kunal','Ravi','Sanjay','Amit','Naveen','Gaurav','Pankaj','Sachin','Rajesh','Mohit','Tarun','Varun','Akash'];
const FEMALE_FIRST = ['Priya','Anjali','Neha','Pooja','Kavita','Sneha','Ritu','Meera','Divya','Shreya','Aisha','Fatima','Kiran','Nisha','Swati','Tanvi','Isha','Palak','Simran','Kavya','Riya','Sakshi','Jyoti','Pallavi','Bhavna','Geeta','Lata','Rekha','Sunita','Ananya'];
const LAST = ['Sharma','Verma','Patel','Singh','Kumar','Gupta','Mehta','Shah','Joshi','Reddy','Nair','Iyer','Chopra','Malhotra','Kapoor','Desai','Pandey','Mishra','Rao','Khan','Sheikh','Yadav','Thakur','Saxena','Bose','Das','Menon','Pillai','Agarwal','Jain'];

const RELIGIONS_CASTES = [
  { religion: 'Hindu', castes: ['Brahmin','Kshatriya','Vaishya','Kayastha','Rajput','Maratha','Patel','Jat','Gujjar','Yadav'], gotras: ['Bharadwaj','Kashyap','Vashishtha','Gautam','Agastya','Atri','Angiras','Pulastya'] },
  { religion: 'Muslim', castes: ['Syed','Sheikh','Pathan','Mughal','Ansari','Qureshi'], gotras: [] },
  { religion: 'Sikh', castes: ['Jat','Khatri','Ramgarhia','Arora','Ahluwalia'], gotras: [] },
  { religion: 'Christian', castes: ['Roman Catholic','Protestant','Syrian Christian'], gotras: [] },
  { religion: 'Jain', castes: ['Digambar','Shwetambar'], gotras: [] },
];

const LOCATIONS = [
  { country: 'India', state: 'Maharashtra', city: 'Mumbai' },
  { country: 'India', state: 'Maharashtra', city: 'Pune' },
  { country: 'India', state: 'Gujarat', city: 'Ahmedabad' },
  { country: 'India', state: 'Gujarat', city: 'Surat' },
  { country: 'India', state: 'Gujarat', city: 'Vadodara' },
  { country: 'India', state: 'Rajasthan', city: 'Jaipur' },
  { country: 'India', state: 'Rajasthan', city: 'Udaipur' },
  { country: 'India', state: 'Uttar Pradesh', city: 'Lucknow' },
  { country: 'India', state: 'Uttar Pradesh', city: 'Noida' },
  { country: 'India', state: 'Delhi', city: 'New Delhi' },
  { country: 'India', state: 'Karnataka', city: 'Bengaluru' },
  { country: 'India', state: 'Tamil Nadu', city: 'Chennai' },
  { country: 'India', state: 'Telangana', city: 'Hyderabad' },
  { country: 'India', state: 'West Bengal', city: 'Kolkata' },
  { country: 'India', state: 'Madhya Pradesh', city: 'Indore' },
  { country: 'India', state: 'Punjab', city: 'Ludhiana' },
  { country: 'India', state: 'Bihar', city: 'Patna' },
];

const EDUCATIONS = ["High School", "Diploma", "Bachelor's", "Master's", 'CA', 'MBBS', 'B.Tech', 'M.Tech', 'PhD'];
const PROFESSIONS = ['Software Engineer','Doctor','Teacher','Business Owner','Accountant','Bank Manager','Government Employee','Architect','Lawyer','Marketing Manager','HR Manager','Pharmacist','Nurse','Designer','Consultant','Sales Manager','Engineer','Professor','Shop Owner','Real Estate Agent'];
const INCOMES = ['₹2-5 Lakh','₹5-8 Lakh','₹8-12 Lakh','₹12-20 Lakh','₹20-35 Lakh','₹35-50 Lakh','$30,000 - $50,000','$50,000 - $80,000'];
const DIETS = ['Vegetarian','Non-Vegetarian','Eggetarian','Vegan','Jain Vegetarian'];
const MOTHER_TONGUES = ['Hindi','Gujarati','Marathi','Punjabi','Bengali','Tamil','Telugu','Kannada','Urdu','English'];
const HOROSCOPES = ['Mesh (Aries)','Vrishabh (Taurus)','Mithun (Gemini)','Kark (Cancer)','Singh (Leo)','Kanya (Virgo)','Tula (Libra)','Vrishchik (Scorpio)','Dhanu (Sagittarius)','Makar (Capricorn)','Kumbh (Aquarius)','Meen (Pisces)'];

function parseArgs(argv) {
  const out = { count: 100, batch: 100, prefix: `dummy${Date.now()}`, premiumRatio: 0.15 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--count' && argv[i + 1]) out.count = Math.max(1, parseInt(argv[++i], 10));
    else if (a === '--batch' && argv[i + 1]) out.batch = Math.max(1, parseInt(argv[++i], 10));
    else if (a === '--prefix' && argv[i + 1]) out.prefix = argv[++i];
    else if (a === '--premium-ratio' && argv[i + 1]) out.premiumRatio = Math.min(1, Math.max(0, parseFloat(argv[++i])));
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

function pick(arr) { return arr[randomInt(0, arr.length)]; }

function randomDob(minAge = 22, maxAge = 42) {
  const age = randomInt(minAge, maxAge + 1);
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  d.setMonth(randomInt(0, 12));
  d.setDate(randomInt(1, 28));
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function portraitUrl(gender, seed) {
  const folder = gender === 'MALE' ? 'men' : 'women';
  const num = (seed % 99) + 1;
  return `https://randomuser.me/api/portraits/${folder}/${num}.jpg`;
}

function makeRunId(prefix) {
  const hash = [...prefix].reduce((s, c) => s + c.charCodeAt(0), 0);
  return String(Date.now() + hash);
}

/** Guaranteed unique per run: 9 + 3-digit run bucket + 6-digit index (supports up to 999,999 users/run) */
function phoneUnique(globalIndex, runId) {
  const runBucket = String(Number(runId) % 1000).padStart(3, '0');
  const idx = String(globalIndex).padStart(6, '0');
  return `9${runBucket}${idx}`;
}

function buildUser(globalIndex, prefix, passwordHash, now, premiumRatio, runId) {
  const gender = randomInt(0, 2) === 0 ? 'MALE' : 'FEMALE';
  const first = gender === 'MALE' ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
  const last = pick(LAST);
  const name = `${first} ${last}`;
  const email = `${prefix}.${gender.toLowerCase()}.${globalIndex}.${runId}@dummyvivah.test`;
  const userId = randomUUID();
  const profileId = randomUUID();
  const photoId = randomUUID();
  const image = portraitUrl(gender, globalIndex);
  const isPremium = Math.random() < premiumRatio ? 1 : 0;

  const rel = pick(RELIGIONS_CASTES);
  const caste = pick(rel.castes);
  const gotra = rel.gotras.length ? pick(rel.gotras) : null;
  const loc = pick(LOCATIONS);
  const education = pick(EDUCATIONS);
  const profession = pick(PROFESSIONS);
  const dob = randomDob();
  const height = gender === 'MALE' ? randomInt(165, 188) : randomInt(152, 172);
  const weight = gender === 'MALE' ? randomInt(60, 90) : randomInt(48, 72);
  const aboutMe = `Hi, I am ${first}, a ${profession.toLowerCase()} from ${loc.city}. Looking for a compatible life partner who values family, respect, and growth.`;

  return {
    userId,
    profileId,
    photoId,
    userRow: [
      userId, name, email, now, image, passwordHash, phoneUnique(globalIndex, runId),
      0, 'USER', 1, 1, 0, isPremium, null, 0, null, now, now, 1, null, 0, null,
    ],
    profileRow: [
      profileId, userId, gender, dob, height, weight, rel.religion, caste, pick(MOTHER_TONGUES),
      education, profession, pick(INCOMES), loc.country, loc.state, loc.city, aboutMe,
      'NEVER_MARRIED', 'NO', pick(['NO', 'NO', 'NO', 'OCCASIONALLY']), pick(DIETS),
      pick(['Fair', 'Wheatish', 'Medium', 'Dark']), pick(['Slim', 'Average', 'Athletic', 'Heavy']),
      pick(['Business', 'Government Employee', 'Retired', 'Farmer', 'Professional']),
      pick(['Homemaker', 'Teacher', 'Housewife', 'Professional']),
      randomInt(0, 4), pick(['Nuclear', 'Joint']), pick(['Middle Class', 'Upper Middle Class', 'Rich']),
      randomInt(22, 28), randomInt(30, 40), null, null, rel.religion, 'Any', 'India',
      pick(HOROSCOPES), pick(['No', 'No', 'Yes', 'Partial']), 0, 0, 95, now, now,
      null, gotra, 'Not Required', null, null, null,
    ],
    photoRow: [photoId, userId, image, 1, now],
    email,
    name,
    gender,
  };
}

function printHelp() {
  console.log(`
Bulk Dummy User Seeder — Vivah Milan

Usage:
  node scripts/bulk-seed-users.mjs --count 5000
  node scripts/bulk-seed-users.mjs --count 10000 --batch 200
  node scripts/bulk-seed-users.mjs --count 1000 --prefix mybatch --premium-ratio 0.2

Options:
  --count          Number of users to create (default: 100)
  --batch          Insert batch size (default: 100, max recommended: 500)
  --prefix         Email prefix for uniqueness (default: dummy{timestamp})
  --premium-ratio  Fraction of premium users 0-1 (default: 0.15)

Password for ALL users: ${PASSWORD_PLAIN}

Requires .env.production with DATABASE_* variables.
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { printHelp(); process.exit(0); }

  const { count, batch, prefix, premiumRatio } = args;

  const host = process.env.DATABASE_HOST;
  const user = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  const database = process.env.DATABASE_NAME;
  const port = parseInt(process.env.DATABASE_PORT || '3306', 10);

  if (!host || !user || !database) {
    console.error('❌ DATABASE_* env vars missing. Check .env.production');
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════');
  console.log('  Vivah Milan — Bulk Dummy User Seeder');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Target count : ${count}`);
  console.log(`  Batch size   : ${batch}`);
  console.log(`  Email prefix : ${prefix}`);
  console.log(`  Password     : ${PASSWORD_PLAIN}`);
  console.log(`  Database     : ${host}/${database}`);
  console.log('═══════════════════════════════════════════════\n');

  const conn = await mysql.createConnection({ host, user, password, database, port, multipleStatements: false });
  const passwordHash = await bcrypt.hash(PASSWORD_PLAIN, 10);
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const runId = makeRunId(prefix);

  console.log(`  Run ID       : ${runId} (unique phone/email bucket)\n`);

  const userSql = `INSERT INTO \`user\`
    (id, name, email, emailVerified, image, password, phone, phoneVerified, role, isActive, isVerified,
     verificationBadge, isPremium, premiumExpiry, profileBoost, boostExpiry, createdAt, updatedAt,
     adminVerified, lastLoginAt, loginOtpEnabled, premiumPlan)
    VALUES ?`;

  const profileSql = `INSERT INTO profile
    (id, userId, gender, dob, height, weight, religion, caste, motherTongue, education, profession, income,
     country, state, city, aboutMe, maritalStatus, smoking, drinking, diet, complexion, bodyType,
     fatherOccupation, motherOccupation, siblings, familyType, familyStatus, partnerAgeMin, partnerAgeMax,
     partnerHeightMin, partnerHeightMax, partnerReligion, partnerEducation, partnerLocation, horoscopeSign,
     manglik, hidePhone, hidePhoto, profileComplete, createdAt, updatedAt, amritdhari, gotra, kundliMatch,
     nakshatra, sect, subCaste)
    VALUES ?`;

  const photoSql = 'INSERT INTO photo (id, userId, url, isMain, createdAt) VALUES ?';

  let inserted = 0;
  let sampleEmails = [];
  const startTime = Date.now();

  while (inserted < count) {
    const batchSize = Math.min(batch, count - inserted);
    const userRows = [];
    const profileRows = [];
    const photoRows = [];

    for (let i = 0; i < batchSize; i++) {
      const u = buildUser(inserted + i, prefix, passwordHash, now, premiumRatio, runId);
      userRows.push(u.userRow);
      profileRows.push(u.profileRow);
      photoRows.push(u.photoRow);
      if (sampleEmails.length < 5) sampleEmails.push({ email: u.email, name: u.name, gender: u.gender });
    }

    await conn.beginTransaction();
    try {
      await conn.query(userSql, [userRows]);
      await conn.query(profileSql, [profileRows]);
      await conn.query(photoSql, [photoRows]);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      console.error(`\n❌ Batch failed at ${inserted + 1}-${inserted + batchSize}:`, err.message);
      if (err.code === 'ER_DUP_ENTRY') {
        console.error('   Tip: Use a different --prefix and run again.');
      }
      await conn.end();
      process.exit(1);
    }

    inserted += batchSize;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = (inserted / (elapsed || 1)).toFixed(0);
    const pct = ((inserted / count) * 100).toFixed(1);
    process.stdout.write(`\r  ✅ Inserted ${inserted}/${count} (${pct}%) — ${elapsed}s — ~${rate}/sec   `);
  }

  await conn.end();

  console.log('\n\n🎉 Done! All dummy users created.\n');
  console.log('Sample logins (password for all):', PASSWORD_PLAIN);
  sampleEmails.forEach(s => console.log(`  • ${s.email}  (${s.name}, ${s.gender})`));
  console.log(`\nTotal inserted: ${inserted}`);
  console.log(`Email pattern : ${prefix}.{male|female}.{index}.${runId}@dummyvivah.test`);
  console.log('All users: emailVerified ✓  adminVerified ✓  profileComplete ~95 ✓  photo ✓\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
