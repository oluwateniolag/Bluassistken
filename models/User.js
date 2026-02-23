const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Please provide a valid email' },
      notEmpty: { msg: 'Email is required' }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Password is required' },
      len: {
        args: [8, Infinity],
        msg: 'Password must be at least 8 characters'
      }
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'First name is required' }
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Last name is required' }
    }
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'tenant_admin', 'tenant_user'),
    defaultValue: 'tenant_admin',
    validate: {
      isIn: {
        args: [['super_admin', 'tenant_admin', 'tenant_user']],
        msg: 'Invalid role'
      }
    }
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: true,
    unique: true, // One user per tenant
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active',
    validate: {
      isIn: {
        args: [['active', 'inactive', 'suspended']],
        msg: 'Invalid status'
      }
    }
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['tenant_id'], unique: true },
    { fields: ['role'] }
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
      // Validate tenantId for non-super-admin users
      if (user.role !== 'super_admin' && !user.tenantId) {
        throw new Error('Tenant is required for non-super-admin users');
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
      // Validate tenantId for non-super-admin users
      if (user.changed('role') && user.role !== 'super_admin' && !user.tenantId) {
        throw new Error('Tenant is required for non-super-admin users');
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.isActive = function() {
  return this.status === 'active';
};

// Define associations
User.associate = (models) => {
  User.belongsTo(models.Tenant, {
    foreignKey: 'tenantId',
    as: 'tenant'
  });
};

module.exports = User;
