const sharp = require('sharp');
const Jimp = require('jimp');
const axios = require('axios');
// const Vibrant = require('node-vibrant'); // Temporarily disabled due to import issues
const fs = require('fs');
const path = require('path');

class ImageProcessingService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async processProductImage(imageUrl, productId) {
    try {
      console.log(`Processing image for product ${productId}: ${imageUrl}`);
      
      // Download the image
      const imageBuffer = await this.downloadImage(imageUrl);
      if (!imageBuffer) {
        return null;
      }
      
      // Extract dominant colors
      const colors = await this.extractColors(imageBuffer);
      
      // Analyze image properties
      const properties = await this.analyzeImageProperties(imageBuffer);
      
      // Generate optimized image versions
      const optimizedImages = await this.generateOptimizedImages(imageBuffer, productId);
      
      return {
        originalUrl: imageUrl,
        colors: colors,
        properties: properties,
        optimized: optimizedImages,
        processedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Image processing error:', error);
      return null;
    }
  }

  async downloadImage(imageUrl) {
    try {
      const response = await axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Image download error:', error.message);
      return null;
    }
  }

  async extractColors(imageBuffer) {
    try {
      // Try advanced color analysis first
      const basicColors = await this.basicColorAnalysis(imageBuffer);
      
      if (basicColors.length > 0) {
        return basicColors;
      }
      
      // Note: Vibrant analysis temporarily disabled due to import issues
      
      // Return fallback colors as last resort
      return [
        { hex: '#808080', rgb: [128, 128, 128], population: 100, type: 'fallback' },
        { hex: '#C0C0C0', rgb: [192, 192, 192], population: 50, type: 'fallback' }
      ];
      
    } catch (error) {
      console.error('Color extraction error:', error);
      // Return fallback colors
      return [
        { hex: '#808080', rgb: [128, 128, 128], population: 100, type: 'fallback' },
        { hex: '#C0C0C0', rgb: [192, 192, 192], population: 50, type: 'fallback' }
      ];
    }
  }

  async basicColorAnalysis(imageBuffer) {
    try {
      const image = await new Promise((resolve, reject) => {
        Jimp.read(imageBuffer, (err, img) => {
          if (err) reject(err);
          else resolve(img);
        });
      });
      
      // Resize for faster processing
      image.resize(100, 100);
      
      const colorCounts = {};
      const width = image.bitmap.width;
      const height = image.bitmap.height;
      
      // Sample colors from image
      for (let y = 0; y < height; y += 5) {
        for (let x = 0; x < width; x += 5) {
          const color = image.getPixelColor(x, y);
          const rgba = Jimp.intToRGBA(color);
          
          // Skip transparent and very light/dark pixels
          if (rgba.a < 128) continue;
          if (rgba.r > 240 && rgba.g > 240 && rgba.b > 240) continue;
          if (rgba.r < 20 && rgba.g < 20 && rgba.b < 20) continue;
          
          // Group similar colors
          const groupedColor = this.groupColor(rgba);
          const key = `${groupedColor.r},${groupedColor.g},${groupedColor.b}`;
          
          colorCounts[key] = (colorCounts[key] || 0) + 1;
        }
      }
      
      // Get top colors
      const sortedColors = Object.entries(colorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([rgbStr, count]) => {
          const [r, g, b] = rgbStr.split(',').map(Number);
          return {
            hex: this.rgbToHex(r, g, b),
            rgb: [r, g, b],
            population: count,
            type: 'basic'
          };
        });
      
      return sortedColors;
      
    } catch (error) {
      console.error('Basic color analysis error:', error);
      return [];
    }
  }

  groupColor(rgba) {
    // Group similar colors into buckets
    const bucket = 32;
    return {
      r: Math.floor(rgba.r / bucket) * bucket,
      g: Math.floor(rgba.g / bucket) * bucket,
      b: Math.floor(rgba.b / bucket) * bucket
    };
  }

  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  async analyzeImageProperties(imageBuffer) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      // Basic image analysis
      const properties = {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: imageBuffer.length,
        aspectRatio: metadata.width / metadata.height,
        orientation: metadata.width > metadata.height ? 'landscape' : 'portrait'
      };
      
