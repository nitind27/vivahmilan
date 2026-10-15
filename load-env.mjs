import { config } from 'dotenv';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = dirname(fileURLToPath(import.meta.url));
const prod = join(root, '.env.production');
const local = join(root, '.env');

if (existsSync(prod)) config({ path: prod });
if (existsSync(local)) config({ path: local, override: false });

export {};
