// Session preferences API for Vercel
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
    // Mock session preferences
    const mockPreferences = {
      sessionId: 'demo-session-123',
      stats: {
        totalSearches: 5,
        totalMatches: 12,
        favoriteStyles: ['modern', 'scandinavian']
      },
      preferences: {
        topCategories: ['sofa', 'chair', 'table'],
        preferredPriceRange: { min: 100, max: 1000 },
        stylePreferences: ['modern', 'scandinavian']
      }
    };

    res.status(200).json(mockPreferences);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}