const colorMatchingService = require('./colorMatchingService');

class MatchingService {
  constructor() {
    // Weight factors for different matching criteria
    this.weights = {
      style: 0.3,
      color: 0.25,
      category: 0.2,
      price: 0.15,
      size: 0.1
    };
  }

  async findMatches(selectedItem, filters = {}) {
    try {
      console.log(`Finding matches for item: ${selectedItem.title || selectedItem.id}`);
      
      // Generate complementary items based on the selected item's category
      const complementaryItems = this.generateComplementaryItems(selectedItem);
      
      // Apply advanced color matching if the item has colors
      if (selectedItem.colors && selectedItem.colors.length > 0) {
        const colorMatchedItems = colorMatchingService.findColorMatches(
          selectedItem.colors,
          complementaryItems,
          {
            harmonyType: 'complementary',
            includeNeutrals: true,
            roomType: this.detectRoomType(selectedItem.category)
          }
        );
        
        console.log(`Applied advanced color matching to ${colorMatchedItems.length} items`);
        return colorMatchedItems;
      }
      
      // Fallback to basic matching
      const basicMatches = this.getMockMatches(selectedItem, filters);
      console.log(`Generated ${basicMatches.length} complementary items`);
      return basicMatches;
      
    } catch (error) {
      console.error('Matching service error:', error);
      throw new Error('Failed to find matching items');
    }
  }

  getMockMatches(selectedItem, filters) {
    // Generate room-completing complementary items based on selected item
    const potentialMatches = this.generateComplementaryItems(selectedItem);

    // Calculate match scores and add them to items
    const matchedItems = potentialMatches.map(item => {
      const matchScore = this.calculateMatchScore(selectedItem, item);
      return {
        ...item,
        matchScore
      };
    });

    // Sort by overall match score (highest first)
    matchedItems.sort((a, b) => b.matchScore.overall - a.matchScore.overall);

    return matchedItems;
  }

