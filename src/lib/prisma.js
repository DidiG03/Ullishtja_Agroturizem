import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma client to avoid multiple instances
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query'], // Log queries in development
    });
  }
  prisma = global.__prisma;
}

export default prisma; 