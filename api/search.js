// Simplified search function for Vercel deployment
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
    const { query, filters } = req.body;
    
    // Mock search results for demo (replace with real search logic)
    const mockResults = [
      {
        id: '1',
        title: `Modern ${query} - Sleek Design`,
        price: 299,
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
        description: `Beautiful modern ${query} with clean lines`,
        category: query.toLowerCase(),
        style: 'modern',
        colors: ['#FFFFFF', '#000000', '#808080'],
        source: 'westelm',
        url: 'https://westelm.com/example',
        location: 'San Francisco, CA'
      },
      {
        id: '2',
        title: `Rustic ${query} - Natural Wood`,
        price: 199,
        imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400',
        description: `Handcrafted rustic ${query} in natural wood`,
        category: query.toLowerCase(),
        style: 'rustic',
        colors: ['#8B4513', '#DEB887', '#D2B48C'],
        source: 'facebook',
        url: 'https://facebook.com/marketplace/example',
        location: 'Portland, OR'
      },
      {
        id: '3',
        title: `Scandinavian ${query} - Minimalist`,
        price: 399,
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
        description: `Clean scandinavian ${query} design`,
        category: query.toLowerCase(),
        style: 'scandinavian',
        colors: ['#FFFFFF', '#F0F0F0', '#8FBC8F'],
        source: 'cb2',
        url: 'https://cb2.com/example',
        location: 'Seattle, WA'
      }
    ];

    // Apply filters if provided
    let filteredResults = mockResults;
    if (filters) {
      if (filters.minPrice) {
        filteredResults = filteredResults.filter(item => item.price >= filters.minPrice);
      }
      if (filters.maxPrice) {
        filteredResults = filteredResults.filter(item => item.price <= filters.maxPrice);
      }
      if (filters.style) {
        filteredResults = filteredResults.filter(item => item.style === filters.style);
      }
      if (filters.styles && filters.styles.length > 0) {
        filteredResults = filteredResults.filter(item => filters.styles.includes(item.style));
      }
      if (filters.source && filters.source.length > 0) {
        filteredResults = filteredResults.filter(item => filters.source.includes(item.source));
      }
    }

    res.status(200).json({
      success: true,
      results: filteredResults
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}