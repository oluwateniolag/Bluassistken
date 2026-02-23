require('dotenv').config();
const { sequelize } = require('../config/database');
const { User, Tenant, RefreshToken } = require('../models');

const seedSuperAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync database models (create tables if they don't exist)
    console.log('Syncing database models...');
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({
      where: { role: 'super_admin' }
    });

    if (existingSuperAdmin) {
      console.log('Super admin user already exists.');
      process.exit(0);
    }

    // Create super admin user
    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'admin@bluassist.com').toLowerCase().trim();
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!@#';
    
    const superAdmin = await User.create({
      email: superAdminEmail,
      password: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
      status: 'active',
      emailVerified: true,
      tenantId: null // Super admin doesn't belong to any tenant
    });

    console.log('Super admin user created successfully!');
    console.log('Email:', superAdminEmail);
    console.log('Password:', superAdminPassword);
    console.log('\n⚠️  Please change the default password after first login!');
    console.log('\nLogin credentials:');
    console.log('  Email:', superAdminEmail);
    console.log('  Password:', superAdminPassword);
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding super admin:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    await sequelize.close().catch(() => {});
    process.exit(1);
  }
};

seedSuperAdmin();
