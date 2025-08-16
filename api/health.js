// Vercel serverless function for health check
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Interior Design Matcher API is running on Vercel' 
  });
}