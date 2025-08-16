const express = require('express');
const router = express.Router();
const imageProcessingService = require('../services/imageProcessingService');

// POST /api/image-processing/analyze
router.post('/analyze', async (req, res) => {
  try {
    const { imageUrl, productId } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    console.log(`Processing image: ${imageUrl}`);
    
    const result = await imageProcessingService.processProductImage(
      imageUrl, 
      productId || 'test_' + Date.now()
    );
    
    if (!result) {
      return res.status(400).json({ error: 'Failed to process image' });
    }

    res.json({
      success: true,
      imageUrl,
      analysis: result
    });
    
  } catch (error) {
    console.error('Image processing API error:', error);
    res.status(500).json({ 
      error: 'Failed to process image',
      message: error.message 
    });
  }
});

// POST /api/image-processing/extract-colors
router.post('/extract-colors', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const imageBuffer = await imageProcessingService.downloadImage(imageUrl);
    if (!imageBuffer) {
      return res.status(400).json({ error: 'Failed to download image' });
    }
    
    const colors = await imageProcessingService.extractColors(imageBuffer);
    
    res.json({
      success: true,
      imageUrl,
      colors
    });
    
  } catch (error) {
    console.error('Color extraction API error:', error);
    res.status(500).json({ 
      error: 'Failed to extract colors',
      message: error.message 
    });
  }
});

module.exports = router;