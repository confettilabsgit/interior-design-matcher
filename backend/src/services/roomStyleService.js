const colorMatchingService = require('./colorMatchingService');

class RoomStyleService {
  constructor() {
    // Define style characteristics and compatibility rules
    this.styleDefinitions = {
      modern: {
        colors: ['#FFFFFF', '#000000', '#808080', '#C0C0C0'],
        materials: ['glass', 'metal', 'leather', 'concrete'],
        characteristics: ['clean lines', 'minimal', 'geometric', 'sleek'],
        priceRange: { min: 300, max: 2000 },
        compatibility: ['minimalist', 'industrial', 'scandinavian'],
        opposites: ['traditional', 'rustic', 'vintage']
      },
      minimalist: {
        colors: ['#FFFFFF', '#F5F5F5', '#E8E8E8', '#CCCCCC'],
        materials: ['wood', 'glass', 'steel', 'ceramic'],
        characteristics: ['simple', 'functional', 'uncluttered', 'serene'],
        priceRange: { min: 200, max: 1500 },
        compatibility: ['modern', 'scandinavian', 'japanese'],
        opposites: ['maximalist', 'baroque', 'ornate']
      },
      rustic: {
        colors: ['#8B4513', '#DEB887', '#D2B48C', '#CD853F'],
        materials: ['reclaimed wood', 'iron', 'stone', 'leather'],
        characteristics: ['weathered', 'natural', 'handcrafted', 'cozy'],
        priceRange: { min: 150, max: 1200 },
        compatibility: ['industrial', 'farmhouse', 'traditional'],
        opposites: ['modern', 'minimalist', 'futuristic']
      },
      industrial: {
        colors: ['#2F2F2F', '#4A4A4A', '#C0C0C0', '#8B4513'],
        materials: ['metal', 'exposed brick', 'concrete', 'reclaimed wood'],
        characteristics: ['raw', 'utilitarian', 'exposed', 'urban'],
        priceRange: { min: 250, max: 1800 },
        compatibility: ['modern', 'rustic', 'loft'],
        opposites: ['traditional', 'romantic', 'ornate']
      },
      traditional: {
        colors: ['#8B0000', '#DAA520', '#228B22', '#4B0082'],
        materials: ['mahogany', 'cherry wood', 'brass', 'velvet'],
        characteristics: ['elegant', 'formal', 'symmetric', 'classic'],
        priceRange: { min: 400, max: 3000 },
        compatibility: ['transitional', 'classic', 'formal'],
        opposites: ['modern', 'industrial', 'minimalist']
      },
      scandinavian: {
        colors: ['#FFFFFF', '#F0F0F0', '#8FBC8F', '#DDA0DD'],
        materials: ['light wood', 'wool', 'linen', 'ceramic'],
        characteristics: ['hygge', 'functional', 'light', 'cozy'],
        priceRange: { min: 200, max: 1000 },
        compatibility: ['minimalist', 'modern', 'nordic'],
        opposites: ['baroque', 'gothic', 'heavy']
      },
      bohemian: {
        colors: ['#FF69B4', '#FFD700', '#32CD32', '#FF4500'],
        materials: ['textiles', 'rattan', 'macrame', 'brass'],
        characteristics: ['eclectic', 'layered', 'artistic', 'free-spirited'],
        priceRange: { min: 100, max: 800 },
        compatibility: ['eclectic', 'artistic', 'global'],
        opposites: ['minimalist', 'modern', 'formal']
      },
      mediterranean: {
        colors: ['#4682B4', '#F0E68C', '#CD853F', '#FF6347'],
        materials: ['terracotta', 'wrought iron', 'ceramic', 'stone'],
        characteristics: ['warm', 'textured', 'coastal', 'earthy'],
        priceRange: { min: 300, max: 1500 },
        compatibility: ['coastal', 'rustic', 'southwestern'],
        opposites: ['industrial', 'modern', 'minimalist']
      }
    };

    this.roomTypeStyles = {
      living: ['modern', 'traditional', 'scandinavian', 'industrial'],
      bedroom: ['scandinavian', 'minimalist', 'bohemian', 'traditional'],
      kitchen: ['modern', 'industrial', 'traditional', 'mediterranean'],
      dining: ['traditional', 'modern', 'industrial', 'mediterranean'],
      office: ['modern', 'minimalist', 'industrial', 'scandinavian'],
      bathroom: ['modern', 'scandinavian', 'mediterranean', 'minimalist']
    };
  }

