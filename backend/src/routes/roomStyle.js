const express = require('express');
const router = express.Router();
const roomStyleService = require('../services/roomStyleService');
const databaseService = require('../services/databaseService');

// POST /api/room-style/analyze
router.post('/analyze', async (req, res) => {
  try {
    const { items, roomType } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const analysis = roomStyleService.analyzeRoomStyle(items);
    
    res.json({
      success: true,
      roomType: roomType || 'unknown',
      analysis,
      itemCount: items.length
    });
  } catch (error) {
    console.error('Room style analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze room style',
      message: error.message 
    });
  }
});

// GET /api/room-style/suggestions/:roomType
router.get('/suggestions/:roomType', async (req, res) => {
  try {
    const { roomType } = req.params;
    const { includeCurrentItems } = req.query;
    
    let currentItems = [];
    
    // If requested, get current items from user's session
    if (includeCurrentItems === 'true' && req.sessionId) {
      try {
        const products = await databaseService.getProducts({ source: 'user_room' });
        currentItems = products.slice(0, 10); // Limit for performance
      } catch (error) {
        console.log('Could not load current items:', error.message);
      }
    }

    const suggestions = roomStyleService.getRoomStyleSuggestions(roomType, currentItems);
    
    res.json({
      success: true,
      roomType,
      suggestions,
      currentItemsAnalyzed: currentItems.length
    });
  } catch (error) {
    console.error('Style suggestions error:', error);
    res.status(500).json({ 
      error: 'Failed to get style suggestions',
      message: error.message 
    });
  }
});

// POST /api/room-style/compatibility
router.post('/compatibility', async (req, res) => {
  try {
    const { item1, item2 } = req.body;
    
    if (!item1 || !item2) {
      return res.status(400).json({ error: 'Two items are required for compatibility analysis' });
    }

    // Analyze individual items
    const item1Analysis = roomStyleService.analyzeItemStyle(item1);
    const item2Analysis = roomStyleService.analyzeItemStyle(item2);
    
    // Calculate compatibility between dominant styles
    const compatibility = roomStyleService.calculateStyleCompatibility(
      item1Analysis.dominantStyle,
      item2Analysis.dominantStyle
    );

    // Calculate color compatibility
    const colorCompatibility = item1.colors && item2.colors ? 
      require('../services/colorMatchingService').calculateColorCompatibility(item1.colors, item2.colors) : 0;

    const overallCompatibility = (compatibility * 0.7 + colorCompatibility * 0.3);

    res.json({
      success: true,
      compatibility: {
        overall: Math.round(overallCompatibility * 100) / 100,
        style: Math.round(compatibility * 100) / 100,
        color: Math.round(colorCompatibility * 100) / 100
      },
      analysis: {
        item1: {
          dominantStyle: item1Analysis.dominantStyle,
          confidence: Math.round(item1Analysis.confidence * 100) / 100,
          styleScores: item1Analysis.styleScores
        },
        item2: {
          dominantStyle: item2Analysis.dominantStyle,
          confidence: Math.round(item2Analysis.confidence * 100) / 100,
          styleScores: item2Analysis.styleScores
        }
      },
      recommendation: getCompatibilityRecommendation(overallCompatibility)
    });
  } catch (error) {
    console.error('Compatibility analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze compatibility',
      message: error.message 
    });
  }
});

// GET /api/room-style/palettes/:style
router.get('/palettes/:style', async (req, res) => {
  try {
    const { style } = req.params;
    const { roomType } = req.query;
    
    const colorMatchingService = require('../services/colorMatchingService');
    
    // Get style definition
    const styleDefinitions = roomStyleService.styleDefinitions;
    const styleDefinition = styleDefinitions[style];
    
    if (!styleDefinition) {
      return res.status(404).json({ error: 'Style not found' });
    }

    // Generate room-specific color palette
    const primaryColor = styleDefinition.colors[0];
    const roomPalette = colorMatchingService.getRoomColorPalette(primaryColor, roomType || 'living');
    
    res.json({
      success: true,
      style,
      roomType: roomType || 'living',
      palette: {
        primary: styleDefinition.colors,
        accent: roomPalette.accent,
        neutral: roomPalette.neutral,
        secondary: roomPalette.secondary
      },
      styleInfo: {
        characteristics: styleDefinition.characteristics,
        materials: styleDefinition.materials,
        priceRange: styleDefinition.priceRange,
        description: roomStyleService.getStyleDescription(style)
      }
    });
  } catch (error) {
    console.error('Color palette error:', error);
    res.status(500).json({ 
      error: 'Failed to generate color palette',
      message: error.message 
    });
  }
});

// Helper function for compatibility recommendations
function getCompatibilityRecommendation(score) {
  if (score >= 0.8) {
    return {
      level: 'Excellent',
      message: 'These items work beautifully together and will create a cohesive, harmonious space.',
      tips: ['Consider adding similar items to maintain the cohesive look', 'These pieces can anchor your room design']
    };
  } else if (score >= 0.6) {
    return {
      level: 'Good', 
      message: 'These items complement each other well with some minor style differences.',
      tips: ['Add transitional pieces to bridge any style gaps', 'Consider coordinating accessories']
    };
  } else if (score >= 0.4) {
    return {
      level: 'Fair',
      message: 'These items can work together but may need additional coordination.',
      tips: ['Use neutral accessories to tie the styles together', 'Consider adjusting color schemes for better harmony']
    };
  } else {
    return {
      level: 'Poor',
      message: 'These items have conflicting styles and may clash in the same space.',
      tips: ['Consider choosing items with more similar style characteristics', 'Use one as a statement piece and coordinate others around it']
    };
  }
}

module.exports = router;