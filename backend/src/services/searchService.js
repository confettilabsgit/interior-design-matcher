const axios = require('axios');
const facebookScraper = require('./scrapers/facebookScraper');
const westelmScraper = require('./scrapers/westelmScraper');
const cb2Scraper = require('./scrapers/cb2Scraper');
const cacheService = require('./cacheService');
const databaseService = require('./databaseService');

class SearchService {
  constructor() {
    this.scrapers = {
      facebook: facebookScraper,
      westelm: westelmScraper,
      cb2: cb2Scraper
    };
  }

  async searchItems(query, filters = {}) {
    try {
      console.log(`Searching for "${query}" with filters:`, filters);
      
      // Check cache first for each source
      const cacheKey = `combined_${query}`;
      const cachedResults = await cacheService.get('combined', query, filters);
      
      if (cachedResults) {
        console.log(`Returning ${cachedResults.length} cached results`);
        return this.applyFilters(cachedResults, filters);
      }
      
      let allResults = [];
      
      // Try multiple sources in parallel with individual caching
      const searchPromises = [];
      
      // Facebook Marketplace
      searchPromises.push(
        this.searchWithCache('facebook', facebookScraper, query, filters)
      );
      
      // West Elm
      searchPromises.push(
        this.searchWithCache('westelm', westelmScraper, query, filters)
      );
      
      // CB2
      searchPromises.push(
        this.searchWithCache('cb2', cb2Scraper, query, filters)
      );
      
      // Wait for all scrapers to complete
      const results = await Promise.all(searchPromises);
      
      // Combine all results
      for (const scraperResults of results) {
        allResults = allResults.concat(scraperResults);
      }
      
      console.log(`Combined scraping returned ${allResults.length} total items`);
      
      // If scraping failed or returned no results, use enhanced mock data
      if (allResults.length === 0) {
        console.log('Using enhanced mock data as fallback');
        allResults = this.getMockResults(query, filters);
      }
      
      // Cache combined results and save products to database
      if (allResults.length > 0) {
        await cacheService.set('combined', query, allResults, filters);
        
        // Save individual products to database for persistence
        for (const product of allResults) {
          try {
            await databaseService.saveProduct(product);
          } catch (error) {
            console.error(`Failed to save product ${product.id}:`, error.message);
          }
        }
      }
      
      // Apply filters to results
      const filteredResults = this.applyFilters(allResults, filters);
      
      console.log(`Returning ${filteredResults.length} total results`);
      return filteredResults;
      
    } catch (error) {
      console.error('Search service error:', error);
      throw new Error('Failed to search items');
    }
  }

  async searchWithCache(source, scraper, query, filters) {
    try {
      // Check individual source cache
      const cachedResults = await cacheService.get(source, query, filters);
      if (cachedResults) {
        console.log(`Using cached ${source} results`);
        return cachedResults;
      }
      
      // Scrape fresh results
      const results = await scraper.scrapeItems(query, filters);
      
      // Cache results if successful
      if (results && results.length > 0) {
        await cacheService.set(source, query, results, filters);
      }
      
      return results || [];
      
    } catch (error) {
      console.error(`${source} scraping failed:`, error);
      return [];
    }
  }

  applyFilters(results, filters) {
    let filteredResults = results;

    if (filters.category) {
      filteredResults = filteredResults.filter(item => item.category === filters.category);
    }

    if (filters.minPrice) {
      filteredResults = filteredResults.filter(item => item.price >= filters.minPrice);
    }

    if (filters.maxPrice) {
      filteredResults = filteredResults.filter(item => item.price <= filters.maxPrice);
    }

    if (filters.style) {
      filteredResults = filteredResults.filter(item => item.style === filters.style);
    }

    if (filters.source && filters.source.length > 0) {
      filteredResults = filteredResults.filter(item => filters.source.includes(item.source));
    }

    return filteredResults;
  }

