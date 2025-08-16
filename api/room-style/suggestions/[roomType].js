// Room style suggestions API for Vercel
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-ID');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const { roomType } = req.query;
    
    const mockSuggestions = [
      {
        style: 'modern',
        score: 0.9,
        definition: {
          colors: ['#FFFFFF', '#000000', '#808080', '#C0C0C0'],
          characteristics: ['clean lines', 'minimal', 'geometric'],
          description: 'Clean lines, minimal ornamentation, and a focus on function over form.',
          priceRange: { min: 300, max: 2000 }
        }
      },
      {
        style: 'scandinavian',
        score: 0.85,
        definition: {
          colors: ['#FFFFFF', '#F0F0F0', '#8FBC8F', '#DDA0DD'],
          characteristics: ['hygge', 'functional', 'light', 'cozy'],
          description: 'Light woods, neutral colors, and hygge-inspired coziness.',
          priceRange: { min: 200, max: 1000 }
        }
      },
      {
        style: 'industrial',
        score: 0.8,
        definition: {
          colors: ['#2F2F2F', '#4A4A4A', '#C0C0C0', '#8B4513'],
          characteristics: ['raw', 'utilitarian', 'exposed', 'urban'],
          description: 'Raw materials like metal and concrete with an urban, warehouse aesthetic.',
          priceRange: { min: 250, max: 1800 }
        }
      }
    ];

    res.status(200).json(mockSuggestions);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}