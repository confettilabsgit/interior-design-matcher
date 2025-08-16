const express = require('express');
const router = express.Router();
const searchService = require('../services/searchService');
const sessionService = require('../services/sessionService');

// POST /api/search
router.post('/', async (req, res) => {
  try {
    const { query, filters } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = await searchService.searchItems(query, filters);
    
    // Track search in user session if available
    if (req.sessionId) {
      try {
        await sessionService.addSearchToHistory(req.sessionId, query, filters, results);
      } catch (error) {
        console.error('Failed to track search in session:', error.message);
      }
    }
    
    res.json({
      success: true,
      query,
      filters: filters || {},
      results,
      count: results.length,
      sessionId: req.sessionId
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Failed to search items',
      message: error.message 
    });
  }
});

// GET /api/search/sources
router.get('/sources', (req, res) => {
  res.json({
    sources: [
      { id: 'facebook', name: 'Facebook Marketplace', enabled: true },
      { id: 'westelm', name: 'West Elm', enabled: true },
      { id: 'cb2', name: 'CB2', enabled: true }
    ]
  });
});

module.exports = router;