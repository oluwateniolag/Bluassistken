/**
 * Convert a string to a URL-friendly slug
 */
exports.slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')     // Remove all non-word chars
    .replace(/\-\-+/g, '-')       // Replace multiple - with single -
    .replace(/^-+/, '')           // Trim - from start of text
    .replace(/-+$/, '');           // Trim - from end of text
};

/**
 * Generate a unique slug by appending a number if needed
 */
exports.generateUniqueSlug = async (baseSlug, Model, excludeId = null, additionalWhere = {}) => {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const whereClause = { slug, ...additionalWhere };
    if (excludeId) {
      whereClause.id = { [require('sequelize').Op.ne]: excludeId };
    }
    
    const existing = await Model.findOne({ where: whereClause });
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};
