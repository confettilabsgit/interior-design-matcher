const databaseService = require('./databaseService');
const { v4: uuidv4 } = require('uuid');

class SessionService {
  constructor() {
    this.sessions = new Map(); // In-memory session store
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  async createSession(userAgent = 'unknown', ipAddress = 'unknown') {
    const sessionId = uuidv4();
    const now = Date.now();
    
    const session = {
      id: sessionId,
      userAgent,
      ipAddress,
      createdAt: now,
      lastActivityAt: now,
      searchHistory: [],
      preferences: {
        preferredStyles: [],
        priceRange: { min: 0, max: 10000 },
        favoriteColors: [],
        roomTypes: []
      },
      stats: {
        totalSearches: 0,
        totalMatches: 0,
        favoriteCategories: {},
        averagePrice: 0
      }
    };

    this.sessions.set(sessionId, session);
    
    // Also save to database for persistence
    await this.saveSessionToDatabase(session);
    
    console.log(`Created new session: ${sessionId}`);
    return session;
  }

  async getSession(sessionId) {
    // Check in-memory first
    if (this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId);
      
      // Check if session is expired
      if (Date.now() - session.lastActivityAt > this.sessionTimeout) {
        this.sessions.delete(sessionId);
        await this.removeSessionFromDatabase(sessionId);
        return null;
      }
      
      return session;
    }

    // Try to load from database
    try {
      const session = await this.loadSessionFromDatabase(sessionId);
      if (session && Date.now() - session.lastActivityAt < this.sessionTimeout) {
        this.sessions.set(sessionId, session);
        return session;
      }
    } catch (error) {
      console.error('Error loading session from database:', error);
    }

    return null;
  }

  async updateSession(sessionId, updates) {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Update session data
    Object.assign(session, updates);
    session.lastActivityAt = Date.now();

    // Update in memory
    this.sessions.set(sessionId, session);
    
    // Update in database
    await this.saveSessionToDatabase(session);
    
    return session;
  }

  async addSearchToHistory(sessionId, searchQuery, filters, results) {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const searchEntry = {
      id: uuidv4(),
      query: searchQuery,
      filters: filters || {},
      resultCount: results.length,
      timestamp: Date.now(),
      topResults: results.slice(0, 3).map(r => ({
        id: r.id,
        title: r.title,
        price: r.price,
        category: r.category,
        source: r.source
      }))
    };

    // Add to search history (keep last 50 searches)
    session.searchHistory.unshift(searchEntry);
    if (session.searchHistory.length > 50) {
      session.searchHistory = session.searchHistory.slice(0, 50);
    }

    // Update stats
    session.stats.totalSearches++;
    
    // Track favorite categories
    results.forEach(result => {
      const category = result.category;
      session.stats.favoriteCategories[category] = 
        (session.stats.favoriteCategories[category] || 0) + 1;
    });

    // Update average price based on search results
    const prices = results.filter(r => r.price > 0).map(r => r.price);
    if (prices.length > 0) {
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      session.stats.averagePrice = 
        (session.stats.averagePrice * (session.stats.totalSearches - 1) + avgPrice) / 
        session.stats.totalSearches;
    }

    session.lastActivityAt = Date.now();
    
    // Save updated session
    this.sessions.set(sessionId, session);
    await this.saveSessionToDatabase(session);

    return searchEntry;
  }

  async addMatchingToHistory(sessionId, selectedItem, matches) {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.stats.totalMatches++;
    
    // Learn from user's style preferences
    if (selectedItem.style && !session.preferences.preferredStyles.includes(selectedItem.style)) {
      session.preferences.preferredStyles.push(selectedItem.style);
    }

    // Learn from color preferences
    if (selectedItem.colors && Array.isArray(selectedItem.colors)) {
      selectedItem.colors.forEach(color => {
        if (!session.preferences.favoriteColors.includes(color)) {
          session.preferences.favoriteColors.push(color);
          // Keep only last 10 favorite colors
          if (session.preferences.favoriteColors.length > 10) {
            session.preferences.favoriteColors.shift();
          }
        }
      });
    }

    session.lastActivityAt = Date.now();
    
    // Save updated session
    this.sessions.set(sessionId, session);
    await this.saveSessionToDatabase(session);

    return session;
  }

