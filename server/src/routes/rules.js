const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const orchestratorAdapter = require('../ai/OrchestratorAdapter');

const rulesPath = path.resolve(__dirname, '../../../data/rules/processed/cricket_rules.json');

router.post('/ask', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Missing question in request body' });
  }
  const result = await orchestratorAdapter.askRules(question);
  res.json(result);
});

router.get('/all', (req, res) => {
  try {
    if (fs.existsSync(rulesPath)) {
      const data = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
      return res.json(data);
    }
  } catch (err) {
    // ignore
  }
  res.json({ rules: [] });
});

module.exports = router;
