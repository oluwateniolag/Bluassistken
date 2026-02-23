const { Tenant } = require('../models');

/**
 * @desc    Get chatbot configuration
 * @route   GET /api/chatbot/config
 * @access  Private
 */
exports.getChatbotConfig = async (req, res) => {
  try {
    const tenantId = req.user.tenant?.id || req.user.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'No tenant associated with user'
      });
    }

    const tenant = await Tenant.findByPk(tenantId, {
      attributes: ['id', 'chatbotConfig']
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: {
        chatbotConfig: tenant.chatbotConfig || {
          name: 'BluAssist',
          welcomeMessage: 'Hello! How can I help you today?',
          theme: {
            primaryColor: '#007bff',
            secondaryColor: '#6c757d'
          },
          enabled: false
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chatbot configuration',
      error: error.message
    });
  }
};

/**
 * @desc    Update chatbot configuration
 * @route   PUT /api/chatbot/config
 * @access  Private
 */
exports.updateChatbotConfig = async (req, res) => {
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

    const {
      name,
      welcomeMessage,
      primaryColor,
      secondaryColor,
      enabled
    } = req.body;

    // Get current config or default
    const currentConfig = tenant.chatbotConfig || {
      name: 'BluAssist',
      welcomeMessage: 'Hello! How can I help you today?',
      theme: {
        primaryColor: '#007bff',
        secondaryColor: '#6c757d'
      },
      enabled: false
    };

    // Update config with new values
    const updatedConfig = {
      name: name !== undefined ? name : currentConfig.name,
      welcomeMessage: welcomeMessage !== undefined ? welcomeMessage : currentConfig.welcomeMessage,
      theme: {
        primaryColor: primaryColor !== undefined ? primaryColor : (currentConfig.theme?.primaryColor || '#007bff'),
        secondaryColor: secondaryColor !== undefined ? secondaryColor : (currentConfig.theme?.secondaryColor || '#6c757d')
      },
      enabled: enabled !== undefined ? enabled : (currentConfig.enabled !== undefined ? currentConfig.enabled : false)
    };

    await tenant.update({
      chatbotConfig: updatedConfig
    });

    res.json({
      success: true,
      message: 'Chatbot configuration updated successfully',
      data: {
        chatbotConfig: tenant.chatbotConfig
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating chatbot configuration',
      error: error.message
    });
  }
};

/**
 * @desc    Toggle chatbot enabled status
 * @route   PUT /api/chatbot/toggle
 * @access  Private
 */
exports.toggleChatbot = async (req, res) => {
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

    const currentConfig = tenant.chatbotConfig || {
      name: 'BluAssist',
      welcomeMessage: 'Hello! How can I help you today?',
      theme: {
        primaryColor: '#007bff',
        secondaryColor: '#6c757d'
      },
      enabled: false
    };

    const updatedConfig = {
      ...currentConfig,
      enabled: !currentConfig.enabled
    };

    await tenant.update({
      chatbotConfig: updatedConfig
    });

    res.json({
      success: true,
      message: `Chatbot ${updatedConfig.enabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        chatbotConfig: tenant.chatbotConfig
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling chatbot',
      error: error.message
    });
  }
};

/**
 * @desc    Reset chatbot configuration to defaults
 * @route   POST /api/chatbot/reset
 * @access  Private
 */
exports.resetChatbotConfig = async (req, res) => {
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

    const defaultConfig = {
      name: 'BluAssist',
      welcomeMessage: 'Hello! How can I help you today?',
      theme: {
        primaryColor: '#007bff',
        secondaryColor: '#6c757d'
      },
      enabled: false
    };

    await tenant.update({
      chatbotConfig: defaultConfig
    });

    res.json({
      success: true,
      message: 'Chatbot configuration reset to defaults',
      data: {
        chatbotConfig: tenant.chatbotConfig
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resetting chatbot configuration',
      error: error.message
    });
  }
};
