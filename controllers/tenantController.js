const { Tenant, User, sequelize } = require('../models');
const { generateToken } = require('../utils/jwt');
const { slugify, generateUniqueSlug } = require('../utils/slugify');
const { Op } = require('sequelize');
const { ensureSubscriptionState } = require('../utils/subscription');
const { getBotpressClient } = require('../utils/botpress');

/**
 * @desc    Register a new tenant (Step 1: Basic Information)
 * @route   POST /api/tenants/register
 * @access  Public
 */
exports.registerTenant = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { name, email, type, password, firstName, lastName } = req.body;

    // Check if tenant with email already exists
    const existingTenant = await Tenant.findOne({ 
      where: { email: email.toLowerCase() },
      transaction 
    });
    
    if (existingTenant) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'A tenant with this email already exists'
      });
    }

    // Check if user with email already exists
    const existingUser = await User.findOne({
      where: { email: email.toLowerCase() },
      transaction
    });

    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Generate unique slug
    const baseSlug = slugify(name);
    const slug = await generateUniqueSlug(baseSlug, Tenant);

    // Create tenant
    const tenant = await Tenant.create({
      name,
      slug,
      email: email.toLowerCase(),
      type,
      status: 'pending',
      onboardingStep: 1
    }, { transaction });

    // Create admin user for the tenant
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      role: 'tenant_admin',
      tenantId: tenant.id
    }, { transaction });

    await transaction.commit();

    // Sync new tenant to Botpress tenant2kbTable (non-blocking – failure won't break registration)
    try {
      const bpClient = getBotpressClient();
      const { rows } = await bpClient.createTableRows({
        table: 'tenant2kbTable',
        rows: [{
          KBId: '',
          tenantId: tenant.id,
          voiceTone: '',
          voiceEmojis: '',
          voiceEnergy: '',
          restaurantName: '',
          voiceWordsAvoid: '',
          brandPersonality: '',
          uxClosingSignoff: '',
          voiceWordsPrefer: '',
          uxOpeningGreeting: '',
          voiceSentenceStyle: '',
          policyAllergenSafety: '',
          restaurantDescription: '',
          whatsappBotPhoneNumberId: '',
          policyUncertaintyFallback: ''
        }]
      });
      if (rows && rows.length > 0) {
        await tenant.update({ botpressRowId: rows[0].id });
      }
    } catch (bpError) {
      console.error('Failed to create Botpress table row for tenant:', bpError.message);
    }

    // Generate JWT token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      data: {
        tenant: {
          id: tenant.id,
          tenantId: tenant.id, // Explicit tenant ID
          name: tenant.name,
          slug: tenant.slug,
          email: tenant.email,
          type: tenant.type,
          status: tenant.status,
          onboardingStep: tenant.onboardingStep
        },
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: tenant.id
        },
        token
      }
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Error registering tenant',
      error: error.message
    });
  }
};

/**
 * @desc    Update tenant company details (Step 2)
 * @route   PUT /api/tenants/onboarding/company
 * @access  Private
 */
