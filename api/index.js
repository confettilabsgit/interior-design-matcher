// Main API endpoint that handles all requests
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-ID');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Route to appropriate handler based on URL
  const { url } = req;
  
  if (url?.includes('/health')) {
    res.status(200).json({ 
      status: 'OK', 
      message: 'Interior Design Matcher API is running'
    });
  } else {
    res.status(404).json({ error: 'Endpoint not found' });
  }
}