import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

const globalForPrisma = globalThis;

function createPrismaClient() {
  const host     = process.env.DATABASE_HOST     || 'localhost';
  const user     = process.env.DATABASE_USER     || 'root';
  const rawPass  = process.env.DATABASE_PASSWORD ?? '';
  const password = rawPass.replace(/^["']|["']$/g, '');
  const database = process.env.DATABASE_NAME     || 'matrimonial';
  const port     = parseInt(process.env.DATABASE_PORT || '3306');

  // Vercel serverless: use single connection, no pool
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

  const adapter = new PrismaMariaDb({
    host,
    user,
    password,
    database,
    port,
    // Serverless: minimal pool, short timeouts
    connectionLimit: isServerless ? 1 : 5,
    connectTimeout: 30000,
    acquireTimeout: 30000,
    waitForConnections: true,
    queueLimit: 0,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

// In serverless (Vercel), create new client per request to avoid pool issues
const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
