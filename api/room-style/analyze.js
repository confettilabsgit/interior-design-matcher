// Room style analysis API for Vercel
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-ID');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { items, roomType } = req.body;
    
    if (!items || items.length === 0) {
      res.status(400).json({ error: 'No items provided for analysis' });
      return;
    }

    // Analyze the dominant style from the items
    const styleCount = {};
    const allColors = [];
    let totalPrice = 0;

    items.forEach(item => {
      // Count styles
      if (item.style) {
        styleCount[item.style] = (styleCount[item.style] || 0) + 1;
      }
      
      // Collect colors
      if (item.colors && Array.isArray(item.colors)) {
        allColors.push(...item.colors);
      }
      
      // Sum prices
      if (item.price) {
        totalPrice += item.price;
      }
    });

    // Find dominant style
    const dominantStyle = Object.entries(styleCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'mixed';
    
    const confidence = styleCount[dominantStyle] / items.length;

    // Extract unique colors
    const uniqueColors = [...new Set(allColors)];

    const mockAnalysis = {
      style: dominantStyle,
      confidence: Math.min(confidence, 1),
      styleScores: styleCount,
      analysis: {
        itemsAnalyzed: items.length,
        totalItems: items.length,
        recommendedStyles: [
          { style: dominantStyle, score: confidence },
          { style: 'modern', score: 0.8 },
          { style: 'scandinavian', score: 0.7 }
        ],
        colorPalette: uniqueColors.slice(0, 8),
        priceRange: {
          min: Math.min(...items.map(i => i.price || 0)),
          max: Math.max(...items.map(i => i.price || 0)),
          average: Math.round(totalPrice / items.length)
        }
      }
    };

    res.status(200).json(mockAnalysis);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}