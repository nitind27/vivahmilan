import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

const globalForPrisma = globalThis;

function createPrismaClient() {
  const host     = process.env.DATABASE_HOST     || 'localhost';
  const user     = process.env.DATABASE_USER     || 'root';
  const password = process.env.DATABASE_PASSWORD || '';
  const database = process.env.DATABASE_NAME     || 'matrimonial';
  const port     = parseInt(process.env.DATABASE_PORT || '3306');

  const adapter = new PrismaMariaDb({ host, user, password, database, port, connectionLimit: 5 });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
