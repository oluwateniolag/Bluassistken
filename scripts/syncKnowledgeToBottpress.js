require('dotenv').config();
const { sequelize } = require('../config/database');
const { KnowledgePage } = require('../models');
const { uploadKbFile, kbContentToText } = require('../utils/botpress');

const syncKnowledgeToBottpress = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');

    const pages = await KnowledgePage.findAll();
    console.log(`Found ${pages.length} knowledge page(s) to process.`);

    if (pages.length === 0) {
      console.log('Nothing to sync.');
      await sequelize.close();
      process.exit(0);
    }

    let uploaded = 0;
    let failed = 0;

    for (const page of pages) {
      try {
        await uploadKbFile({
          key: `kb-${page.tenantId}/${page.id}.txt`,
          content: kbContentToText(page.title, page.content),
          title: page.title,
          kbId: `kb-${page.tenantId}`
        });
        console.log(`  [OK]   "${page.title}" (${page.id}) – uploaded`);
        uploaded++;
      } catch (bpError) {
        console.error(`  [FAIL] "${page.title}" (${page.id}) – ${bpError.message}`);
        failed++;
      }
    }

    console.log('\n--- Summary ---');
    console.log(`  Uploaded : ${uploaded}`);
    console.log(`  Failed   : ${failed}`);

    await sequelize.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal error:', error.message);
    await sequelize.close().catch(() => {});
    process.exit(1);
  }
};

syncKnowledgeToBottpress();
