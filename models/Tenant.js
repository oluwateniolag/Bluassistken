const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Tenant name is required' },
      len: {
        args: [2, 100],
        msg: 'Tenant name must be between 2 and 100 characters'
      }
    }
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
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
  type: {
    type: DataTypes.ENUM('fintech', 'personal'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['fintech', 'personal']],
        msg: 'Tenant type must be either fintech or personal'
      }
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'suspended', 'inactive'),
    defaultValue: 'pending',
    validate: {
      isIn: {
        args: [['pending', 'active', 'suspended', 'inactive']],
        msg: 'Invalid status'
      }
    }
  },
  apiKey: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    unique: true
  },
  apiSecret: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4
  },
  onboardingCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  onboardingStep: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 4
    }
  },
  companyName: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: { msg: 'Please provide a valid website URL' }
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Chatbot configuration stored as JSONB
  chatbotConfig: {
    type: DataTypes.JSONB,
    defaultValue: {
      name: 'BluAssist',
      welcomeMessage: 'Hello! How can I help you today?',
      theme: {
        primaryColor: '#007bff',
        secondaryColor: '#6c757d'
      },
      enabled: false
    }
  },
  plan: {
    type: DataTypes.ENUM('free', 'basic', 'premium', 'enterprise'),
    defaultValue: 'free',
    validate: {
      isIn: {
        args: [['free', 'basic', 'premium', 'enterprise']],
        msg: 'Invalid plan'
      }
    }
  },
  subscriptionStartDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  subscriptionEndDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Knowledge base identifier; set when subscription is active and KB exists; cleared when subscription expires
  knowledgeBaseId: {
    type: DataTypes.UUID,
    allowNull: true,
    unique: true
  },
  // Metadata stored as JSONB
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'tenants',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['email'], unique: true },
    { fields: ['api_key'], unique: true },
    { fields: ['status'] }
  ]
});

// Instance methods
Tenant.prototype.generateApiCredentials = function() {
  this.apiKey = uuidv4();
  this.apiSecret = uuidv4();
  return this;
};

Tenant.prototype.isActive = function() {
  return this.status === 'active';
};

Tenant.prototype.isOnboardingComplete = function() {
  return this.onboardingCompleted === true;
};

/**
 * Subscription is active if there is no end date (e.g. free forever) or end date is in the future.
 */
Tenant.prototype.isSubscriptionActive = function() {
  if (!this.subscriptionEndDate) return true;
  return new Date(this.subscriptionEndDate) >= new Date();
};

module.exports = Tenant;