  async getUserPreferences(sessionId) {
    const session = await this.getSession(sessionId);
    if (!session) {
      return null;
    }

    // Calculate intelligent preferences based on history
    const preferences = { ...session.preferences };

    // Add top categories based on search frequency
    const sortedCategories = Object.entries(session.stats.favoriteCategories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);

    preferences.topCategories = sortedCategories;
    
    // Add price insights
    preferences.suggestedPriceRange = {
      min: Math.max(0, session.stats.averagePrice * 0.7),
      max: session.stats.averagePrice * 1.5
    };

    return {
      sessionId,
      preferences,
      stats: session.stats,
      recentSearches: session.searchHistory.slice(0, 5)
    };
  }

  async getPersonalizedRecommendations(sessionId, category = null) {
    const session = await this.getSession(sessionId);
    if (!session) {
      return [];
    }

    // Get products from database that match user preferences
    const filters = {
      minPrice: session.preferences.priceRange.min,
      maxPrice: session.preferences.priceRange.max
    };

    if (category) {
      filters.category = category;
    }

    try {
      const products = await databaseService.getProducts(filters);
      
      // Score products based on user preferences
      const scoredProducts = products.map(product => {
        let score = 0;
        
        // Style preference scoring
        if (session.preferences.preferredStyles.includes(product.style)) {
          score += 3;
        }
        
        // Color preference scoring
        if (product.colors) {
          const productColors = Array.isArray(product.colors) ? product.colors : JSON.parse(product.colors || '[]');
          const colorMatches = productColors.filter(color => 
            session.preferences.favoriteColors.includes(color)
          ).length;
          score += colorMatches * 2;
        }
        
        // Category preference scoring
        if (session.stats.favoriteCategories[product.category]) {
          score += session.stats.favoriteCategories[product.category] * 0.1;
        }
        
        // Price scoring (prefer items closer to user's average price)
        const priceDiff = Math.abs(product.price - session.stats.averagePrice);
        const maxPrice = Math.max(product.price, session.stats.averagePrice) || 1;
        const priceScore = (1 - priceDiff / maxPrice) * 2;
        score += priceScore;

        return { ...product, recommendationScore: score };
      });

      // Sort by score and return top recommendations
      return scoredProducts
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, 10);
        
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  }

  async saveSessionToDatabase(session) {
    try {
      // For now, we'll extend the database service to handle sessions
      // In a real implementation, you might want a separate sessions table
      const sessionData = {
        id: `session_${session.id}`,
        title: `Session ${session.id}`,
        price: 0,
        image_url: null,
        description: JSON.stringify({
          userAgent: session.userAgent,
          ipAddress: session.ipAddress,
          searchHistory: session.searchHistory,
          preferences: session.preferences,
          stats: session.stats
        }),
        category: 'session',
        style: 'system',
        colors: '[]',
        source: 'system',
        url: null,
        location: session.ipAddress,
        dimensions: '{}',
        processed_image: 'null',
        created_at: session.createdAt,
        updated_at: session.lastActivityAt
      };

      await databaseService.saveProduct(sessionData);
    } catch (error) {
      console.error('Error saving session to database:', error);
    }
  }

  async loadSessionFromDatabase(sessionId) {
    try {
      const products = await databaseService.getProducts({
        category: 'session'
      });
      
      const sessionProduct = products.find(p => p.id === `session_${sessionId}`);
      if (!sessionProduct) {
        return null;
      }

      const sessionData = JSON.parse(sessionProduct.description);
      
      return {
        id: sessionId,
        userAgent: sessionData.userAgent,
        ipAddress: sessionData.ipAddress,
        createdAt: sessionProduct.created_at,
        lastActivityAt: sessionProduct.updated_at,
        searchHistory: sessionData.searchHistory || [],
        preferences: sessionData.preferences || {
          preferredStyles: [],
          priceRange: { min: 0, max: 10000 },
          favoriteColors: [],
          roomTypes: []
        },
        stats: sessionData.stats || {
          totalSearches: 0,
          totalMatches: 0,
          favoriteCategories: {},
          averagePrice: 0
        }
      };
    } catch (error) {
      console.error('Error loading session from database:', error);
      return null;
    }
  }

  async removeSessionFromDatabase(sessionId) {
    try {
      // In a real implementation, you'd have a proper delete method
      console.log(`Should remove session ${sessionId} from database`);
    } catch (error) {
      console.error('Error removing session from database:', error);
    }
  }

  async cleanupExpiredSessions() {
    const now = Date.now();
    const expiredSessions = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivityAt > this.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      this.sessions.delete(sessionId);
      await this.removeSessionFromDatabase(sessionId);
    }

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }
}

module.exports = new SessionService();