  getMockResults(query, filters) {
    // Determine the category from the search query
    const queryLower = query.toLowerCase();
    let primaryCategory = 'table'; // default
    
    if (queryLower.includes('coffee table') || queryLower.includes('side table')) {
      primaryCategory = 'table';
    } else if (queryLower.includes('sofa') || queryLower.includes('couch')) {
      primaryCategory = 'sofa';
    } else if (queryLower.includes('chair')) {
      primaryCategory = 'chair';
    } else if (queryLower.includes('bed')) {
      primaryCategory = 'bed';
    } else if (queryLower.includes('lamp')) {
      primaryCategory = 'lamp';
    } else if (queryLower.includes('rug')) {
      primaryCategory = 'rug';
    }

    // Create relevant results based on the query
    let baseResults = [];
    
    if (primaryCategory === 'table') {
      baseResults = [
        {
          id: 'fb_coffee_1',
          title: 'Modern Coffee Table with Storage',
          price: 299,
          imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=200&fit=crop',
          description: 'Contemporary coffee table with hidden storage compartment',
          category: 'table',
          style: 'modern',
          colors: ['#8B4513', '#696969'],
          source: 'facebook',
          url: 'https://facebook.com/marketplace/coffee-table-1',
          location: 'San Francisco, CA',
          dimensions: { width: 48, height: 18, depth: 24 }
        },
        {
          id: 'we_coffee_1',
          title: 'Mid-Century Coffee Table',
          price: 449,
          imageUrl: 'https://images.unsplash.com/photo-1549497538-303791108f95?w=300&h=200&fit=crop',
          description: 'Classic mid-century modern coffee table in walnut',
          category: 'table',
          style: 'modern',
          colors: ['#8B4513', '#D2B48C'],
          source: 'westelm',
          url: 'https://westelm.com/coffee-table-midcentury',
          dimensions: { width: 52, height: 16, depth: 28 }
        },
        {
          id: 'cb2_coffee_1',
          title: 'Glass Coffee Table',
          price: 399,
          imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=200&fit=crop',
          description: 'Sleek glass coffee table with metal frame',
          category: 'table',
          style: 'modern',
          colors: ['#FFFFFF', '#C0C0C0'],
          source: 'cb2',
          url: 'https://cb2.com/glass-coffee-table',
          dimensions: { width: 44, height: 17, depth: 22 }
        }
      ];
    } else if (primaryCategory === 'sofa') {
      baseResults = [
        {
          id: 'fb_sofa_1',
          title: 'Modern Gray Sectional Sofa',
          price: 899,
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop',
          description: 'Comfortable modern sectional sofa in gray fabric',
          category: 'sofa',
          style: 'modern',
          colors: ['#808080', '#A0A0A0'],
          source: 'facebook',
          url: 'https://facebook.com/marketplace/sectional-sofa',
          location: 'San Francisco, CA',
          dimensions: { width: 84, height: 36, depth: 60 }
        },
        {
          id: 'we_sofa_1',
          title: 'Mid-Century Modern Sofa',
          price: 1299,
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop',
          description: 'Classic mid-century modern sofa in navy blue',
          category: 'sofa',
          style: 'modern',
          colors: ['#191970', '#4169E1'],
          source: 'westelm',
          url: 'https://westelm.com/midcentury-sofa',
          dimensions: { width: 72, height: 32, depth: 36 }
        }
      ];
    } else if (primaryCategory === 'chair') {
      baseResults = [
        {
          id: 'cb2_chair_1',
          title: 'Velvet Accent Chair',
          price: 399,
          imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=300&h=200&fit=crop',
          description: 'Luxurious velvet accent chair in navy blue',
          category: 'chair',
          style: 'modern',
          colors: ['#4169E1', '#191970'],
          source: 'cb2',
          url: 'https://cb2.com/velvet-accent-chair',
          dimensions: { width: 32, height: 34, depth: 30 }
        },
        {
          id: 'we_chair_1',
          title: 'Modern Dining Chair Set',
          price: 299,
          imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=300&h=200&fit=crop',
          description: 'Set of 2 modern dining chairs',
          category: 'chair',
          style: 'modern',
          colors: ['#8B4513', '#D2B48C'],
          source: 'westelm',
          url: 'https://westelm.com/dining-chairs',
          dimensions: { width: 20, height: 32, depth: 22 }
        }
      ];
    } else {
      // Default mixed results
      baseResults = [
        {
          id: 'fb_1',
          title: 'Modern Coffee Table',
          price: 299,
          imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=200&fit=crop',
          description: 'Contemporary coffee table with clean lines',
          category: 'table',
          style: 'modern',
          colors: ['#8B4513', '#696969'],
          source: 'facebook',
          url: 'https://facebook.com/marketplace/item/1',
          location: 'San Francisco, CA',
          dimensions: { width: 48, height: 18, depth: 24 }
        }
      ];
    }

    // Apply filters
    let filteredResults = baseResults;

    if (filters.category) {
      filteredResults = filteredResults.filter(item => item.category === filters.category);
    }

    if (filters.minPrice) {
      filteredResults = filteredResults.filter(item => item.price >= filters.minPrice);
    }

    if (filters.maxPrice) {
      filteredResults = filteredResults.filter(item => item.price <= filters.maxPrice);
    }

    if (filters.style) {
      filteredResults = filteredResults.filter(item => item.style === filters.style);
    }

    if (filters.source && filters.source.length > 0) {
      filteredResults = filteredResults.filter(item => filters.source.includes(item.source));
    }

    return filteredResults;
  }
}

module.exports = new SearchService();