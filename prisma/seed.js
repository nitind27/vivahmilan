// CommonJS seed using mysql2 directly (no Prisma client needed)
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const users = [
  {
    name: 'Priya Sharma',
    email: 'priya@demo.com',
    gender: 'FEMALE',
    dob: '1997-04-15',
    height: 162, weight: 55,
    religion: 'Hindu', caste: 'Brahmin', motherTongue: 'Hindi',
    education: "Master's", profession: 'Software Engineer', income: '$60,000 - $80,000',
    country: 'India', state: 'Maharashtra', city: 'Mumbai',
    aboutMe: 'Fun-loving, career-oriented woman who enjoys traveling, cooking, and reading. Looking for a kind and ambitious life partner.',
    maritalStatus: 'NEVER_MARRIED', smoking: 'NO', drinking: 'NO', diet: 'Vegetarian',
    familyType: 'Nuclear', familyStatus: 'Middle Class',
    fatherOccupation: 'Business', motherOccupation: 'Homemaker', siblings: 1,
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
    isPremium: true,
  },
  {
    name: 'Arjun Mehta',
    email: 'arjun@demo.com',
    gender: 'MALE',
    dob: '1994-08-22',
    height: 178, weight: 75,
    religion: 'Hindu', caste: 'Kshatriya', motherTongue: 'Gujarati',
    education: "Bachelor's", profession: 'Doctor', income: '$80,000 - $100,000',
    country: 'India', state: 'Gujarat', city: 'Ahmedabad',
    aboutMe: 'MBBS doctor with a passion for music and fitness. I believe in building a strong family foundation with love and respect.',
    maritalStatus: 'NEVER_MARRIED', smoking: 'NO', drinking: 'OCCASIONALLY', diet: 'Non-Vegetarian',
    familyType: 'Joint', familyStatus: 'Upper Middle Class',
    fatherOccupation: 'Doctor', motherOccupation: 'Teacher', siblings: 2,
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    isPremium: false,
  },
  {
    name: 'Sarah Khan',
    email: 'sarah@demo.com',
    gender: 'FEMALE',
    dob: '1999-01-10',
    height: 158, weight: 52,
    religion: 'Muslim', caste: 'Syed', motherTongue: 'Urdu',
    education: "Bachelor's", profession: 'Teacher', income: '$30,000 - $50,000',
    country: 'USA', state: 'New York', city: 'New York City',
    aboutMe: 'A passionate educator who loves art, poetry, and exploring new cultures. Looking for a caring and understanding partner.',
    maritalStatus: 'NEVER_MARRIED', smoking: 'NO', drinking: 'NO', diet: 'Halal',
    familyType: 'Nuclear', familyStatus: 'Middle Class',
    fatherOccupation: 'Engineer', motherOccupation: 'Nurse', siblings: 0,
    image: 'https://randomuser.me/api/portraits/women/68.jpg',
    isPremium: true,
  },
  {
    name: 'Rahul Verma',
    email: 'rahul@demo.com',
    gender: 'MALE',
    dob: '1992-11-05',
    height: 175, weight: 72,
    religion: 'Hindu', caste: 'Vaishya', motherTongue: 'Hindi',
    education: "Master's", profession: 'Business Analyst', income: '$50,000 - $70,000',
    country: 'UK', state: 'England', city: 'London',
    aboutMe: 'NRI professional settled in London. I enjoy cricket, hiking, and trying new cuisines. Family-oriented and looking for a life partner.',
    maritalStatus: 'NEVER_MARRIED', smoking: 'NO', drinking: 'OCCASIONALLY', diet: 'Vegetarian',
    familyType: 'Nuclear', familyStatus: 'Upper Middle Class',
    fatherOccupation: 'Retired', motherOccupation: 'Homemaker', siblings: 1,
    image: 'https://randomuser.me/api/portraits/men/55.jpg',
    isPremium: false,
  },
  {
    name: 'Anjali Singh',
    email: 'anjali@demo.com',
    gender: 'FEMALE',
    dob: '1996-06-30',
    height: 165, weight: 58,
    religion: 'Sikh', caste: 'Jat', motherTongue: 'Punjabi',
    education: 'CA', profession: 'Chartered Accountant', income: '$70,000 - $90,000',
    country: 'Canada', state: 'Ontario', city: 'Toronto',
    aboutMe: 'CA by profession, foodie by heart. I love Bollywood, traveling, and spending time with family. Looking for someone who values both career and family.',
    maritalStatus: 'NEVER_MARRIED', smoking: 'NO', drinking: 'NO', diet: 'Vegetarian',
    familyType: 'Joint', familyStatus: 'Rich',
    fatherOccupation: 'Business', motherOccupation: 'Doctor', siblings: 2,
    image: 'https://randomuser.me/api/portraits/women/65.jpg',
    isPremium: true,
  },
];

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'matrimonial',
  });

  console.log('🌱 Seeding database...\n');

  const password = await bcrypt.hash('demo1234', 12);
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  for (const u of users) {
    // Check if user exists
    const [existing] = await conn.execute('SELECT id FROM User WHERE email = ?', [u.email]);
    if (existing.length > 0) {
      console.log(`⏭  Skipping ${u.name} (already exists)`);
      continue;
    }

    const userId = randomUUID();
    const profileId = randomUUID();
    const photoId = randomUUID();

    // Insert User
    await conn.execute(
      `INSERT INTO User (id, name, email, password, image, role, isActive, isVerified, verificationBadge, isPremium, profileBoost, phoneVerified, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 'USER', 1, 1, 1, ?, 0, 0, ?, ?)`,
      [userId, u.name, u.email, password, u.image, u.isPremium ? 1 : 0, now, now]
    );

    // Insert Profile
    await conn.execute(
      `INSERT INTO Profile (id, userId, gender, dob, height, weight, religion, caste, motherTongue, education, profession, income, country, state, city, aboutMe, maritalStatus, smoking, drinking, diet, familyType, familyStatus, fatherOccupation, motherOccupation, siblings, profileComplete, hidePhone, hidePhoto, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 90, 0, 0, ?, ?)`,
      [profileId, userId, u.gender, u.dob, u.height, u.weight, u.religion, u.caste, u.motherTongue, u.education, u.profession, u.income, u.country, u.state, u.city, u.aboutMe, u.maritalStatus, u.smoking, u.drinking, u.diet, u.familyType, u.familyStatus, u.fatherOccupation, u.motherOccupation, u.siblings, now, now]
    );

    // Insert main Photo
    await conn.execute(
      `INSERT INTO Photo (id, userId, url, isMain, createdAt) VALUES (?, ?, ?, 1, ?)`,
      [photoId, userId, u.image, now]
    );

    console.log(`✅ Created: ${u.name} (${u.gender}) — ${u.city}, ${u.country}`);
  }

  await conn.end();
  console.log('\n🎉 Done! Login credentials:');
  console.log('   Email: priya@demo.com  | arjun@demo.com | sarah@demo.com | rahul@demo.com | anjali@demo.com');
  console.log('   Password: demo1234');
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
