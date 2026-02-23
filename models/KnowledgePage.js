const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const KnowledgePage = sequelize.define('KnowledgePage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Title is required' },
      len: {
        args: [1, 200],
        msg: 'Title must be between 1 and 200 characters'
      }
    }
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      notEmpty: false
    }
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  // Template-based content stored as JSONB
  content: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  // Status: draft, published, archived
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft',
    validate: {
      isIn: {
        args: [['draft', 'published', 'archived']],
        msg: 'Invalid status'
      }
    }
  },
  // Version tracking
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  // SEO metadata
  metaDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metaKeywords: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  // Usage tracking
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastViewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Publishing
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  publishedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'knowledge_pages',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['slug'] },
    { fields: ['status'] },
    { fields: ['category'] },
    { 
      fields: ['tenant_id'],
      unique: true,
      name: 'unique_tenant_knowledge_page'
    }
  ]
});

module.exports = KnowledgePage;
