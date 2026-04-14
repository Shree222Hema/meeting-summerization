const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  // List all users
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, password: true }
  });
  console.log("\n📋 All users in DB:");
  users.forEach(u => {
    console.log(`  - ID: ${u.id}, Email: ${u.email}, Name: ${u.name}, Password hash: ${u.password.substring(0, 20)}...`);
  });

  if (users.length === 0) {
    console.log("  No users found.");
    return;
  }

  // Test password comparison for the first user
  const testEmail = users[users.length - 1].email;
  const testPassword = "password123"; // try common passwords
  const user = users.find(u => u.email === testEmail);

  console.log(`\n🔐 Testing password comparison for: ${testEmail}`);
  const isValid = await bcrypt.compare(testPassword, user.password);
  console.log(`  bcrypt.compare('${testPassword}', hash) = ${isValid}`);
}

main()
  .catch(e => console.error("ERROR:", e))
  .finally(() => prisma.$disconnect());
