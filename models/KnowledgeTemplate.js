const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const KnowledgeTemplate = sequelize.define('KnowledgeTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Template name is required' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Template structure/schema stored as JSONB
  schema: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  // Default content/template values
  defaultContent: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  // Is this a system template (available to all tenants) or custom
  isSystem: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // If custom, which tenant owns it
  tenantId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'tenants',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  // Template status
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    validate: {
      isIn: {
        args: [['active', 'inactive']],
        msg: 'Invalid status'
      }
    }
  }
}, {
  tableName: 'knowledge_templates',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['is_system'] },
    { fields: ['status'] }
  ]
});

module.exports = KnowledgeTemplate;
