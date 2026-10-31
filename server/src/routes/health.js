const express = require('express');
const router = express.Router();
const providerManager = require('../ai/ProviderManager');

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CricketVerse AI Match Server',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

router.get('/ollama/status', async (req, res) => {
  const status = await providerManager.checkStatus();
  res.json(status);
});

module.exports = router;
