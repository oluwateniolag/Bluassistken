const { sequelize } = require('../config/database');
const Tenant = require('./Tenant');
const User = require('./User');
const RefreshToken = require('./RefreshToken');
const KnowledgePage = require('./KnowledgePage');
const KnowledgeTemplate = require('./KnowledgeTemplate');

// Define associations - One-to-One relationship
User.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  as: 'tenant',
  constraints: false // Allow null for super_admin
});

Tenant.hasOne(User, {
  foreignKey: 'tenantId',
  as: 'user'
});

// RefreshToken associations
RefreshToken.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(RefreshToken, {
  foreignKey: 'userId',
  as: 'refreshTokens'
});

// KnowledgePage associations
KnowledgePage.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  as: 'tenant'
});

Tenant.hasMany(KnowledgePage, {
  foreignKey: 'tenantId',
  as: 'knowledgePages'
});

KnowledgePage.belongsTo(User, {
  foreignKey: 'publishedBy',
  as: 'publisher'
});

// KnowledgeTemplate associations
KnowledgeTemplate.belongsTo(Tenant, {
  foreignKey: 'tenantId',
  as: 'tenant',
  constraints: false
});

Tenant.hasMany(KnowledgeTemplate, {
  foreignKey: 'tenantId',
  as: 'knowledgeTemplates'
});

const models = {
  Tenant,
  User,
  RefreshToken,
  KnowledgePage,
  KnowledgeTemplate,
  sequelize
};

module.exports = models;
