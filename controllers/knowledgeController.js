const { KnowledgePage, KnowledgeTemplate, Tenant } = require('../models');
const { slugify, generateUniqueSlug } = require('../utils/slugify');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { ensureSubscriptionState } = require('../utils/subscription');

/**
 * @desc    Get tenant's knowledge page (one per tenant). Returns page only when subscription is active.
 * @route   GET /api/knowledge/pages
 * @access  Private
 */
exports.getKnowledgePages = async (req, res) => {
  try {
    const tenantId = req.user.tenant?.id || req.user.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'No tenant associated with user'
      });
    }

    const tenant = await Tenant.findByPk(tenantId, {
      attributes: ['id', 'knowledgeBaseId', 'subscriptionEndDate']
    });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    await ensureSubscriptionState(tenant);

    // When subscription is expired, do not return knowledge base on the portal
    if (!tenant.isSubscriptionActive()) {
      return res.json({
        success: true,
        data: {
          page: null,
          exists: false
        }
      });
    }

    const page = await KnowledgePage.findOne({
      where: { tenantId },
      order: [['createdAt', 'DESC']]
    });

    // Backfill knowledgeBaseId when tenant has a page and active subscription but ID not set
    if (page && tenant && !tenant.knowledgeBaseId) {
      await tenant.update({ knowledgeBaseId: uuidv4() });
      await tenant.reload();
    }

    res.json({
      success: true,
      data: {
        page: page || null,
        exists: !!page
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching knowledge page',
      error: error.message
    });
  }
};

/**
 * @desc    Get single knowledge page
 * @route   GET /api/knowledge/pages/:id
 * @access  Private
 */
exports.getKnowledgePage = async (req, res) => {
  try {
    const tenantId = req.user.tenant?.id || req.user.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'No tenant associated with user'
      });
    }

    const tenant = await Tenant.findByPk(tenantId, { attributes: ['id', 'subscriptionEndDate'] });
    if (tenant && !tenant.isSubscriptionActive()) {
      return res.status(403).json({
        success: false,
        message: 'Knowledge base access requires an active subscription'
      });
    }

    const page = await KnowledgePage.findOne({
      where: {
        id,
        tenantId
      }
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Knowledge page not found'
      });
    }

    // Increment view count
    await page.update({
      viewCount: page.viewCount + 1,
      lastViewedAt: new Date()
    });

    res.json({
      success: true,
      data: {
        page
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching knowledge page',
      error: error.message
    });
  }
};

/**
 * @desc    Create new knowledge page (one per tenant)
 * @route   POST /api/knowledge/pages
 * @access  Private
 */
exports.createKnowledgePage = async (req, res) => {
  try {
    const tenantId = req.user.tenant?.id || req.user.tenantId;
    const { title, category, tags, content, templateId, metaDescription, metaKeywords, status } = req.body;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'No tenant associated with user'
      });
    }

    const tenant = await Tenant.findByPk(tenantId, { attributes: ['id', 'knowledgeBaseId', 'subscriptionEndDate'] });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }
    if (!tenant.isSubscriptionActive()) {
      return res.status(403).json({
        success: false,
        message: 'An active subscription is required to create a knowledge base'
      });
    }

    // Check if tenant already has a knowledge page
    const existingPage = await KnowledgePage.findOne({
      where: { tenantId }
    });

    if (existingPage) {
      return res.status(400).json({
        success: false,
        message: 'Tenant already has a knowledge page. Please update the existing one.',
        data: {
          existingPageId: existingPage.id
        }
      });
    }

    // Generate slug (optional since tenant can only have one page)
    const baseSlug = slugify(title || 'knowledge-base');
    const slug = baseSlug; // No need for uniqueness check since one per tenant

    // If templateId provided, get template and merge default content
    let finalContent = content || {};
    if (templateId) {
      const template = await KnowledgeTemplate.findOne({
        where: {
          id: templateId,
          [Op.or]: [
            { tenantId },
            { isSystem: true }
          ],
          status: 'active'
        }
      });

      if (template) {
        // Merge template default content with provided content
        finalContent = {
          ...template.defaultContent,
          ...content
        };
      }
    }

    const page = await KnowledgePage.create({
      tenantId,
      title: title || 'Knowledge Base',
      slug,
      category,
      tags: tags || [],
      content: finalContent,
      status: status || 'draft',
      metaDescription,
      metaKeywords: metaKeywords || [],
      version: 1
    });

    // Set knowledge base ID on tenant so it can be exposed in the portal (tenant already loaded above)
    if (!tenant.knowledgeBaseId) {
      await tenant.update({ knowledgeBaseId: uuidv4() });
    }

    res.status(201).json({
      success: true,
      message: 'Knowledge page created successfully',
      data: {
        page
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating knowledge page',
      error: error.message
    });
  }
};

