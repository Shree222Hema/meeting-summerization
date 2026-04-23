import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

// Neon Serverless Configuration (only applied if using Neon)
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error("❌ DATABASE_URL is missing in .env");
    return new PrismaClient();
  }

  // SQLite Detection
  if (connectionString.startsWith('file:') || connectionString.includes('.db')) {
    console.log("🚀 DATABASE: Initializing local SQLite engine...");
    return new PrismaClient();
  }

  // Neon Detection
  if (connectionString.includes('neon.tech')) {
    try {
      console.log(`🚀 DATABASE: Initializing Neon Serverless adapter...`);
      const pool = new Pool({ connectionString });
      const adapter = new PrismaNeon(pool);
      return new PrismaClient({ adapter });
    } catch (err) {
      console.error("🚨 NEON ADAPTER ERROR:", err.message);
      return new PrismaClient();
    }
  }

  // Default Postgres (Railway, Supabase, etc.)
  console.log("🚀 DATABASE: Initializing standard PostgreSQL engine...");
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
