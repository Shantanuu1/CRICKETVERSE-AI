const express = require('express');
const router = express.Router();
const orchestratorAdapter = require('../ai/OrchestratorAdapter');

router.post('/analyze', async (req, res) => {
  const { match_data, user_query } = req.body;
  if (!match_data) {
    return res.status(400).json({ error: 'Missing match_data payload' });
  }
  const result = await orchestratorAdapter.analyzeMatch(match_data, user_query);
  res.json(result);
});

router.post('/chat', async (req, res) => {
  const { message, match_data } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Missing message in request' });
  }
  const result = await orchestratorAdapter.chatCoach(message, match_data);
  res.json(result);
});

module.exports = router;
