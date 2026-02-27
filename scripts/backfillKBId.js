require('dotenv').config();
const { sequelize } = require('../config/database');
const { Tenant } = require('../models');
const { getBotpressClient } = require('../utils/botpress');

(async () => {
  await sequelize.authenticate();
  const tenants = await Tenant.findAll({
    attributes: ['id', 'name', 'knowledgeBaseId', 'botpressRowId']
  });
  const bpClient = getBotpressClient();

  for (const t of tenants) {
    if (!t.botpressRowId) {
      console.log(`[SKIP] ${t.name} – no botpressRowId`);
      continue;
    }
    if (!t.knowledgeBaseId) {
      console.log(`[SKIP] ${t.name} – no knowledgeBaseId`);
      continue;
    }
    try {
      await bpClient.updateTableRows({
        table: 'tenant2kbTable',
        rows: [{ id: t.botpressRowId, KBId: t.knowledgeBaseId }]
      });
      console.log(`[OK]   ${t.name} – KBId=${t.knowledgeBaseId} → row ${t.botpressRowId}`);
    } catch (e) {
      console.error(`[FAIL] ${t.name} – ${e.message}`);
    }
  }

  await sequelize.close();
})();
