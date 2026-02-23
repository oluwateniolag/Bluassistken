const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const chatbotController = require('../controllers/chatbotController');
const { protect, checkTenantAccess } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

// Validation middleware
const validateChatbotConfig = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Chatbot name must be between 1 and 50 characters'),
  body('welcomeMessage')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 }).withMessage('Welcome message must be between 1 and 500 characters'),
  body('primaryColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Primary color must be a valid hex color (e.g., #007bff)'),
  body('secondaryColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Secondary color must be a valid hex color (e.g., #6c757d)'),
  body('enabled')
    .optional()
    .isBoolean().withMessage('Enabled must be a boolean value')
];

// All routes require authentication and tenant access
router.use(protect);
router.use(checkTenantAccess);

// Chatbot configuration routes
router.get('/config', chatbotController.getChatbotConfig);
router.put('/config', validateChatbotConfig, handleValidationErrors, chatbotController.updateChatbotConfig);
router.put('/toggle', chatbotController.toggleChatbot);
router.post('/reset', chatbotController.resetChatbotConfig);

module.exports = router;
