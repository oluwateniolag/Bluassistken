const { Client } = require('@botpress/client');

let _client = null;

/**
 * Returns a singleton Botpress client.
 * Credentials are read from environment variables so they never appear in code.
 */
const getBotpressClient = () => {
  if (_client) return _client;

  const token = process.env.BOTPRESS_TOKEN;
  const botId = process.env.BOTPRESS_BOT_ID;
  const workspaceId = process.env.BOTPRESS_WORKSPACE_ID;

  if (!token || !botId || !workspaceId) {
    throw new Error(
      'Botpress credentials missing. Set BOTPRESS_TOKEN, BOTPRESS_BOT_ID, and BOTPRESS_WORKSPACE_ID in .env'
    );
  }

  _client = new Client({ token, botId, workspaceId });
  return _client;
};

/**
 * Converts a knowledge page's JSONB content object into readable plain text
 * so Botpress can index it properly for RAG queries.
 */
const kbContentToText = (title, content = {}) => {
  const lines = [];

  if (title) lines.push(`Platform: ${title}\n`);
  if (content.platformName) lines.push(`Platform Name: ${content.platformName}`);
  if (content.introduction) lines.push(`\nIntroduction:\n${content.introduction}`);
  if (content.moduleOverview) lines.push(`\nModule Overview:\n${content.moduleOverview}`);

  if (Array.isArray(content.modules) && content.modules.length > 0) {
    lines.push('\nModules:');
    content.modules.forEach(m => {
      lines.push(`- ${m.name || 'Unnamed module'}`);
      if (Array.isArray(m.features) && m.features.length > 0) {
        m.features.forEach(f => lines.push(`  • ${f}`));
      }
    });
  }

  if (Array.isArray(content.faqCategories) && content.faqCategories.length > 0) {
    lines.push('\nFrequently Asked Questions:');
    content.faqCategories.forEach(cat => {
      if (cat.category) lines.push(`\nCategory: ${cat.category}`);
      if (Array.isArray(cat.questions)) {
        cat.questions.forEach(q => {
          if (q.question) lines.push(`Q: ${q.question}`);
          if (q.answer) lines.push(`A: ${q.answer}`);
        });
      }
    });
  }

  if (Array.isArray(content.httpStatusCodes) && content.httpStatusCodes.length > 0) {
    lines.push('\nHTTP Status Codes:');
    content.httpStatusCodes.forEach(h => {
      if (h.status || h.meaning) lines.push(`- ${h.status}: ${h.meaning}`);
    });
  }

  if (content.apiRequestResponses) {
    lines.push(`\nAPI Request / Response Examples:\n${content.apiRequestResponses}`);
  }

  return lines.join('\n');
};

/**
 * Uploads text content to the Botpress Files API and indexes it for RAG.
 *
 * uploadFile() only creates a signed S3 URL – we must PUT the content
 * to that URL ourselves to complete the upload.
 *
 * @param {object} opts
 * @param {string} opts.key        - Unique file key, e.g. "kb-<tenantId>/<pageId>.txt"
 * @param {string} opts.content    - Plain-text string to upload
 * @param {string} opts.title      - Human-readable title (stored as a tag)
 * @param {string} opts.kbId       - Knowledge-base identifier (stored as a tag)
 */
const uploadKbFile = async ({ key, content, title, kbId }) => {
  const client = getBotpressClient();

  // Step 1 – register the file and get a pre-signed S3 upload URL
  const { file } = await client.uploadFile({
    key,
    accessPolicies: [],
    content,           // Botpress uses this only for size/type detection on some SDK versions
    index: true,
    tags: {
      source: 'knowledge-base',
      kbId,
      title
    }
  });

  // Step 2 – PUT the actual content to S3 using the signed URL
  const res = await fetch(file.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    body: content
  });

  if (!res.ok) {
    throw new Error(`S3 upload failed: ${res.status} ${res.statusText}`);
  }

  return file;
};

module.exports = { getBotpressClient, uploadKbFile, kbContentToText };
