require('dotenv').config();
const { sequelize } = require('../config/database');
const { Tenant } = require('../models');
const { getBotpressClient } = require('../utils/botpress');

const syncTenantsToBottpress = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');

    const tenants = await Tenant.findAll();
    console.log(`Found ${tenants.length} tenant(s) to process.`);

    const bpClient = getBotpressClient();

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const tenant of tenants) {
      if (tenant.botpressRowId) {
        console.log(`  [SKIP] ${tenant.name} (${tenant.id}) – already has botpressRowId ${tenant.botpressRowId}`);
        skipped++;
        continue;
      }

      try {
        const { rows } = await bpClient.createTableRows({
          table: 'tenant2kbTable',
          rows: [{
            KBId: tenant.knowledgeBaseId || '',
            tenantId: tenant.id,
            voiceTone: tenant.voiceTone || '',
            voiceEmojis: String(tenant.voiceEmojis ?? ''),
            voiceEnergy: tenant.voiceEnergy || '',
            restaurantName: tenant.platformName || '',
            voiceWordsAvoid: tenant.voiceWordsAvoid || '',
            brandPersonality: tenant.brandPersonality || '',
            uxClosingSignoff: tenant.uxClosingSignoff || '',
            voiceWordsPrefer: '',
            uxOpeningGreeting: tenant.uxOpeningGreeting || '',
            voiceSentenceStyle: tenant.voiceSentenceStyle || '',
            policyAllergenSafety: '',
            restaurantDescription: tenant.platformDescription || '',
            whatsappBotPhoneNumberId: tenant.whatsappBotPhoneNumberId || '',
            policyUncertaintyFallback: ''
          }]
        });

        if (rows && rows.length > 0) {
          await tenant.update({ botpressRowId: rows[0].id });
          console.log(`  [OK]   ${tenant.name} (${tenant.id}) – created Botpress row ${rows[0].id}`);
          created++;
        } else {
          console.warn(`  [WARN] ${tenant.name} (${tenant.id}) – createTableRows returned no rows`);
          failed++;
        }
      } catch (bpError) {
        console.error(`  [FAIL] ${tenant.name} (${tenant.id}) – ${bpError.message}`);
        failed++;
      }
    }

    console.log('\n--- Summary ---');
    console.log(`  Created : ${created}`);
    console.log(`  Skipped : ${skipped}`);
    console.log(`  Failed  : ${failed}`);

    await sequelize.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal error:', error.message);
    await sequelize.close().catch(() => {});
    process.exit(1);
  }
};

syncTenantsToBottpress();
