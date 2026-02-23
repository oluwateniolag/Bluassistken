const { Tenant } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { ensureSubscriptionState } = require('../utils/subscription');

/**
 * @desc    Get tenant API keys (and knowledge base ID when subscription is active)
 * @route   GET /api/tenants/api-keys
 * @access  Private
 */
exports.getApiKeys = async (req, res) => {
  try {
    const tenantId = req.user.tenant?.id || req.user.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'No tenant associated with user'
      });
    }

    const tenant = await Tenant.findByPk(tenantId, {
      attributes: ['id', 'name', 'apiKey', 'apiSecret', 'createdAt', 'knowledgeBaseId', 'subscriptionEndDate']
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    await ensureSubscriptionState(tenant);

    const payload = {
      apiKey: tenant.apiKey,
      apiSecret: tenant.apiSecret,
      createdAt: tenant.createdAt
    };
    // Only expose knowledge base ID when subscription is active and KB exists
    if (tenant.isSubscriptionActive() && tenant.knowledgeBaseId) {
      payload.knowledgeBaseId = tenant.knowledgeBaseId;
    }

    res.json({
      success: true,
      data: payload
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching API keys',
      error: error.message
    });
  }
};

/**
 * @desc    Regenerate API key
 * @route   POST /api/tenants/api-keys/regenerate-key
 * @access  Private
 */
exports.regenerateApiKey = async (req, res) => {
  try {
    const tenantId = req.user.tenant?.id || req.user.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'No tenant associated with user'
      });
    }

    const tenant = await Tenant.findByPk(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Generate new API key
    const newApiKey = uuidv4();

    await tenant.update({
      apiKey: newApiKey
    });
    await tenant.reload({ attributes: ['apiKey', 'apiSecret', 'knowledgeBaseId', 'subscriptionEndDate'] });
    await ensureSubscriptionState(tenant);

    const payload = { apiKey: tenant.apiKey, apiSecret: tenant.apiSecret };
    if (tenant.isSubscriptionActive() && tenant.knowledgeBaseId) payload.knowledgeBaseId = tenant.knowledgeBaseId;

    res.json({
      success: true,
      message: 'API key regenerated successfully',
      data: payload
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error regenerating API key',
      error: error.message
    });
  }
};

/**
 * @desc    Regenerate API secret
 * @route   POST /api/tenants/api-keys/regenerate-secret
 * @access  Private
 */
exports.regenerateApiSecret = async (req, res) => {
  try {
    const tenantId = req.user.tenant?.id || req.user.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'No tenant associated with user'
      });
    }

    const tenant = await Tenant.findByPk(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Generate new API secret
    const newApiSecret = uuidv4();

    await tenant.update({
      apiSecret: newApiSecret
    });
    await tenant.reload({ attributes: ['apiKey', 'apiSecret', 'knowledgeBaseId', 'subscriptionEndDate'] });
    await ensureSubscriptionState(tenant);

    const payload = { apiKey: tenant.apiKey, apiSecret: tenant.apiSecret };
    if (tenant.isSubscriptionActive() && tenant.knowledgeBaseId) payload.knowledgeBaseId = tenant.knowledgeBaseId;

    res.json({
      success: true,
      message: 'API secret regenerated successfully',
      data: payload
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error regenerating API secret',
      error: error.message
    });
  }
};

/**
 * @desc    Regenerate both API key and secret
 * @route   POST /api/tenants/api-keys/regenerate-both
 * @access  Private
 */
exports.regenerateBoth = async (req, res) => {
  try {
    const tenantId = req.user.tenant?.id || req.user.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'No tenant associated with user'
      });
    }

    const tenant = await Tenant.findByPk(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Generate new credentials
    const newApiKey = uuidv4();
    const newApiSecret = uuidv4();

    await tenant.update({
      apiKey: newApiKey,
      apiSecret: newApiSecret
    });
    await tenant.reload({ attributes: ['apiKey', 'apiSecret', 'knowledgeBaseId', 'subscriptionEndDate'] });
    await ensureSubscriptionState(tenant);

    const payload = { apiKey: tenant.apiKey, apiSecret: tenant.apiSecret };
    if (tenant.isSubscriptionActive() && tenant.knowledgeBaseId) payload.knowledgeBaseId = tenant.knowledgeBaseId;

    res.json({
      success: true,
      message: 'API credentials regenerated successfully',
      data: payload
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error regenerating API credentials',
      error: error.message
    });
  }
};
