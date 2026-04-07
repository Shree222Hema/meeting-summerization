import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

const globalForPrisma = globalThis;

/**
 * Lazy Initializer for Prisma Client.
 * This prevents the database connection from being attempted during the Next.js Build Phase,
 * which is what causes the "Failed to collect page data" errors.
 */
function createPrismaClient() {
  // Guard for server-side only
  if (typeof window !== 'undefined') return new PrismaClient();

  // Configure Neon Serverless
  neonConfig.webSocketConstructor = ws;
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("DATABASE_URL is missing. Prisma might fail at runtime.");
    return new PrismaClient();
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);

  return new PrismaClient({ adapter });
}

// Export a Proxy that initializes Prisma only when first accessed.
// This allows us to keep the `import { prisma } from ...` syntax throughout the app.
export const prisma = new Proxy({}, {
  get(target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return globalForPrisma.prisma[prop];
  }
});
