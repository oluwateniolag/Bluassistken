require('dotenv').config();
const { sequelize } = require('../config/database');
const { KnowledgeTemplate } = require('../models');

const seedDefaultTemplate = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync database models
    console.log('Syncing database models...');
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');

    // Check if default template already exists
    const existingTemplate = await KnowledgeTemplate.findOne({
      where: {
        name: 'Platform Knowledge Page Template',
        isSystem: true
      }
    });

    if (existingTemplate) {
      console.log('Default template already exists.');
      await sequelize.close();
      process.exit(0);
    }

    // Create default system template based on Platform Knowledge Page Template
    const defaultTemplate = await KnowledgeTemplate.create({
      name: 'Platform Knowledge Page Template',
      description: 'Template for creating platform knowledge base documentation',
      isSystem: true,
      status: 'active',
      schema: {
        sections: [
          {
            id: 'platformOverview',
            title: '1. Platform Overview',
            fields: [
              {
                name: 'platformName',
                label: 'Platform Name',
                type: 'text',
                required: true,
                placeholder: 'e.g., trustpro, paymentpro'
              },
              {
                name: 'introduction',
                label: 'Introduction',
                type: 'textarea',
                required: true,
                placeholder: 'Describe the core purpose and value proposition in 1–2 sentences. It serves [user personas] by providing [key capability].',
                helpText: 'Example: [Platform Name] is a [cloud-based/hybrid/on-premise] platform designed to [purpose]. It serves [user personas] by providing [capability].'
              }
            ]
          },
          {
            id: 'coreFunctionality',
            title: '2. Core Functionality & System Capabilities',
            fields: [
              {
                name: 'moduleOverview',
                label: 'Module Overview',
                type: 'textarea',
                required: false,
                placeholder: 'Describe how the platform is organized into functional modules...',
                helpText: 'Example: [Platform Name] is organized into the following functional modules. Each module may be independently enabled or disabled depending on your subscription plan.'
              },
              {
                name: 'modules',
                label: 'Modules',
                type: 'array',
                required: false,
                itemType: 'object',
                schema: {
                  name: { type: 'text', required: true, label: 'Module Name', placeholder: 'e.g., User & Account Management' },
                  features: { 
                    type: 'array', 
                    required: false, 
                    itemType: 'text',
                    label: 'Features',
                    placeholder: 'Feature or capability within this module'
                  }
                }
              }
            ]
          },
          {
            id: 'apiDocumentation',
            title: '3. API Documentation',
            fields: [
              {
                name: 'apiRequestResponses',
                label: 'Request and Responses',
                type: 'textarea',
                required: false,
                placeholder: 'Document API request and response formats...'
              }
            ]
          },
          {
            id: 'errorCodes',
            title: '4. Error Codes & Status Responses',
            fields: [
              {
                name: 'httpStatusCodes',
                label: 'HTTP Status Code Reference',
                type: 'array',
                required: false,
                itemType: 'object',
                schema: {
                  status: { type: 'text', required: true, label: 'HTTP Status', placeholder: 'e.g., 200 OK' },
                  meaning: { type: 'text', required: true, label: 'Meaning', placeholder: 'e.g., Request succeeded. Response body contains the result.' }
                }
              }
            ]
          },
          {
            id: 'faq',
            title: '5. Frequently Asked Questions (FAQ)',
            fields: [
              {
                name: 'faqCategories',
                label: 'FAQ Categories',
                type: 'array',
                required: false,
                itemType: 'object',
                schema: {
                  category: { type: 'text', required: true, label: 'Category Name', placeholder: 'e.g., General Questions, Technical Questions' },
                  questions: {
                    type: 'array',
                    required: false,
                    itemType: 'object',
                    schema: {
                      question: { type: 'text', required: true, label: 'Question' },
                      answer: { type: 'textarea', required: true, label: 'Answer' }
                    }
                  }
                }
              }
            ]
          }
        ]
      },
      defaultContent: {
        platformName: '',
        introduction: '',
        moduleOverview: '',
        modules: [],
        apiRequestResponses: '',
        httpStatusCodes: [],
        faqCategories: []
      }
    });

    console.log('Default knowledge template created successfully!');
    console.log('Template ID:', defaultTemplate.id);
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding default template:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    await sequelize.close().catch(() => {});
    process.exit(1);
  }
};

seedDefaultTemplate();
