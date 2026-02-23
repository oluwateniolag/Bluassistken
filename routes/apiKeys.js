const express = require('express');
const router = express.Router();
const apiKeyController = require('../controllers/apiKeyController');
const { protect, checkTenantAccess } = require('../middleware/auth');

// All routes require authentication and tenant access
router.use(protect);
router.use(checkTenantAccess);

// API Key management routes
router.get('/', apiKeyController.getApiKeys);
router.post('/regenerate-key', apiKeyController.regenerateApiKey);
router.post('/regenerate-secret', apiKeyController.regenerateApiSecret);
router.post('/regenerate-both', apiKeyController.regenerateBoth);

module.exports = router;
