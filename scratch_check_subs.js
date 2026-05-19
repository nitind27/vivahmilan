const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.subscription.findMany({ include: { user: true } })
  .then(s => console.log(JSON.stringify(s, null, 2)))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
