const express = require('express');
const router = express.Router();
const orchestratorAdapter = require('../ai/OrchestratorAdapter');

// Commentary history buffer
const commentaryHistory = [];

router.post('/', async (req, res) => {
  const { event_type, runs = 0, shot_type = 'SHOT', context = null } = req.body;
  const result = await orchestratorAdapter.generateCommentary(event_type, runs, shot_type, context);

  commentaryHistory.unshift({
    ...result,
    timestamp: Date.now()
  });

  // Keep last 50
  if (commentaryHistory.length > 50) {
    commentaryHistory.pop();
  }

  res.json(result);
});

router.get('/history', (req, res) => {
  res.json({
    history: commentaryHistory
  });
});

module.exports = router;
