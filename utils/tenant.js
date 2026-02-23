/**
 * Get tenant ID from user object (handles both populated and non-populated)
 * @param {Object} user - User object with tenant field
 * @returns {String|ObjectId} Tenant ID
 */
exports.getTenantId = (user) => {
  if (!user || !user.tenant) {
    return null;
  }
  
  // If tenant is populated (object), return _id
  if (user.tenant._id) {
    return user.tenant._id;
  }
  
  // If tenant is just an ObjectId, return it directly
  return user.tenant;
};