  generateComplementaryItems(selectedItem) {
    const complementaryItems = [];
    const baseStyle = selectedItem.style || 'modern';
    const baseColors = selectedItem.colors || ['#808080', '#C0C0C0'];
    
    // Coffee table selected -> show sofas, rugs, lighting, chairs, side tables, curtains
    if (selectedItem.category === 'table') {
      complementaryItems.push(
        {
          id: 'comp_sofa_1',
          title: 'Modern Sectional Sofa',
          price: 1299,
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop&auto=format',
          description: 'Comfortable sectional sofa that complements your coffee table',
          category: 'sofa',
          style: baseStyle,
          colors: baseColors,
          source: 'westelm',
          url: 'https://westelm.com/sectional-sofa-complement',
          dimensions: { width: 84, height: 36, depth: 60 }
        },
        {
          id: 'comp_rug_1',
          title: 'Area Rug - Geometric Pattern',
          price: 299,
          imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop&auto=format',
          description: 'Geometric area rug that ties the room together',
          category: 'rug',
          style: baseStyle,
          colors: baseColors,
          source: 'cb2',
          url: 'https://cb2.com/geometric-area-rug',
          dimensions: { width: 96, height: 1, depth: 60 }
        },
        {
          id: 'comp_lamp_1',
          title: 'Floor Lamp - Arc Design',
          price: 399,
          imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&auto=format',
          description: 'Modern arc floor lamp for ambient lighting',
          category: 'lamp',
          style: baseStyle,
          colors: ['#C0C0C0', '#333333'],
          source: 'westelm',
          url: 'https://westelm.com/arc-floor-lamp'
        },
        {
          id: 'comp_chair_1',
          title: 'Accent Chair - Velvet',
          price: 599,
          imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop&auto=format',
          description: 'Plush velvet accent chair for extra seating',
          category: 'chair',
          style: baseStyle,
          colors: baseColors,
          source: 'cb2',
          url: 'https://cb2.com/velvet-accent-chair-match',
          dimensions: { width: 32, height: 34, depth: 30 }
        },
        {
          id: 'comp_table_1',
          title: 'Side Table - Matching Set',
          price: 249,
          imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop&auto=format',
          description: 'Side table that perfectly matches your coffee table',
          category: 'side_table',
          style: baseStyle,
          colors: baseColors,
          source: 'facebook',
          url: 'https://facebook.com/marketplace/side-table-match',
          location: 'San Francisco, CA',
          dimensions: { width: 20, height: 24, depth: 20 }
        },
        {
          id: 'comp_curtains_1',
          title: 'Window Curtains - Linen',
          price: 89,
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=300&fit=crop&auto=format',
          description: 'Natural linen curtains to complete the room',
          category: 'curtains',
          style: baseStyle,
          colors: ['#F5F5DC', '#E6E6FA'],
          source: 'westelm',
          url: 'https://westelm.com/linen-curtains'
        }
      );
    }
    
    // Sofa selected -> show coffee tables, side tables, rugs, lighting, throw pillows
    else if (selectedItem.category === 'sofa') {
      complementaryItems.push(
        {
          id: 'comp_coffee_1',
          title: 'Coffee Table - Glass Top',
          price: 449,
          imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop&auto=format',
          description: 'Glass coffee table that complements your sofa',
          category: 'table',
          style: baseStyle,
          colors: ['#FFFFFF', '#C0C0C0'],
          source: 'westelm',
          url: 'https://westelm.com/glass-coffee-table',
          dimensions: { width: 48, height: 18, depth: 24 }
        },
        {
          id: 'comp_rug_2',
          title: 'Living Room Rug',
          price: 399,
          imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop&auto=format',
          description: 'Soft area rug to anchor your seating area',
          category: 'rug',
          style: baseStyle,
          colors: baseColors,
          source: 'cb2',
          url: 'https://cb2.com/living-room-rug',
          dimensions: { width: 108, height: 1, depth: 72 }
        },
        {
          id: 'comp_lamp_2',
          title: 'Table Lamp Pair',
          price: 199,
          imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&auto=format',
          description: 'Matching table lamps for side tables',
          category: 'lamp',
          style: baseStyle,
          colors: ['#8B4513', '#D2B48C'],
          source: 'westelm',
          url: 'https://westelm.com/table-lamp-pair'
        },
        {
          id: 'comp_pillows_1',
          title: 'Throw Pillow Set',
          price: 79,
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=300&fit=crop&auto=format',
          description: 'Coordinating throw pillows for your sofa',
          category: 'decor',
          style: baseStyle,
          colors: baseColors,
          source: 'cb2',
          url: 'https://cb2.com/throw-pillow-set'
        }
      );
    }
    
    // Chair selected -> show tables, lighting, rugs, decor
    else if (selectedItem.category === 'chair') {
      complementaryItems.push(
        {
          id: 'comp_side_table_1',
          title: 'Side Table - Round',
          price: 199,
          imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop&auto=format',
          description: 'Round side table perfect next to your chair',
          category: 'table',
          style: baseStyle,
          colors: baseColors,
          source: 'facebook',
          url: 'https://facebook.com/marketplace/round-side-table',
          location: 'Oakland, CA',
          dimensions: { width: 20, height: 24, depth: 20 }
        },
        {
          id: 'comp_reading_lamp_1',
          title: 'Reading Floor Lamp',
          price: 299,
          imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&auto=format',
          description: 'Adjustable reading lamp for your chair area',
          category: 'lamp',
          style: baseStyle,
          colors: ['#000000', '#C0C0C0'],
          source: 'westelm',
          url: 'https://westelm.com/reading-floor-lamp'
        },
        {
          id: 'comp_small_rug_1',
          title: 'Accent Rug',
          price: 149,
          imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop&auto=format',
          description: 'Small accent rug to define your reading nook',
          category: 'rug',
          style: baseStyle,
          colors: baseColors,
          source: 'cb2',
          url: 'https://cb2.com/accent-rug',
          dimensions: { width: 48, height: 1, depth: 36 }
        }
      );
    }
    
    // Default: generate basic complementary items
    else {
      complementaryItems.push(
        {
          id: 'comp_default_1',
          title: 'Complementary Furniture Piece',
          price: 299,
          imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop&auto=format',
          description: 'Furniture piece that complements your selection',
          category: 'decor',
          style: baseStyle,
          colors: baseColors,
          source: 'westelm',
          url: 'https://westelm.com/complementary-piece'
        }
      );
    }
    
    return complementaryItems;
  }

  calculateMatchScore(selectedItem, candidateItem) {
    const styleScore = this.calculateStyleScore(selectedItem, candidateItem);
    const colorScore = this.calculateColorScore(selectedItem, candidateItem);
    const categoryScore = this.calculateCategoryScore(selectedItem, candidateItem);
    const priceScore = this.calculatePriceScore(selectedItem, candidateItem);
    const sizeScore = this.calculateSizeScore(selectedItem, candidateItem);

    const overall = (
      styleScore * this.weights.style +
      colorScore * this.weights.color +
      categoryScore * this.weights.category +
      priceScore * this.weights.price +
      sizeScore * this.weights.size
    );

    return {
      overall: Math.max(0, Math.min(1, overall)),
      styleScore,
      colorScore,
      categoryScore,
      priceScore,
      sizeScore
    };
  }

