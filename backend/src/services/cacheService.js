const fs = require('fs');
const path = require('path');
const databaseService = require('./databaseService');

class CacheService {
  constructor() {
    this.cacheDir = path.join(__dirname, '../../cache');
    this.ensureCacheDir();
    this.cache = new Map();
    this.cacheDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    this.useDatabase = true;
  }

  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  generateCacheKey(source, query, filters = {}) {
    const filterStr = JSON.stringify(filters);
    return `${source}_${query}_${Buffer.from(filterStr).toString('base64')}`;
  }

  async get(source, query, filters = {}) {
    const key = this.generateCacheKey(source, query, filters);
    
    // Check in-memory cache first
    if (this.cache.has(key)) {
      const cacheEntry = this.cache.get(key);
      if (Date.now() - cacheEntry.timestamp < this.cacheDuration) {
        console.log(`Cache hit (memory): ${key}`);
        return cacheEntry.data;
      } else {
        // Remove expired entry
        this.cache.delete(key);
      }
    }

    // Check database cache
    if (this.useDatabase) {
      try {
        const data = await databaseService.get(source, query, filters);
        if (data) {
          // Load into memory cache for faster subsequent access
          this.cache.set(key, {
            timestamp: Date.now(),
            data: data,
            source: source,
            query: query,
            filters: filters
          });
          return data;
        }
      } catch (error) {
        console.error('Database cache error, falling back to file cache:', error);
      }
    }

    // Fallback to file cache
    const filePath = path.join(this.cacheDir, `${key}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const cacheEntry = JSON.parse(fileContent);
        
        if (Date.now() - cacheEntry.timestamp < this.cacheDuration) {
          console.log(`Cache hit (file): ${key}`);
          // Load into memory cache
          this.cache.set(key, cacheEntry);
          return cacheEntry.data;
        } else {
          // Remove expired file
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error('Error reading cache file:', error);
        // Remove corrupted file
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    return null;
  }

  async set(source, query, data, filters = {}) {
    const key = this.generateCacheKey(source, query, filters);
    const cacheEntry = {
      timestamp: Date.now(),
      data: data,
      source: source,
      query: query,
      filters: filters
    };

    // Store in memory
    this.cache.set(key, cacheEntry);

    // Store in database (primary)
    if (this.useDatabase) {
      try {
        await databaseService.set(source, query, data, filters, this.cacheDuration);
        console.log(`Cached results in database: ${key} (${data.length} items)`);
      } catch (error) {
        console.error('Database cache error, falling back to file cache:', error);
        this.useDatabase = false; // Disable database temporarily
      }
    }

    // Store in file (backup)
    try {
      const filePath = path.join(this.cacheDir, `${key}.json`);
      fs.writeFileSync(filePath, JSON.stringify(cacheEntry, null, 2));
      if (!this.useDatabase) {
        console.log(`Cached results in file: ${key} (${data.length} items)`);
      }
    } catch (error) {
      console.error('Error writing cache file:', error);
    }
  }

  async invalidate(source, query, filters = {}) {
    const key = this.generateCacheKey(source, query, filters);
    
    // Remove from memory
    this.cache.delete(key);
    
    // Remove file
    const filePath = path.join(this.cacheDir, `${key}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Invalidated cache: ${key}`);
    }
  }

  async clearExpired() {
    const now = Date.now();
    
    // Clear expired memory cache
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.cacheDuration) {
        this.cache.delete(key);
      }
    }

    // Clear expired file cache
    try {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.cacheDir, file);
          const stat = fs.statSync(filePath);
          if (now - stat.mtime.getTime() >= this.cacheDuration) {
            fs.unlinkSync(filePath);
            console.log(`Removed expired cache file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  async getCacheStats() {
    const memoryEntries = this.cache.size;
    let fileEntries = 0;
    let totalSize = 0;
    let databaseStats = null;

    // Get database stats
    if (this.useDatabase) {
      try {
        databaseStats = await databaseService.getCacheStats();
      } catch (error) {
        console.error('Error getting database stats:', error);
      }
    }

    // Get file stats
    try {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          fileEntries++;
          const filePath = path.join(this.cacheDir, file);
          const stat = fs.statSync(filePath);
          totalSize += stat.size;
        }
      }
    } catch (error) {
      console.error('Error getting file cache stats:', error);
    }

    return {
      memoryEntries,
      fileEntries,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      cacheDurationHours: this.cacheDuration / (60 * 60 * 1000),
      database: databaseStats,
      databaseEnabled: this.useDatabase
    };
  }

  async clearAll() {
    // Clear memory cache
    this.cache.clear();

    // Clear database cache
    if (this.useDatabase) {
      try {
        await databaseService.clearAll();
      } catch (error) {
        console.error('Error clearing database cache:', error);
      }
    }

    // Clear file cache
    try {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.cacheDir, file);
          fs.unlinkSync(filePath);
        }
      }
      console.log('Cleared all cache (memory, database, and files)');
    } catch (error) {
      console.error('Error clearing file cache:', error);
    }
  }
}

module.exports = new CacheService();