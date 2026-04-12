'use strict';

// Load .env from repo root so ANTHROPIC_API_KEY is available
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const aiRouter = require('./api/ai');

const app = express();
app.use(express.json({ limit: '256kb' }));

app.use('/api/ai', aiRouter);

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = parseInt(process.env.AI_SERVER_PORT || '3001', 10);
app.listen(PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`NEXUS AI server running on http://127.0.0.1:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    // eslint-disable-next-line no-console
    console.warn('WARNING: ANTHROPIC_API_KEY is not set. AI endpoints will fail.');
  }
});
