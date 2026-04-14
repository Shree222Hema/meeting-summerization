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

  try {
    const url = new URL(connectionString);
    console.log(`🚀 DATABASE: Attempting connection to Neon [${url.hostname}]...`);
    
    const pool = new Pool({ connectionString });
    const adapter = new PrismaNeon(pool);
    
    return new PrismaClient({ adapter });
  } catch (err) {
    console.error("🚨 PRISMA SETUP ERROR (Postgres):", err.message);
    console.log("Fallback: Initializing standard PrismaClient...");
    return new PrismaClient();
  }
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