  // Analyze a collection of items to determine the dominant room style
  analyzeRoomStyle(items) {
    if (!items || items.length === 0) {
      return { style: 'unknown', confidence: 0, analysis: {} };
    }

    const styleScores = {};
    let totalAnalyzed = 0;

    // Initialize style scores
    Object.keys(this.styleDefinitions).forEach(style => {
      styleScores[style] = 0;
    });

    // Analyze each item
    for (const item of items) {
      const itemStyleAnalysis = this.analyzeItemStyle(item);
      
      if (itemStyleAnalysis.confidence > 0.3) {
        Object.entries(itemStyleAnalysis.styleScores).forEach(([style, score]) => {
          styleScores[style] += score * itemStyleAnalysis.confidence;
        });
        totalAnalyzed++;
      }
    }

    // Normalize scores
    if (totalAnalyzed > 0) {
      Object.keys(styleScores).forEach(style => {
        styleScores[style] /= totalAnalyzed;
      });
    }

    // Find dominant style
    const dominantStyle = Object.entries(styleScores)
      .sort(([,a], [,b]) => b - a)[0];

    const confidence = dominantStyle ? dominantStyle[1] : 0;
    const style = dominantStyle ? dominantStyle[0] : 'mixed';

    return {
      style,
      confidence,
      styleScores,
      analysis: {
        itemsAnalyzed: totalAnalyzed,
        totalItems: items.length,
        recommendedStyles: this.getRecommendedStyles(styleScores),
        colorPalette: this.extractColorPalette(items),
        priceRange: this.analyzePriceRange(items)
      }
    };
  }

  // Analyze individual item to determine its style characteristics
  analyzeItemStyle(item) {
    const styleScores = {};
    let confidence = 0;

    // Initialize scores
    Object.keys(this.styleDefinitions).forEach(style => {
      styleScores[style] = 0;
    });

    // Analyze explicit style if provided
    if (item.style && this.styleDefinitions[item.style]) {
      styleScores[item.style] += 0.5;
      confidence += 0.3;
    }

    // Analyze colors
    if (item.colors && Array.isArray(item.colors)) {
      const colorAnalysis = this.analyzeItemColors(item.colors);
      Object.entries(colorAnalysis).forEach(([style, score]) => {
        styleScores[style] += score * 0.3;
      });
      confidence += 0.2;
    }

    // Analyze price
    if (item.price) {
      const priceAnalysis = this.analyzeItemPrice(item.price);
      Object.entries(priceAnalysis).forEach(([style, score]) => {
        styleScores[style] += score * 0.1;
      });
      confidence += 0.1;
    }

    // Analyze title/description for style keywords
    const textAnalysis = this.analyzeItemText(item.title, item.description);
    Object.entries(textAnalysis).forEach(([style, score]) => {
      styleScores[style] += score * 0.2;
    });
    confidence += 0.15;

    // Analyze category patterns
    const categoryAnalysis = this.analyzeItemCategory(item.category);
    Object.entries(categoryAnalysis).forEach(([style, score]) => {
      styleScores[style] += score * 0.1;
    });
    confidence += 0.05;

    return {
      styleScores,
      confidence: Math.min(1, confidence),
      dominantStyle: Object.entries(styleScores)
        .sort(([,a], [,b]) => b - a)[0]?.[0]
    };
  }

  analyzeItemColors(colors) {
    const styleScores = {};
    
    Object.keys(this.styleDefinitions).forEach(style => {
      styleScores[style] = 0;
    });

    for (const color of colors) {
      Object.entries(this.styleDefinitions).forEach(([style, definition]) => {
        for (const styleColor of definition.colors) {
          const distance = colorMatchingService.calculateColorDistance(color, styleColor);
          if (distance < 100) { // Similar colors
            styleScores[style] += (100 - distance) / 100;
          }
        }
      });
    }

    // Normalize scores
    const maxScore = Math.max(...Object.values(styleScores));
    if (maxScore > 0) {
      Object.keys(styleScores).forEach(style => {
        styleScores[style] /= maxScore;
      });
    }

    return styleScores;
  }

  analyzeItemPrice(price) {
    const styleScores = {};
    
    Object.entries(this.styleDefinitions).forEach(([style, definition]) => {
      const { min, max } = definition.priceRange;
      
      if (price >= min && price <= max) {
        // Price fits perfectly in range
        styleScores[style] = 1.0;
      } else if (price < min) {
        // Below range - partial score
        styleScores[style] = price / min * 0.7;
      } else {
        // Above range - partial score with diminishing returns
        styleScores[style] = Math.max(0, 1 - (price - max) / max * 0.5);
      }
    });

    return styleScores;
  }

  analyzeItemText(title = '', description = '') {
    const text = `${title} ${description}`.toLowerCase();
    const styleScores = {};

    Object.entries(this.styleDefinitions).forEach(([style, definition]) => {
      let score = 0;
      
      // Check for style name
      if (text.includes(style)) {
        score += 0.5;
      }

      // Check for characteristics
      for (const characteristic of definition.characteristics) {
        if (text.includes(characteristic)) {
          score += 0.2;
        }
      }

      // Check for materials
      for (const material of definition.materials) {
        if (text.includes(material)) {
          score += 0.3;
        }
      }

      styleScores[style] = Math.min(1, score);
    });

    return styleScores;
  }