exports.updateCompanyDetails = async (req, res) => {
  try {
    const { companyName, website, phone } = req.body;
    const tenantId = req.user.tenant?.id || req.user.tenantId;

    const tenant = await Tenant.findByPk(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    await tenant.update({
      companyName,
      website,
      phone,
      onboardingStep: 2
    });

    // Reload tenant to get fresh data
    await tenant.reload();

    res.json({
      success: true,
      message: 'Company details updated successfully',
      data: {
        tenant: {
          id: tenant.id,
          companyName: tenant.companyName,
          website: tenant.website,
          phone: tenant.phone,
          onboardingStep: tenant.onboardingStep
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating company details',
      error: error.message
    });
  }
};

/**
 * @desc    Configure chatbot settings (Step 3)
 * @route   PUT /api/tenants/onboarding/chatbot
 * @access  Private
 */
exports.configureChatbot = async (req, res) => {
  try {
    const { chatbotName, welcomeMessage, primaryColor, secondaryColor } = req.body;
    const tenantId = req.user.tenant?.id || req.user.tenantId;

    const tenant = await Tenant.findByPk(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Get current config or initialize defaults
    const currentConfig = tenant.chatbotConfig || {
      name: 'BluAssist',
      welcomeMessage: 'Hello! How can I help you today?',
      theme: {
        primaryColor: '#003366',
        secondaryColor: '#0059b3'
      },
      enabled: false
    };

    // Update chatbot config
    const chatbotConfig = { ...currentConfig };
    if (chatbotName !== undefined && chatbotName !== null) chatbotConfig.name = chatbotName;
    if (welcomeMessage !== undefined && welcomeMessage !== null) chatbotConfig.welcomeMessage = welcomeMessage;
    if (primaryColor !== undefined && primaryColor !== null) {
      chatbotConfig.theme = { 
        ...chatbotConfig.theme, 
        primaryColor 
      };
    }
    if (secondaryColor !== undefined && secondaryColor !== null) {
      chatbotConfig.theme = { 
        ...chatbotConfig.theme, 
        secondaryColor 
      };
    }

    await tenant.update({
      chatbotConfig,
      onboardingStep: 3
    });

    // Reload tenant to get fresh data
    await tenant.reload();

    res.json({
      success: true,
      message: 'Chatbot configured successfully',
      data: {
        tenant: {
          id: tenant.id,
          chatbotConfig: tenant.chatbotConfig,
          onboardingStep: tenant.onboardingStep
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error configuring chatbot',
      error: error.message
    });
  }
};

/**
 * @desc    Complete onboarding (Step 4 - Final Step)
 * @route   POST /api/tenants/onboarding/complete
 * @access  Private
 */
exports.completeOnboarding = async (req, res) => {
  try {
    const tenantId = req.user.tenant?.id || req.user.tenantId;

    const tenant = await Tenant.findByPk(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Set default plan to 'free' if not already set
    const plan = tenant.plan || 'free';
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);

    // Enable chatbot if configured, otherwise use defaults
    const chatbotConfig = tenant.chatbotConfig || {
      name: 'BluAssist',
      welcomeMessage: 'Hello! How can I help you today?',
      theme: {
        primaryColor: '#003366',
        secondaryColor: '#0059b3'
      },
      enabled: true
    };
    chatbotConfig.enabled = true;

    await tenant.update({
      onboardingCompleted: true,
      onboardingStep: 4,
      status: 'active',
      plan,
      subscriptionStartDate,
      subscriptionEndDate,
      chatbotConfig
    });

    res.json({
      success: true,
      message: 'Onboarding completed successfully! Welcome to BluAssist.',
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          status: tenant.status,
          onboardingCompleted: tenant.onboardingCompleted,
          onboardingStep: tenant.onboardingStep,
          plan: tenant.plan,
          apiKey: tenant.apiKey,
          chatbotConfig: tenant.chatbotConfig
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completing onboarding',
      error: error.message
    });
  }
};

/**
 * @desc    Get tenant onboarding status
 * @route   GET /api/tenants/onboarding/status
 * @access  Private
 */
exports.getOnboardingStatus = async (req, res) => {
  try {
    const tenantId = req.user.tenant?.id || req.user.tenantId;

    const tenant = await Tenant.findByPk(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: {
        onboardingCompleted: tenant.onboardingCompleted,
        onboardingStep: tenant.onboardingStep,
        status: tenant.status,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          email: tenant.email,
          type: tenant.type
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching onboarding status',
      error: error.message
    });
  }
};

/**
 * @desc    Update bot identity settings
 * @route   PUT /api/tenants/bot-identity
 * @access  Private
 */
exports.updateBotIdentity = async (req, res) => {
  try {
    const {
      voiceTone,
      voiceEmojis,
      voiceEnergy,
      platformName,
      voiceWordsAvoid,
      brandPersonality,
      uxClosingSignoff,
      uxOpeningGreeting,
      voiceSentenceStyle,
      platformDescription,
      whatsappBotPhoneNumberId,
      whatsappCountryCode
    } = req.body;

    const tenantId = req.user.tenant?.id || req.user.tenantId;
    const tenant = await Tenant.findByPk(tenantId);

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    await tenant.update({
      voiceTone,
      voiceEmojis,
      voiceEnergy,
      platformName,
      voiceWordsAvoid,
      brandPersonality,
      uxClosingSignoff,
      uxOpeningGreeting,
      voiceSentenceStyle,
      platformDescription,
      whatsappBotPhoneNumberId,
      whatsappCountryCode
    });

    await tenant.reload();

    // Sync updated bot identity to Botpress tenant2kbTable
    try {
      const bpClient = getBotpressClient();

      // Self-heal: create Botpress row if it was never created during registration
      let bpRowId = tenant.botpressRowId;
      if (!bpRowId) {
        const { rows: newRows } = await bpClient.createTableRows({
          table: 'tenant2kbTable',
          rows: [{
            KBId: tenant.knowledgeBaseId || '',
            tenantId: tenant.id,
            voiceTone: '', voiceEmojis: '', voiceEnergy: '',
            restaurantName: '', voiceWordsAvoid: '', brandPersonality: '',
            uxClosingSignoff: '', voiceWordsPrefer: '', uxOpeningGreeting: '',
            voiceSentenceStyle: '', policyAllergenSafety: '',
            restaurantDescription: '', whatsappBotPhoneNumberId: '',
            policyUncertaintyFallback: ''
          }]
        });
        if (newRows && newRows.length > 0) {
          bpRowId = newRows[0].id;
          await tenant.update({ botpressRowId: bpRowId });
        }
      }

      if (bpRowId) {
        await bpClient.updateTableRows({
          table: 'tenant2kbTable',
          rows: [{
            id: bpRowId,
            KBId: tenant.knowledgeBaseId || '',
            tenantId: tenant.id,
            voiceTone: tenant.voiceTone || '',
            voiceEmojis: String(tenant.voiceEmojis ?? ''),
            voiceEnergy: tenant.voiceEnergy || '',
            restaurantName: tenant.platformName || '',
            voiceWordsAvoid: tenant.voiceWordsAvoid || '',
            brandPersonality: tenant.brandPersonality || '',
            uxClosingSignoff: tenant.uxClosingSignoff || '',
            voiceWordsPrefer: '',
            uxOpeningGreeting: tenant.uxOpeningGreeting || '',
            voiceSentenceStyle: tenant.voiceSentenceStyle || '',
            policyAllergenSafety: '',
            restaurantDescription: tenant.platformDescription || '',
            whatsappBotPhoneNumberId: tenant.whatsappBotPhoneNumberId || '',
            policyUncertaintyFallback: ''
          }]
        });
      }
    } catch (bpError) {
      console.error('Failed to sync bot identity to Botpress table:', bpError.message);
    }

    res.json({
      success: true,
      message: 'Bot identity updated successfully',
      data: {
        tenant: {
          voiceTone: tenant.voiceTone,
          voiceEmojis: tenant.voiceEmojis,
          voiceEnergy: tenant.voiceEnergy,
          platformName: tenant.platformName,
          voiceWordsAvoid: tenant.voiceWordsAvoid,
          brandPersonality: tenant.brandPersonality,
          uxClosingSignoff: tenant.uxClosingSignoff,
          uxOpeningGreeting: tenant.uxOpeningGreeting,
          voiceSentenceStyle: tenant.voiceSentenceStyle,
          platformDescription: tenant.platformDescription,
          whatsappBotPhoneNumberId: tenant.whatsappBotPhoneNumberId,
          whatsappCountryCode: tenant.whatsappCountryCode
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating bot identity',
      error: error.message
    });
  }
};

/**
 * @desc    Get current tenant details
 * @route   GET /api/tenants/me
 * @access  Private
 */
exports.getCurrentTenant = async (req, res) => {
  try {
    const tenantId = req.user.tenant?.id || req.user.tenantId;

    const tenant = await Tenant.findByPk(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    await ensureSubscriptionState(tenant);

    const plain = tenant.get({ plain: true });
    if (!tenant.isSubscriptionActive()) {
      delete plain.knowledgeBaseId;
    }
    plain.subscriptionActive = tenant.isSubscriptionActive();

    res.json({
      success: true,
      data: {
        tenant: plain
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tenant details',
      error: error.message
    });
  }
};
