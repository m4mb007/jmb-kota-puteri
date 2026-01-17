import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

dotenv.config()

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function testLogin() {
  const email = 'admin@strata.com';
  const password = 'admin123';

  console.log(`Testing login for ${email}...`);

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.error('User not found!');
      process.exit(1);
    }

    console.log('User found:', user.name);
    // console.log('Stored hash:', user.password); // Don't log hash in production, but ok for debug

    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (passwordsMatch) {
      console.log('SUCCESS: Password matches!');
    } else {
      console.error('FAILURE: Password does NOT match.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during login test:', error);
    process.exit(1);
  }
}

testLogin()
  .finally(async () => {
    await prisma.$disconnect();
  });
