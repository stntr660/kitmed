const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Creating admin user...');
    
    // Hash the password
    const passwordHash = await bcrypt.hash('admin123', 12);
    
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@kitmed.ma',
        passwordHash: passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('Email:', adminUser.email);
    console.log('Password: admin123');
    console.log('');
    console.log('You can now login at: http://localhost:3001/fr/admin/login');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser };