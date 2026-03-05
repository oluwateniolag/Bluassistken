const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const tenantController = require('../controllers/tenantController');
const subscriptionController = require('../controllers/subscriptionController');
const { protect, checkTenantAccess } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

// Validation middleware
const validateTenantRegistration = [
  body('name')
    .trim()
    .notEmpty().withMessage('Tenant name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Tenant name must be between 2 and 100 characters'),
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('type')
    .isIn(['fintech', 'personal']).withMessage('Tenant type must be either fintech or personal'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
];

const validateCompanyDetails = [
  body('companyName')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Company name cannot exceed 200 characters'),
  body('website')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (!value) return true;
      const pattern = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]{2,}(\/.*)?$/;
      if (!pattern.test(value)) {
        throw new Error('Please provide a valid website (e.g. www.example.com)');
      }
      return true;
    }),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+[\d\s\-\(\)]{6,20}$/).withMessage('Please provide a valid phone number with country code')
];

const validateSubscription = [
  body('plan')
    .isIn(['free', 'basic', 'premium', 'enterprise']).withMessage('Plan must be free, basic, premium, or enterprise'),
  body('durationMonths')
    .optional()
    .isInt({ min: 1, max: 120 }).withMessage('Duration must be between 1 and 120 months')
];

const validateChatbotConfig = [
  body('chatbotName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Chatbot name cannot exceed 50 characters'),
  body('welcomeMessage')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Welcome message cannot exceed 500 characters'),
  body('primaryColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Primary color must be a valid hex color'),
  body('secondaryColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Secondary color must be a valid hex color')
];

// Public routes
router.post('/register', validateTenantRegistration, handleValidationErrors, tenantController.registerTenant);

// Protected routes (require authentication)
router.use(protect);
router.use(checkTenantAccess);

// Onboarding routes
router.get('/onboarding/status', tenantController.getOnboardingStatus);
router.put('/onboarding/company', validateCompanyDetails, handleValidationErrors, tenantController.updateCompanyDetails);
router.put('/onboarding/chatbot', validateChatbotConfig, handleValidationErrors, tenantController.configureChatbot);
router.post('/onboarding/complete', tenantController.completeOnboarding);

// Bot identity route
router.put('/bot-identity', tenantController.updateBotIdentity);

// Tenant management routes
router.get('/me', tenantController.getCurrentTenant);

// Subscription routes
router.get('/subscription', subscriptionController.getSubscription);
router.put('/subscription', validateSubscription, handleValidationErrors, subscriptionController.updateSubscription);

module.exports = router;
