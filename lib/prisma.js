import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

const globalForPrisma = globalThis;

function getDbConfig() {
  const url = (process.env.DATABASE_URL || '').replace(/^["']|["']$/g, '');
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ''),
      port: parseInt(parsed.port || '3306'),
    };
  } catch {
    return {
      host: (process.env.DATABASE_HOST || 'localhost').trim(),
      user: (process.env.DATABASE_USER || 'root').trim(),
      password: (process.env.DATABASE_PASSWORD || '').trim().replace(/^["']|["']$/g, ''),
      database: (process.env.DATABASE_NAME || 'matrimonial').trim(),
      port: parseInt((process.env.DATABASE_PORT || '3306').trim()),
    };
  }
}

function createPrismaClient() {
  const config = getDbConfig();

  const adapter = new PrismaMariaDb({
    ...config,
    connectionLimit: 3,        // keep low for shared hosting
    minimumIdle: 0,             // release all idle connections immediately
    idleTimeoutMillis: 5000,    // close idle after 5s
    acquireTimeout: 30000,
    connectTimeout: 30000,
  });

  return new PrismaClient({
    adapter,
    log: ['error'],
  });
}

// Reuse single instance — prevents connection explosion on hot reload
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createPrismaClient();
}

const prisma = globalForPrisma.prisma;
export default prisma;
