require('dotenv').config();
const { sequelize } = require('../config/database');
const { Tenant } = require('../models');
const { getBotpressClient } = require('../utils/botpress');
const { Op } = require('sequelize');

(async () => {
  await sequelize.authenticate();
  const tenants = await Tenant.findAll({
    where: { botpressRowId: { [Op.ne]: null } }
  });

  const bp = getBotpressClient();

  console.log(`Found ${tenants.length} tenant(s) with botpressRowId.`);

  for (const t of tenants) {
    console.log(`\nSyncing "${t.name}" -> Botpress row ${t.botpressRowId}`);
    console.log(`  platformName=${t.platformName} | voiceTone=${t.voiceTone} | KBId=${t.knowledgeBaseId}`);

    try {
      const result = await bp.updateTableRows({
        table: 'tenant2kbTable',
        rows: [{
          id: t.botpressRowId,
          KBId: t.knowledgeBaseId || '',
          tenantId: t.id,
          voiceTone: t.voiceTone || '',
          voiceEmojis: String(t.voiceEmojis ?? ''),
          voiceEnergy: t.voiceEnergy || '',
          restaurantName: t.platformName || '',
          voiceWordsAvoid: t.voiceWordsAvoid || '',
          brandPersonality: t.brandPersonality || '',
          uxClosingSignoff: t.uxClosingSignoff || '',
          voiceWordsPrefer: '',
          uxOpeningGreeting: t.uxOpeningGreeting || '',
          voiceSentenceStyle: t.voiceSentenceStyle || '',
          policyAllergenSafety: '',
          restaurantDescription: t.platformDescription || '',
          whatsappBotPhoneNumberId: t.whatsappBotPhoneNumberId || '',
          policyUncertaintyFallback: ''
        }]
      });
      const row = result.rows[0];
      console.log(`  OK -> restaurantName="${row.restaurantName}" | voiceTone="${row.voiceTone}" | KBId="${row.KBId}"`);
    } catch (e) {
      console.error(`  FAIL: ${e.message}`);
    }
  }

  await sequelize.close();
})();
