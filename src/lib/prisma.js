import { PrismaClient } from '@prisma/client';

function withPoolSettings(url) {
  if (!url) return url;
  const extras = [];
  if (!/[?&]connection_limit=/.test(url)) extras.push('connection_limit=5');
  if (!/[?&]pool_timeout=/.test(url)) extras.push('pool_timeout=30');
  if (!extras.length) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${extras.join('&')}`;
}

const prismaConfig = {
  log: process.env.NODE_ENV === 'development'
    ? ['warn', 'error']
    : ['warn', 'error'],
  datasources: {
    db: {
      url: withPoolSettings(process.env.DATABASE_URL),
    },
  },
};

const globalForPrisma = typeof globalThis !== 'undefined' ? globalThis : global;

const prisma = globalForPrisma.__prisma || new PrismaClient(prismaConfig);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}

export async function withPrismaRetry(operation, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const poolTimeout =
        error?.code === 'P2024' || /connection pool/i.test(error?.message || '');
      if (!poolTimeout || attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }
  throw lastError;
}

if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export default prisma;