  calculateStyleScore(selectedItem, candidateItem) {
    if (!selectedItem.style || !candidateItem.style) return 0.5;
    
    // Exact match
    if (selectedItem.style === candidateItem.style) return 1.0;
    
    // Compatible styles
    const compatibleStyles = {
      'modern': ['minimalist', 'industrial'],
      'minimalist': ['modern', 'scandinavian'],
      'rustic': ['traditional', 'industrial'],
      'traditional': ['rustic'],
      'scandinavian': ['minimalist', 'modern'],
      'industrial': ['modern', 'rustic']
    };

    if (compatibleStyles[selectedItem.style]?.includes(candidateItem.style)) {
      return 0.7;
    }

    return 0.3;
  }

  calculateColorScore(selectedItem, candidateItem) {
    if (!selectedItem.colors || !candidateItem.colors) return 0.5;
    
    const selectedColors = selectedItem.colors || [];
    const candidateColors = candidateItem.colors || [];
    
    if (selectedColors.length === 0 || candidateColors.length === 0) return 0.5;

    // Check for color overlaps
    const commonColors = selectedColors.filter(color => 
      candidateColors.some(candidateColor => 
        this.colorDistance(color, candidateColor) < 0.3
      )
    );

    const overlapRatio = commonColors.length / Math.max(selectedColors.length, candidateColors.length);
    return overlapRatio;
  }

  calculateCategoryScore(selectedItem, candidateItem) {
    if (!selectedItem.category || !candidateItem.category) return 0.5;
    
    // Same category gets much lower score (we want complementary room items)
    if (selectedItem.category === candidateItem.category) return 0.1;
    
    // Room-completing complementary categories get highest scores
    const roomComplementaryCategories = {
      'table': ['sofa', 'chair', 'rug', 'lamp', 'curtains', 'decor', 'side_table'],
      'sofa': ['table', 'side_table', 'rug', 'lamp', 'curtains', 'decor'],
      'chair': ['table', 'side_table', 'rug', 'lamp', 'decor'],
      'bed': ['dresser', 'lamp', 'rug', 'curtains', 'decor', 'side_table'],
      'dresser': ['bed', 'lamp', 'decor', 'curtains'],
      'lamp': ['sofa', 'chair', 'table', 'bed', 'dresser', 'side_table'],
      'rug': ['sofa', 'chair', 'table', 'bed'],
      'curtains': ['sofa', 'chair', 'table', 'bed', 'dresser'],
      'decor': ['sofa', 'chair', 'table', 'bed', 'dresser', 'lamp', 'side_table'],
      'side_table': ['sofa', 'chair', 'table', 'bed', 'lamp']
    };

    if (roomComplementaryCategories[selectedItem.category]?.includes(candidateItem.category)) {
      return 0.95;
    }

    return 0.3;
  }

  calculatePriceScore(selectedItem, candidateItem) {
    if (!selectedItem.price || !candidateItem.price) return 0.5;
    
    const ratio = Math.min(selectedItem.price, candidateItem.price) / 
                  Math.max(selectedItem.price, candidateItem.price);
    
    // Items with similar price ranges score higher
    return ratio;
  }

  calculateSizeScore(selectedItem, candidateItem) {
    if (!selectedItem.dimensions || !candidateItem.dimensions) return 0.5;
    
    // Simple size compatibility check
    const selectedSize = (selectedItem.dimensions.width || 0) * (selectedItem.dimensions.depth || 0);
    const candidateSize = (candidateItem.dimensions.width || 0) * (candidateItem.dimensions.depth || 0);
    
    if (selectedSize === 0 || candidateSize === 0) return 0.5;
    
    const sizeRatio = Math.min(selectedSize, candidateSize) / Math.max(selectedSize, candidateSize);
    return sizeRatio;
  }

  colorDistance(color1, color2) {
    // Use advanced color matching service
    return colorMatchingService.calculateColorDistance(color1, color2) / 300;
  }
  
  detectRoomType(category) {
    const roomMapping = {
      'sofa': 'living',
      'chair': 'living', 
      'table': 'living',
      'coffee_table': 'living',
      'side_table': 'living',
      'bed': 'bedroom',
      'dresser': 'bedroom',
      'nightstand': 'bedroom',
      'dining_table': 'dining',
      'dining_chair': 'dining',
      'kitchen_island': 'kitchen',
      'bar_stool': 'kitchen'
    };
    
    return roomMapping[category] || 'living';
  }
}

module.exports = new MatchingService();