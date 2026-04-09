import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

const globalForPrisma = globalThis;

function createPrismaClient() {
  // Parse from DATABASE_URL directly to avoid env var spacing issues
  // Format: mysql://user:password@host:port/database
  const url = process.env.DATABASE_URL || '';

  let host = 'localhost';
  let user = 'root';
  let password = '';
  let database = 'matrimonial';
  let port = 3306;

  try {
    // Strip surrounding quotes if any
    const cleanUrl = url.replace(/^["']|["']$/g, '');
    const parsed = new URL(cleanUrl);
    host = parsed.hostname;
    user = decodeURIComponent(parsed.username);
    password = decodeURIComponent(parsed.password);
    database = parsed.pathname.replace(/^\//, '');
    port = parseInt(parsed.port || '3306');
  } catch (e) {
    console.error('Failed to parse DATABASE_URL, using env vars fallback:', e.message);
    host = (process.env.DATABASE_HOST || 'localhost').trim();
    user = (process.env.DATABASE_USER || 'root').trim();
    password = (process.env.DATABASE_PASSWORD || '').trim().replace(/^["']|["']$/g, '');
    database = (process.env.DATABASE_NAME || 'matrimonial').trim();
    port = parseInt((process.env.DATABASE_PORT || '3306').trim());
  }

  const adapter = new PrismaMariaDb({
    host,
    user,
    password,
    database,
    port,
    connectionLimit: 5,
    connectTimeout: 30000,
    waitForConnections: true,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
