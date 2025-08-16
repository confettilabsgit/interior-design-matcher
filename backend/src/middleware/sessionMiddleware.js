const sessionService = require('../services/sessionService');

const sessionMiddleware = async (req, res, next) => {
  try {
    // Get session ID from header, cookie, or create new one
    let sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
    
    let session = null;
    
    if (sessionId) {
      session = await sessionService.getSession(sessionId);
    }
    
    // Create new session if none exists or expired
    if (!session) {
      const userAgent = req.headers['user-agent'] || 'unknown';
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      session = await sessionService.createSession(userAgent, ipAddress);
      sessionId = session.id;
    }
    
    // Attach session to request
    req.session = session;
    req.sessionId = sessionId;
    
    // Update last activity
    session.lastActivityAt = Date.now();
    
    // Set session ID in response header for client
    res.setHeader('X-Session-ID', sessionId);
    
    next();
  } catch (error) {
    console.error('Session middleware error:', error);
    // Continue without session on error
    req.session = null;
    req.sessionId = null;
    next();
  }
};

module.exports = sessionMiddleware;