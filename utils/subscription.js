/**
 * Ensures tenant subscription state is consistent: when subscription is expired,
 * clear knowledgeBaseId so it is not exposed on the portal.
 * @param {import('../models').Tenant} tenant - Tenant instance (must be loaded with knowledgeBaseId, subscriptionEndDate)
 * @returns {Promise<import('../models').Tenant>} Updated tenant (reloaded if changed)
 */
async function ensureSubscriptionState(tenant) {
  if (!tenant) return tenant;
  const active = tenant.isSubscriptionActive();
  if (!active && tenant.knowledgeBaseId) {
    await tenant.update({ knowledgeBaseId: null });
    await tenant.reload();
  }
  return tenant;
}

module.exports = { ensureSubscriptionState };
