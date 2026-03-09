const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const knowledgeController = require('../controllers/knowledgeController');
const { protect, checkTenantAccess } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

// Validation middleware
const validateKnowledgePage = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Category cannot exceed 100 characters'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  body('content')
    .notEmpty().withMessage('Content is required')
    .isObject().withMessage('Content must be an object'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
  body('metaDescription')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Meta description cannot exceed 500 characters'),
  body('metaKeywords')
    .optional()
    .isArray().withMessage('Meta keywords must be an array')
];

const validateUpdateKnowledgePage = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Category cannot exceed 100 characters'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  body('content')
    .optional()
    .isObject().withMessage('Content must be an object'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
  body('metaDescription')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Meta description cannot exceed 500 characters'),
  body('metaKeywords')
    .optional()
    .isArray().withMessage('Meta keywords must be an array')
];

// All routes require authentication and tenant access
router.use(protect);
router.use(checkTenantAccess);

// File parsing route (multipart, no JSON body validation)
router.post('/parse-file', knowledgeController.uploadMiddleware, knowledgeController.parseKnowledgeFile);

// Knowledge Pages routes
router.get('/pages', knowledgeController.getKnowledgePages);
router.get('/pages/:id', knowledgeController.getKnowledgePage);
router.post('/pages', validateKnowledgePage, handleValidationErrors, knowledgeController.createKnowledgePage);
router.put('/pages/:id', validateUpdateKnowledgePage, handleValidationErrors, knowledgeController.updateKnowledgePage);
router.delete('/pages/:id', knowledgeController.deleteKnowledgePage);

// Knowledge Templates routes
router.get('/templates', knowledgeController.getKnowledgeTemplates);
router.get('/templates/:id', knowledgeController.getKnowledgeTemplate);

// Categories route
router.get('/categories', knowledgeController.getCategories);

module.exports = router;