  analyzeItemCategory(category) {
    const styleScores = {};
    
    // Some categories are more associated with certain styles
    const categoryStyleAssociations = {
      'sofa': { modern: 0.8, minimalist: 0.7, traditional: 0.9 },
      'chair': { modern: 0.7, industrial: 0.8, traditional: 0.8 },
      'table': { modern: 0.9, rustic: 0.8, industrial: 0.7 },
      'lamp': { modern: 0.8, industrial: 0.9, scandinavian: 0.7 },
      'rug': { bohemian: 0.9, traditional: 0.8, scandinavian: 0.7 },
      'bed': { minimalist: 0.8, scandinavian: 0.9, traditional: 0.7 }
    };

    const associations = categoryStyleAssociations[category] || {};
    
    Object.keys(this.styleDefinitions).forEach(style => {
      styleScores[style] = associations[style] || 0.5;
    });

    return styleScores;
  }

  getRecommendedStyles(styleScores) {
    return Object.entries(styleScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([style, score]) => ({ style, score: Math.round(score * 100) / 100 }));
  }

  extractColorPalette(items) {
    const allColors = [];
    
    for (const item of items) {
      if (item.colors && Array.isArray(item.colors)) {
        allColors.push(...item.colors);
      }
    }

    // Remove duplicates and return most common colors
    const colorCounts = {};
    allColors.forEach(color => {
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    });

    return Object.entries(colorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([color]) => color);
  }

  analyzePriceRange(items) {
    const prices = items.filter(item => item.price > 0).map(item => item.price);
    
    if (prices.length === 0) return { min: 0, max: 0, average: 0 };

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    };
  }

  // Calculate compatibility between two styles
  calculateStyleCompatibility(style1, style2) {
    if (style1 === style2) return 1.0;

    const def1 = this.styleDefinitions[style1];
    const def2 = this.styleDefinitions[style2];

    if (!def1 || !def2) return 0.5;

    // Check if styles are explicitly compatible
    if (def1.compatibility.includes(style2)) return 0.8;
    if (def1.opposites.includes(style2)) return 0.2;

    // Calculate color compatibility
    const colorCompatibility = colorMatchingService.calculateColorCompatibility(
      def1.colors, def2.colors
    );

    // Calculate price range overlap
    const priceOverlap = this.calculatePriceRangeOverlap(def1.priceRange, def2.priceRange);

    return (colorCompatibility * 0.6 + priceOverlap * 0.4);
  }

  calculatePriceRangeOverlap(range1, range2) {
    const overlapMin = Math.max(range1.min, range2.min);
    const overlapMax = Math.min(range1.max, range2.max);
    
    if (overlapMin > overlapMax) return 0; // No overlap

    const overlapSize = overlapMax - overlapMin;
    const totalRange = Math.max(range1.max, range2.max) - Math.min(range1.min, range2.min);
    
    return overlapSize / totalRange;
  }

  // Get style suggestions for a room type
  getRoomStyleSuggestions(roomType, currentItems = []) {
    const roomStyles = this.roomTypeStyles[roomType] || this.roomTypeStyles.living;
    const currentStyle = currentItems.length > 0 ? 
      this.analyzeRoomStyle(currentItems) : null;

    const suggestions = roomStyles.map(style => {
      const definition = this.styleDefinitions[style];
      let score = 0.5; // Base score

      // Boost score if compatible with current style
      if (currentStyle && currentStyle.style !== 'unknown') {
        score += this.calculateStyleCompatibility(currentStyle.style, style) * 0.5;
      }

      return {
        style,
        score,
        definition: {
          colors: definition.colors.slice(0, 4),
          characteristics: definition.characteristics.slice(0, 3),
          priceRange: definition.priceRange,
          description: this.getStyleDescription(style)
        }
      };
    });

    return suggestions.sort((a, b) => b.score - a.score);
  }

  getStyleDescription(style) {
    const descriptions = {
      modern: 'Clean lines, minimal ornamentation, and a focus on function over form.',
      minimalist: 'Less is more - emphasizing simplicity, functionality, and open space.',
      rustic: 'Natural materials, weathered textures, and a cozy, lived-in feel.',
      industrial: 'Raw materials like metal and concrete with an urban, warehouse aesthetic.',
      traditional: 'Classic elegance with rich materials, formal symmetry, and timeless appeal.',
      scandinavian: 'Light woods, neutral colors, and hygge-inspired coziness.',
      bohemian: 'Eclectic mix of colors, patterns, and global influences for a free-spirited vibe.',
      mediterranean: 'Warm earth tones, natural textures, and coastal-inspired elements.'
    };

    return descriptions[style] || 'A distinctive style with its own unique characteristics.';
  }
}

module.exports = new RoomStyleService();