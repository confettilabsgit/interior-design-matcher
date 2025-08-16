const express = require('express');
const router = express.Router();
const matchingService = require('../services/matchingService');
const sessionService = require('../services/sessionService');

// POST /api/matching/find-matches
router.post('/find-matches', async (req, res) => {
  try {
    const { selectedItem, filters } = req.body;
    
    if (!selectedItem || !selectedItem.id) {
      return res.status(400).json({ error: 'Selected item is required' });
    }

    const matches = await matchingService.findMatches(selectedItem, filters);
    
    // Track matching in user session if available
    if (req.sessionId) {
      try {
        await sessionService.addMatchingToHistory(req.sessionId, selectedItem, matches);
      } catch (error) {
        console.error('Failed to track matching in session:', error.message);
      }
    }
    
    res.json({
      success: true,
      selectedItem,
      matches,
      count: matches.length,
      sessionId: req.sessionId
    });
  } catch (error) {
    console.error('Matching error:', error);
    res.status(500).json({ 
      error: 'Failed to find matching items',
      message: error.message 
    });
  }
});

module.exports = router;