/**
 * @desc    Update knowledge page
 * @route   PUT /api/knowledge/pages/:id
 * @access  Private
 */
exports.updateKnowledgePage = async (req, res) => {
  try {
    const tenantId = req.user.tenant?.id || req.user.tenantId;
    const { id } = req.params;
    const { title, category, tags, content, metaDescription, metaKeywords, status } = req.body;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'No tenant associated with user'
      });
    }

    const tenant = await Tenant.findByPk(tenantId, { attributes: ['id', 'subscriptionEndDate'] });
    if (tenant && !tenant.isSubscriptionActive()) {
      return res.status(403).json({
        success: false,
        message: 'Knowledge base access requires an active subscription'
      });
    }

    const page = await KnowledgePage.findOne({
      where: {
        id,
        tenantId
      }
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Knowledge page not found'
      });
    }

    // Update slug if title changed (optional)
    let slug = page.slug;
    if (title && title !== page.title) {
      slug = slugify(title);
    }

    // Increment version if content changed
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== page.slug) updateData.slug = slug;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (content !== undefined) {
      updateData.content = content;
      updateData.version = page.version + 1;
    }
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (metaKeywords !== undefined) updateData.metaKeywords = metaKeywords;
    if (status !== undefined) {
      updateData.status = status;
      // Set publishedAt if status changes to published
      if (status === 'published' && page.status !== 'published') {
        updateData.publishedAt = new Date();
        updateData.publishedBy = req.user.id;
      }
    }

    await page.update(updateData);

    res.json({
      success: true,
      message: 'Knowledge page updated successfully',
      data: {
        page
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating knowledge page',
      error: error.message
    });
  }
};

/**
 * @desc    Delete knowledge page
 * @route   DELETE /api/knowledge/pages/:id
 * @access  Private
 */
exports.deleteKnowledgePage = async (req, res) => {
  try {
    const tenantId = req.user.tenant?.id || req.user.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'No tenant associated with user'
      });
    }

    const tenant = await Tenant.findByPk(tenantId, { attributes: ['id', 'subscriptionEndDate'] });
    if (tenant && !tenant.isSubscriptionActive()) {
      return res.status(403).json({
        success: false,
        message: 'Knowledge base access requires an active subscription'
      });
    }

    const page = await KnowledgePage.findOne({
      where: {
        id,
        tenantId
      }
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Knowledge page not found'
      });
    }

    await page.destroy();

    const remaining = await KnowledgePage.count({ where: { tenantId } });
    if (remaining === 0) {
      const t = await Tenant.findByPk(tenantId, { attributes: ['id', 'knowledgeBaseId'] });
      if (t?.knowledgeBaseId) await t.update({ knowledgeBaseId: null });
    }

    res.json({
      success: true,
      message: 'Knowledge page deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting knowledge page',
      error: error.message
    });
  }
};

/**
 * @desc    Get knowledge templates
 * @route   GET /api/knowledge/templates
 * @access  Private
 */
exports.getKnowledgeTemplates = async (req, res) => {
  try {
    const tenantId = req.user.tenant?.id || req.user.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'No tenant associated with user'
      });
    }

    const templates = await KnowledgeTemplate.findAll({
      where: {
        [Op.or]: [
          { tenantId },
          { isSystem: true }
        ],
        status: 'active'
      },
      order: [['isSystem', 'DESC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        templates
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching knowledge templates',
      error: error.message
    });
  }
};

/**
 * @desc    Get single knowledge template
 * @route   GET /api/knowledge/templates/:id
 * @access  Private
 */
exports.getKnowledgeTemplate = async (req, res) => {
  try {
    const tenantId = req.user.tenant?.id || req.user.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'No tenant associated with user'
      });
    }

    const template = await KnowledgeTemplate.findOne({
      where: {
        id,
        [Op.or]: [
          { tenantId },
          { isSystem: true }
        ],
        status: 'active'
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Knowledge template not found'
      });
    }

    res.json({
      success: true,
      data: {
        template
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching knowledge template',
      error: error.message
    });
  }
};

/**
 * @desc    Get categories for tenant
 * @route   GET /api/knowledge/categories
 * @access  Private
 */
exports.getCategories = async (req, res) => {
  try {
    const tenantId = req.user.tenant?.id || req.user.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'No tenant associated with user'
      });
    }

    const pages = await KnowledgePage.findAll({
      where: { tenantId },
      attributes: ['category'],
      group: ['category'],
      having: { category: { [Op.ne]: null } }
    });

    const categories = pages.map(p => p.category).filter(Boolean);

    res.json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};
