// Matching API for Vercel
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
    const { selectedItem } = req.body;
    
    // Generate mock matching items based on the selected item
    const mockMatches = [
      {
        id: 'match1',
        title: `Matching Accent Chair - ${selectedItem.style}`,
        price: 149,
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
        description: `Perfect accent chair to complement your ${selectedItem.title}`,
        category: 'chair',
        style: selectedItem.style,
        colors: selectedItem.colors,
        source: 'westelm',
        url: 'https://westelm.com/example-chair',
        location: 'Local Store',
        colorMatchScore: 0.92,
        matchReason: 'Excellent color harmony and style compatibility',
        harmonies: {
          type: 'complementary',
          score: 0.9
        }
      },
      {
        id: 'match2',
        title: `${selectedItem.style} Side Table`,
        price: 89,
        imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400',
        description: `Stylish side table matching your ${selectedItem.style} aesthetic`,
        category: 'table',
        style: selectedItem.style,
        colors: selectedItem.colors,
        source: 'cb2',
        url: 'https://cb2.com/example-table',
        location: 'Available Online',
        colorMatchScore: 0.87,
        matchReason: 'Great style match with analogous colors',
        harmonies: {
          type: 'analogous',
          score: 0.85
        }
      },
      {
        id: 'match3',
        title: `Coordinating Floor Lamp`,
        price: 199,
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
        description: `Modern floor lamp that complements your space`,
        category: 'lamp',
        style: selectedItem.style,
        colors: ['#FFFFFF', '#000000'],
        source: 'facebook',
        url: 'https://facebook.com/marketplace/lamp',
        location: 'San Francisco',
        colorMatchScore: 0.78,
        matchReason: 'Neutral coordination with good style match',
        harmonies: {
          type: 'monochromatic',
          score: 0.8
        }
      }
    ];

    res.status(200).json({
      success: true,
      matches: mockMatches
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}