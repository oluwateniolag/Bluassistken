require('dotenv').config();
const { sequelize } = require('../config/database');
const { User } = require('../models');
const bcrypt = require('bcryptjs');

const checkSuperAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.\n');

    // Find super admin
    const superAdmin = await User.findOne({
      where: { role: 'super_admin' }
    });

    if (!superAdmin) {
      console.log('❌ Super admin user not found!');
      console.log('Run: npm run seed:superadmin');
      await sequelize.close();
      process.exit(1);
    }

    console.log('✅ Super admin found:');
    console.log('  ID:', superAdmin.id);
    console.log('  Email:', superAdmin.email);
    console.log('  Role:', superAdmin.role);
    console.log('  Status:', superAdmin.status);
    console.log('  Tenant ID:', superAdmin.tenantId || 'null (super admin)');
    console.log('  Password hash:', superAdmin.password.substring(0, 20) + '...');
    console.log('  Created:', superAdmin.createdAt);
    console.log('');

    // Test password
    const testPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!@#';
    console.log('Testing password:', testPassword);
    
    const isMatch = await superAdmin.comparePassword(testPassword);
    
    if (isMatch) {
      console.log('✅ Password matches!');
    } else {
      console.log('❌ Password does NOT match!');
      console.log('\nTrying to verify with bcrypt directly...');
      
      // Try direct bcrypt comparison
      const directMatch = await bcrypt.compare(testPassword, superAdmin.password);
      console.log('Direct bcrypt comparison:', directMatch ? '✅ Match' : '❌ No match');
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error checking super admin:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    await sequelize.close().catch(() => {});
    process.exit(1);
  }
};

checkSuperAdmin();
