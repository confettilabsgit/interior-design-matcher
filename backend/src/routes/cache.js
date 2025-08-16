const express = require('express');
const router = express.Router();
const cacheService = require('../services/cacheService');

// GET /api/cache/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await cacheService.getCacheStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get cache stats',
      message: error.message 
    });
  }
});

// POST /api/cache/clear
router.post('/clear', async (req, res) => {
  try {
    await cacheService.clearAll();
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({ 
      error: 'Failed to clear cache',
      message: error.message 
    });
  }
});

// POST /api/cache/clear-expired
router.post('/clear-expired', async (req, res) => {
  try {
    await cacheService.clearExpired();
    res.json({
      success: true,
      message: 'Expired cache entries cleared'
    });
  } catch (error) {
    console.error('Cache clear expired error:', error);
    res.status(500).json({ 
      error: 'Failed to clear expired cache',
      message: error.message 
    });
  }
});

// DELETE /api/cache/:source/:query
router.delete('/:source/:query', async (req, res) => {
  try {
    const { source, query } = req.params;
    await cacheService.invalidate(source, query);
    res.json({
      success: true,
      message: `Cache invalidated for ${source}:${query}`
    });
  } catch (error) {
    console.error('Cache invalidate error:', error);
    res.status(500).json({ 
      error: 'Failed to invalidate cache',
      message: error.message 
    });
  }
});

module.exports = router;