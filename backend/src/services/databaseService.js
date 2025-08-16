const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/cache.db');
    this.db = null;
    this.ensureDbDir();
    this.initialize();
  }

  ensureDbDir() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
          return;
        }
        
        console.log('Connected to SQLite database');
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const createCacheTable = `
        CREATE TABLE IF NOT EXISTS cache_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cache_key TEXT UNIQUE NOT NULL,
          source TEXT NOT NULL,
          query TEXT NOT NULL,
          filters TEXT DEFAULT '{}',
          data TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL,
          hit_count INTEGER DEFAULT 0,
          last_accessed INTEGER NOT NULL
        )
      `;

      const createProductsTable = `
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          price REAL,
          image_url TEXT,
          description TEXT,
          category TEXT,
          style TEXT,
          colors TEXT,
          source TEXT NOT NULL,
          url TEXT,
          location TEXT,
          dimensions TEXT,
          processed_image TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `;

      const createIndexes = `
        CREATE INDEX IF NOT EXISTS idx_cache_key ON cache_entries(cache_key);
        CREATE INDEX IF NOT EXISTS idx_source_query ON cache_entries(source, query);
        CREATE INDEX IF NOT EXISTS idx_expires_at ON cache_entries(expires_at);
        CREATE INDEX IF NOT EXISTS idx_products_source ON products(source);
        CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      `;

      this.db.exec(createCacheTable, (err) => {
        if (err) {
          reject(err);
          return;
        }

        this.db.exec(createProductsTable, (err) => {
          if (err) {
            reject(err);
            return;
          }

          this.db.exec(createIndexes, (err) => {
            if (err) {
              reject(err);
              return;
            }

            console.log('Database tables created successfully');
            resolve();
          });
        });
      });
    });
  }

  generateCacheKey(source, query, filters = {}) {
    const filterStr = JSON.stringify(filters);
    return `${source}_${query}_${Buffer.from(filterStr).toString('base64')}`;
  }

  async get(source, query, filters = {}) {
    const cacheKey = this.generateCacheKey(source, query, filters);
    const now = Date.now();

    return new Promise((resolve, reject) => {
      const sql = `
        SELECT data, created_at, expires_at, hit_count 
        FROM cache_entries 
        WHERE cache_key = ? AND expires_at > ?
      `;

      this.db.get(sql, [cacheKey, now], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row) {
          // Update hit count and last accessed
          this.updateCacheStats(cacheKey);
          
          console.log(`Database cache hit: ${cacheKey} (hits: ${row.hit_count + 1})`);
          
          try {
            const data = JSON.parse(row.data);
            resolve(data);
          } catch (parseErr) {
            console.error('Error parsing cached data:', parseErr);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  }

  async set(source, query, data, filters = {}, cacheDuration = 24 * 60 * 60 * 1000) {
    const cacheKey = this.generateCacheKey(source, query, filters);
    const now = Date.now();
    const expiresAt = now + cacheDuration;

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO cache_entries 
        (cache_key, source, query, filters, data, created_at, expires_at, hit_count, last_accessed)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
      `;

      const params = [
        cacheKey,
        source,
        query,
        JSON.stringify(filters),
        JSON.stringify(data),
        now,
        expiresAt,
        now
      ];

      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Error caching data:', err);
          reject(err);
          return;
        }

        console.log(`Cached ${data.length} items in database: ${cacheKey}`);
        resolve();
      });
    });
  }

  async updateCacheStats(cacheKey) {
    const now = Date.now();
    const sql = `
      UPDATE cache_entries 
      SET hit_count = hit_count + 1, last_accessed = ?
      WHERE cache_key = ?
    `;

    this.db.run(sql, [now, cacheKey], (err) => {
      if (err) {
        console.error('Error updating cache stats:', err);
      }
    });
  }

  async invalidate(source, query, filters = {}) {
    const cacheKey = this.generateCacheKey(source, query, filters);

    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM cache_entries WHERE cache_key = ?';

      this.db.run(sql, [cacheKey], function(err) {
        if (err) {
          reject(err);
          return;
        }

        console.log(`Invalidated cache entry: ${cacheKey}`);
        resolve();
      });
    });
  }

  async clearExpired() {
    const now = Date.now();

    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM cache_entries WHERE expires_at <= ?';

      this.db.run(sql, [now], function(err) {
        if (err) {
          reject(err);
          return;
        }

        console.log(`Cleared ${this.changes} expired cache entries`);
        resolve();
      });
    });
  }

  async getCacheStats() {
    return new Promise((resolve, reject) => {
      const now = Date.now();
      
      const sql = `
        SELECT 
          COUNT(*) as total_entries,
          COUNT(CASE WHEN expires_at > ? THEN 1 END) as active_entries,
          COUNT(CASE WHEN expires_at <= ? THEN 1 END) as expired_entries,
          SUM(hit_count) as total_hits,
          AVG(hit_count) as avg_hits,
          source,
          COUNT(*) as source_count
        FROM cache_entries
        GROUP BY source
        UNION ALL
        SELECT 
          COUNT(*) as total_entries,
          COUNT(CASE WHEN expires_at > ? THEN 1 END) as active_entries,
          COUNT(CASE WHEN expires_at <= ? THEN 1 END) as expired_entries,
          SUM(hit_count) as total_hits,
          AVG(hit_count) as avg_hits,
          'TOTAL' as source,
          COUNT(*) as source_count
        FROM cache_entries
      `;

      this.db.all(sql, [now, now, now, now], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        const stats = {
          overview: rows.find(r => r.source === 'TOTAL') || {
            total_entries: 0,
            active_entries: 0,
            expired_entries: 0,
            total_hits: 0,
            avg_hits: 0
          },
          by_source: rows.filter(r => r.source !== 'TOTAL')
        };

        resolve(stats);
      });
    });
  }

  async clearAll() {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM cache_entries', function(err) {
        if (err) {
          reject(err);
          return;
        }

        console.log(`Cleared all ${this.changes} cache entries`);
        resolve();
      });
    });
  }

  // Product management methods
  async saveProduct(product) {
    const now = Date.now();
    
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO products 
        (id, title, price, image_url, description, category, style, colors, source, url, location, dimensions, processed_image, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        product.id,
        product.title,
        product.price,
        product.imageUrl,
        product.description,
        product.category,
        product.style,
        JSON.stringify(product.colors),
        product.source,
        product.url,
        product.location,
        JSON.stringify(product.dimensions),
        JSON.stringify(product.processedImage),
        product.created_at || now,
        now
      ];

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  }

  async getProducts(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM products WHERE 1=1';
      const params = [];

      if (filters.source) {
        sql += ' AND source = ?';
        params.push(filters.source);
      }

      if (filters.category) {
        sql += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters.minPrice) {
        sql += ' AND price >= ?';
        params.push(filters.minPrice);
      }

      if (filters.maxPrice) {
        sql += ' AND price <= ?';
        params.push(filters.maxPrice);
      }

      sql += ' ORDER BY created_at DESC LIMIT 50';

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        const products = rows.map(row => ({
          ...row,
          colors: JSON.parse(row.colors || '[]'),
          dimensions: JSON.parse(row.dimensions || '{}'),
          processedImage: JSON.parse(row.processed_image || 'null')
        }));

        resolve(products);
      });
    });
  }

  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          } else {
            console.log('Database connection closed');
          }
          resolve();
        });
      });
    }
  }
}

module.exports = new DatabaseService();