      // Determine if image is suitable for furniture
      properties.suitability = this.assessImageSuitability(properties);
      
      return properties;
      
    } catch (error) {
      console.error('Image analysis error:', error);
      return {
        width: 400,
        height: 300,
        format: 'unknown',
        size: imageBuffer.length,
        aspectRatio: 1.33,
        orientation: 'landscape',
        suitability: 'unknown'
      };
    }
  }

  assessImageSuitability(properties) {
    const { width, height, aspectRatio } = properties;
    
    // Check minimum resolution
    if (width < 200 || height < 200) return 'low';
    
    // Check aspect ratio (furniture images are usually landscape or square)
    if (aspectRatio < 0.7 || aspectRatio > 2.0) return 'poor';
    
    // Check resolution quality
    if (width >= 800 && height >= 600) return 'high';
    if (width >= 400 && height >= 300) return 'good';
    
    return 'fair';
  }

  async generateOptimizedImages(imageBuffer, productId) {
    try {
      const optimized = {};
      
      // Generate thumbnail (300x200)
      const thumbnail = await sharp(imageBuffer)
        .resize(300, 200, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 85 })
        .toBuffer();
      
      // Generate medium size (600x400)
      const medium = await sharp(imageBuffer)
        .resize(600, 400, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 90 })
        .toBuffer();
      
      // For demo purposes, we'll return base64 data URLs
      // In production, you'd save to cloud storage (S3, Cloudinary, etc.)
      optimized.thumbnail = `data:image/jpeg;base64,${thumbnail.toString('base64')}`;
      optimized.medium = `data:image/jpeg;base64,${medium.toString('base64')}`;
      
      return optimized;
      
    } catch (error) {
      console.error('Image optimization error:', error);
      return {};
    }
  }

  async extractProductImagesFromPage(page, productUrl) {
    try {
      console.log('Extracting product images from page:', productUrl);
      
      // Common selectors for product images
      const imageSelectors = [
        '.product-image img',
        '.product-photos img',
        '.product-gallery img',
        '[data-testid*="image"] img',
        '.hero-image img',
        '.primary-image img',
        '.product-media img',
        '.main-image img'
      ];
      
      const images = [];
      
      for (const selector of imageSelectors) {
        try {
          const pageImages = await page.evaluate((sel) => {
            const imgElements = document.querySelectorAll(sel);
            return Array.from(imgElements).map(img => ({
              src: img.src || img.dataset.src || img.getAttribute('data-lazy-src'),
              alt: img.alt,
              width: img.naturalWidth || img.width,
              height: img.naturalHeight || img.height
            })).filter(img => img.src && img.src.startsWith('http'));
          }, selector);
          
          images.push(...pageImages);
        } catch (error) {
          console.log(`Selector ${selector} failed:`, error.message);
        }
      }
      
      // Remove duplicates and filter by size
      const uniqueImages = images
        .filter((img, index, arr) => arr.findIndex(i => i.src === img.src) === index)
        .filter(img => img.width >= 200 && img.height >= 150)
        .sort((a, b) => (b.width * b.height) - (a.width * a.height))
        .slice(0, 3); // Take top 3 images
      
      console.log(`Found ${uniqueImages.length} suitable product images`);
      return uniqueImages;
      
    } catch (error) {
      console.error('Page image extraction error:', error);
      return [];
    }
  }

  // Clean up temporary files
  cleanup() {
    try {
      if (fs.existsSync(this.tempDir)) {
        const files = fs.readdirSync(this.tempDir);
        for (const file of files) {
          fs.unlinkSync(path.join(this.tempDir, file));
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

module.exports = new ImageProcessingService();