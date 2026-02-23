const { Tenant } = require('../models');
const { ensureSubscriptionState } = require('../utils/subscription');

const PLAN_ORDER = ['free', 'basic', 'premium', 'enterprise'];

function planLevel(plan) {
  const i = PLAN_ORDER.indexOf(plan);
  return i === -1 ? 0 : i;
}

/**
 * @desc    Get current tenant subscription
 * @route   GET /api/tenants/subscription
 * @access  Private
 */
exports.getSubscription = async (req, res) => {
  try {
    const tenantId = req.user.tenant?.id || req.user.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'No tenant associated with user'
      });
    }

    const tenant = await Tenant.findByPk(tenantId, {
      attributes: ['id', 'plan', 'subscriptionStartDate', 'subscriptionEndDate']
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    await ensureSubscriptionState(tenant);

    const subscriptionActive = tenant.isSubscriptionActive();

    res.json({
      success: true,
      data: {
        plan: tenant.plan || 'free',
        subscriptionStartDate: tenant.subscriptionStartDate,
        subscriptionEndDate: tenant.subscriptionEndDate,
        subscriptionActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription',
      error: error.message
    });
  }
};

/**
 * @desc    Subscribe or upgrade subscription (set plan and optional period)
 * @route   PUT /api/tenants/subscription
 * @access  Private
 * @body    { plan: 'free'|'basic'|'premium'|'enterprise', durationMonths?: number }
 */
exports.updateSubscription = async (req, res) => {
  try {
    const tenantId = req.user.tenant?.id || req.user.tenantId;
    const { plan, durationMonths } = req.body;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'No tenant associated with user'
      });
    }

    if (!plan || !PLAN_ORDER.includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Valid plan is required: free, basic, premium, or enterprise'
      });
    }

    const tenant = await Tenant.findByPk(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    const currentPlan = tenant.plan || 'free';
    const isUpgrade = planLevel(plan) > planLevel(currentPlan);

    let subscriptionStartDate = tenant.subscriptionStartDate;
    let subscriptionEndDate = tenant.subscriptionEndDate;

    if (plan === 'free') {
      subscriptionStartDate = null;
      subscriptionEndDate = null;
    } else {
      const now = new Date();
      subscriptionStartDate = isUpgrade ? now : (tenant.subscriptionStartDate || now);
      const months = durationMonths != null && durationMonths > 0 ? durationMonths : 1;
      subscriptionEndDate = new Date(subscriptionStartDate);
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + months);
    }

    await tenant.update({
      plan,
      subscriptionStartDate,
      subscriptionEndDate
    });

    await tenant.reload();

    res.json({
      success: true,
      message: isUpgrade ? 'Subscription upgraded successfully' : plan === 'free' ? 'Subscription updated to Free' : 'Subscription updated successfully',
      data: {
        plan: tenant.plan,
        subscriptionStartDate: tenant.subscriptionStartDate,
        subscriptionEndDate: tenant.subscriptionEndDate,
        subscriptionActive: tenant.isSubscriptionActive()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating subscription',
      error: error.message
    });
  }
};
