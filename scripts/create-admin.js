// Simple script to create admin user
// Run this in Render Shell: node scripts/create-admin.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('Creating admin user...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: '0123456789' }
    });
    
    if (existingUser) {
      console.log('Admin user already exists! Updating password...');
      await prisma.user.update({
        where: { phone: '0123456789' },
        data: {
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          isActive: true,
        }
      });
      console.log('✅ Admin password updated successfully!');
    } else {
      console.log('Creating new admin user...');
      await prisma.user.create({
        data: {
          email: 'admin@jmbkotaputeri.com',
          name: 'Super Admin',
          phone: '0123456789',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          isActive: true,
        }
      });
      console.log('✅ Admin user created successfully!');
    }
    
    console.log('\n📱 Login credentials:');
    console.log('   Phone: 0123456789');
    console.log('   Password: admin123');
    console.log('\n⚠️  Please change the password after first login!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

