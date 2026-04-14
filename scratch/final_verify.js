const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = "final_check@test.com";
  const password = "password123";
  const name = "Final Check User";

  const hashed = await bcrypt.hash(password, 12);
  
  try {
    const user = await prisma.user.create({
      data: { name, email, password: hashed }
    });
    console.log("✅ Created user:", user.email);
    
    const isValid = await bcrypt.compare(password, user.password);
    console.log("🔐 Password valid after creation:", isValid);
  } catch (e) {
    console.error("❌ Creation failed:", e.message);
  }
}

main().finally(() => prisma.$disconnect());
