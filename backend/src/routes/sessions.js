const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');

// GET /api/sessions/preferences
router.get('/preferences', async (req, res) => {
  try {
    if (!req.sessionId) {
      return res.status(400).json({ error: 'No session found' });
    }

    const preferences = await sessionService.getUserPreferences(req.sessionId);
    
    if (!preferences) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ 
      error: 'Failed to get user preferences',
      message: error.message 
    });
  }
});

// GET /api/sessions/history
router.get('/history', async (req, res) => {
  try {
    if (!req.sessionId) {
      return res.status(400).json({ error: 'No session found' });
    }

    const session = await sessionService.getSession(req.sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      searchHistory: session.searchHistory,
      stats: session.stats
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ 
      error: 'Failed to get search history',
      message: error.message 
    });
  }
});

// GET /api/sessions/recommendations
router.get('/recommendations', async (req, res) => {
  try {
    if (!req.sessionId) {
      return res.status(400).json({ error: 'No session found' });
    }

    const { category } = req.query;
    const recommendations = await sessionService.getPersonalizedRecommendations(req.sessionId, category);

    res.json({
      success: true,
      recommendations,
      count: recommendations.length,
      category: category || 'all'
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ 
      error: 'Failed to get personalized recommendations',
      message: error.message 
    });
  }
});

// POST /api/sessions/preferences
router.post('/preferences', async (req, res) => {
  try {
    if (!req.sessionId) {
      return res.status(400).json({ error: 'No session found' });
    }

    const { preferences } = req.body;
    
    if (!preferences) {
      return res.status(400).json({ error: 'Preferences data is required' });
    }

    const updatedSession = await sessionService.updateSession(req.sessionId, {
      preferences: {
        ...req.session.preferences,
        ...preferences
      }
    });

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updatedSession.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ 
      error: 'Failed to update preferences',
      message: error.message 
    });
  }
});

// GET /api/sessions/stats
router.get('/stats', async (req, res) => {
  try {
    if (!req.sessionId) {
      return res.status(400).json({ error: 'No session found' });
    }

    const session = await sessionService.getSession(req.sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Calculate additional insights
    const insights = {
      sessionAge: Date.now() - session.createdAt,
      sessionAgeHours: Math.round((Date.now() - session.createdAt) / (1000 * 60 * 60) * 10) / 10,
      averageSearchesPerHour: session.stats.totalSearches / Math.max(1, (Date.now() - session.createdAt) / (1000 * 60 * 60)),
      topCategory: Object.entries(session.stats.favoriteCategories)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none',
      searchEfficiency: session.stats.totalMatches / Math.max(1, session.stats.totalSearches)
    };

    res.json({
      success: true,
      sessionId: req.sessionId,
      stats: session.stats,
      insights,
      preferences: session.preferences
    });
  } catch (error) {
    console.error('Get session stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get session statistics',
      message: error.message 
    });
  }
});

module.exports = router;