require('dotenv').config();
const { sequelize } = require('../config/database');
const { Tenant } = require('../models');
const { getBotpressClient } = require('../utils/botpress');

(async () => {
  await sequelize.authenticate();
  const tenants = await Tenant.findAll();

  console.log('--- TENANTS IN DB ---');
  tenants.forEach(t => console.log(
    `  ${t.name} | botpressRowId=${t.botpressRowId} | platformName=${t.platformName} | voiceTone=${t.voiceTone}`
  ));

  const target = tenants.find(t => t.botpressRowId);
  if (!target) {
    console.log('No tenant with botpressRowId found.');
    await sequelize.close();
    return;
  }

  console.log(`\nTesting updateTableRows on "${target.name}" (row ${target.botpressRowId})...`);
  try {
    const bp = getBotpressClient();
    const result = await bp.updateTableRows({
      table: 'tenant2kbTable',
      rows: [{
        id: target.botpressRowId,
        KBId: target.knowledgeBaseId || '',
        tenantId: target.id,
        voiceTone: target.voiceTone || '',
        voiceEmojis: String(target.voiceEmojis ?? ''),
        voiceEnergy: target.voiceEnergy || '',
        restaurantName: target.platformName || '',
        voiceWordsAvoid: target.voiceWordsAvoid || '',
        brandPersonality: target.brandPersonality || '',
        uxClosingSignoff: target.uxClosingSignoff || '',
        voiceWordsPrefer: '',
        uxOpeningGreeting: target.uxOpeningGreeting || '',
        voiceSentenceStyle: target.voiceSentenceStyle || '',
        policyAllergenSafety: '',
        restaurantDescription: target.platformDescription || '',
        whatsappBotPhoneNumberId: target.whatsappBotPhoneNumberId || '',
        policyUncertaintyFallback: ''
      }]
    });
    console.log('SUCCESS. Result:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('FAILED:', e.message);
    if (e.response) console.error('Response body:', JSON.stringify(e.response.data || e.response, null, 2));
  }

  await sequelize.close();
})();
