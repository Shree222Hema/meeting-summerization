const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');

dotenv.config();

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const result = await sql`SELECT 1 as connected`;
    console.log("Neon Connected:", result);
    
    const users = await sql`SELECT id, name, email FROM "User"`;
    console.log("Users:", users);
  } catch (err) {
    console.error("Neon Error:", err);
  }
}

main();
