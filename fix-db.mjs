import dotenv from 'dotenv';
dotenv.config();

const { execute } = await import('./lib/db.js');

async function run() {
  try {
    await execute('ALTER TABLE `user` ADD COLUMN needsPassword TINYINT(1) DEFAULT 0');
    console.log('Column added successfully');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists');
    } else {
      console.error(err.message);
    }
  }
  process.exit(0);
}
run();
