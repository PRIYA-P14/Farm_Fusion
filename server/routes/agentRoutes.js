const express = require('express');
const router = express.Router();
const { getAgentContext } = require('../controllers/soilController');

// Inter-agent communication endpoint
router.get('/soil-context/:id', getAgentContext);

// Health check for agent registry
router.get('/health', (req, res) => {
  res.json({
    agent: 'Soil Intelligence Agent',
    version: '1.0.0',
    status: 'active',
    capabilities: ['soil-analysis', 'crop-recommendation', 'fertilizer-recommendation', 'yield-prediction'],
    connectedAgents: [],
    timestamp: new Date().toISOString()
  });
});

// Government agent health
router.get('/government/health', (req, res) => {
  res.json({ status: 'ok', agent: 'Government Scheme Agent', schemes_loaded: 12 });
});

module.exports = router;
