class ColorMatchingService {
  constructor() {
    // Color harmony rules based on color theory
    this.harmonyRules = {
      complementary: 180,      // Opposite on color wheel
      triadic: 120,           // Three colors equally spaced
      analogous: 30,          // Adjacent colors
      splitComplementary: 150, // Base + two colors adjacent to complement
      tetradic: 90,           // Four colors forming rectangle
      monochromatic: 0        // Same hue, different saturation/lightness
    };
  }

  // Convert hex color to HSL (Hue, Saturation, Lightness)
  hexToHsl(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert to RGB first
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l;

    l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  // Convert HSL back to hex
  hslToHex(h, s, l) {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (c) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // Calculate color distance in HSL space
  calculateColorDistance(color1, color2) {
    const hsl1 = this.hexToHsl(color1);
    const hsl2 = this.hexToHsl(color2);

    // Calculate hue distance (circular)
    const hueDiff = Math.min(
      Math.abs(hsl1.h - hsl2.h),
      360 - Math.abs(hsl1.h - hsl2.h)
    );
    
    // Weight the differences
    const hueWeight = 2;
    const satWeight = 1;
    const lightWeight = 1;

    const distance = Math.sqrt(
      Math.pow(hueDiff * hueWeight, 2) +
      Math.pow((hsl1.s - hsl2.s) * satWeight, 2) +
      Math.pow((hsl1.l - hsl2.l) * lightWeight, 2)
    );

    return distance;
  }

  // Generate harmonious colors based on a base color
  generateHarmoniousColors(baseColor, harmonyType = 'complementary') {
    const baseHsl = this.hexToHsl(baseColor);
    const colors = [baseColor];

    switch (harmonyType) {
      case 'complementary':
        colors.push(this.hslToHex(
          (baseHsl.h + 180) % 360,
          baseHsl.s,
          baseHsl.l
        ));
        break;

      case 'triadic':
        colors.push(
          this.hslToHex((baseHsl.h + 120) % 360, baseHsl.s, baseHsl.l),
          this.hslToHex((baseHsl.h + 240) % 360, baseHsl.s, baseHsl.l)
        );
        break;

      case 'analogous':
        colors.push(
          this.hslToHex((baseHsl.h + 30) % 360, baseHsl.s, baseHsl.l),
          this.hslToHex((baseHsl.h - 30 + 360) % 360, baseHsl.s, baseHsl.l)
        );
        break;

      case 'splitComplementary':
        colors.push(
          this.hslToHex((baseHsl.h + 150) % 360, baseHsl.s, baseHsl.l),
          this.hslToHex((baseHsl.h + 210) % 360, baseHsl.s, baseHsl.l)
        );
        break;

      case 'monochromatic':
        // Vary saturation and lightness
        colors.push(
          this.hslToHex(baseHsl.h, Math.max(10, baseHsl.s - 30), baseHsl.l),
          this.hslToHex(baseHsl.h, Math.min(90, baseHsl.s + 20), Math.max(10, baseHsl.l - 20)),
          this.hslToHex(baseHsl.h, baseHsl.s, Math.min(90, baseHsl.l + 20))
        );
        break;
    }

    return colors;
  }

  // Score color compatibility between two sets of colors
  calculateColorCompatibility(colors1, colors2) {
    if (!colors1 || !colors2 || colors1.length === 0 || colors2.length === 0) {
      return 0;
    }

    let totalScore = 0;
    let comparisons = 0;

    for (const color1 of colors1) {
      for (const color2 of colors2) {
        try {
          const distance = this.calculateColorDistance(color1, color2);
          
          // Score based on color harmony principles
          let score = 0;
          
          // Check for complementary colors (high score)
          if (distance > 150 && distance < 210) {
            score += 0.9;
          }
          
          // Check for analogous colors (medium score)
          if (distance < 50) {
            score += 0.7;
          }
          
          // Check for triadic harmony
          if (distance > 100 && distance < 140) {
            score += 0.8;
          }
          
          // Penalize very similar colors (boring)
          if (distance < 20) {
            score -= 0.3;
          }
          
          // Penalize harsh contrasts
          if (distance > 250) {
            score -= 0.2;
          }

          totalScore += Math.max(0, score);
          comparisons++;
        } catch (error) {
          console.error('Error calculating color distance:', error);
        }
      }
    }

    return comparisons > 0 ? totalScore / comparisons : 0;
  }

  // Get color palette suggestions for room coordination
  getRoomColorPalette(primaryColor, roomType = 'living') {
    const primaryHsl = this.hexToHsl(primaryColor);
    
    // Room-specific color suggestions
    const roomPalettes = {
      living: {
        accent: this.generateHarmoniousColors(primaryColor, 'complementary'),
        neutral: this.generateNeutralColors(primaryHsl),
        secondary: this.generateHarmoniousColors(primaryColor, 'analogous')
      },
      bedroom: {
        accent: this.generateHarmoniousColors(primaryColor, 'monochromatic'),
        neutral: this.generateWarmNeutrals(),
        secondary: this.generateHarmoniousColors(primaryColor, 'analogous')
      },
      kitchen: {
        accent: this.generateHarmoniousColors(primaryColor, 'complementary'),
        neutral: this.generateCoolNeutrals(),
        secondary: this.generateHarmoniousColors(primaryColor, 'splitComplementary')
      },
      dining: {
        accent: this.generateHarmoniousColors(primaryColor, 'triadic'),
        neutral: this.generateWarmNeutrals(),
        secondary: this.generateHarmoniousColors(primaryColor, 'analogous')
      }
    };

    return roomPalettes[roomType] || roomPalettes.living;
  }

  // Generate neutral colors that work with any palette
  generateNeutralColors(baseHsl) {
    return [
      '#F5F5F5', // Light gray
      '#E8E8E8', // Medium light gray
      '#D3D3D3', // Medium gray
      '#FFFFFF', // White
      '#F9F9F9', // Off white
      this.hslToHex(baseHsl.h, 5, 85), // Very light version of base hue
      this.hslToHex(baseHsl.h, 10, 75)  // Light version of base hue
    ];
  }

  generateWarmNeutrals() {
    return [
      '#F5F5DC', // Beige
      '#FAF0E6', // Linen
      '#FDF5E6', // Old lace
      '#FFFAF0', // Floral white
      '#F5DEB3', // Wheat
      '#DEB887', // Burlywood
      '#D2B48C'  // Tan
    ];
  }

  generateCoolNeutrals() {
    return [
      '#F0F8FF', // Alice blue
      '#F5F5F5', // White smoke
      '#E6E6FA', // Lavender
      '#F0FFFF', // Azure
      '#F8F8FF', // Ghost white
      '#E0E0E0', // Light gray
      '#D3D3D3'  // Light gray
    ];
  }

  // Advanced color matching for furniture coordination
  findColorMatches(targetColors, candidateItems, options = {}) {
    const {
      harmonyType = 'complementary',
      toleranceLevel = 0.5,
      includeNeutrals = true,
      roomType = 'living'
    } = options;

    return candidateItems.map(item => {
      let score = 0;
      
      // Parse item colors
      const itemColors = Array.isArray(item.colors) ? item.colors : 
                        (typeof item.colors === 'string' ? JSON.parse(item.colors || '[]') : []);
      
      if (itemColors.length === 0) {
        return { ...item, colorMatchScore: 0, matchReason: 'No colors available' };
      }

      // Calculate compatibility score
      const compatibilityScore = this.calculateColorCompatibility(targetColors, itemColors);
      score += compatibilityScore * 0.4;

      // Check for harmonious color relationships
      const harmonies = this.findColorHarmonies(targetColors, itemColors);
      score += harmonies.score * 0.3;

      // Room-specific color preferences
      const roomPalette = this.getRoomColorPalette(targetColors[0], roomType);
      const roomScore = this.calculateRoomColorScore(itemColors, roomPalette);
      score += roomScore * 0.2;

      // Neutral color bonus
      if (includeNeutrals) {
        const neutralScore = this.calculateNeutralScore(itemColors);
        score += neutralScore * 0.1;
      }

      // Generate match reason
      let matchReason = '';
      if (harmonies.type) {
        matchReason = `${harmonies.type} color harmony`;
      } else if (compatibilityScore > 0.6) {
        matchReason = 'Good color compatibility';
      } else if (neutralScore > 0.7) {
        matchReason = 'Neutral coordination';
      } else {
        matchReason = 'Basic color match';
      }

      return {
        ...item,
        colorMatchScore: Math.min(1, Math.max(0, score)),
        matchReason,
        harmonies,
        compatibilityScore
      };
    }).sort((a, b) => b.colorMatchScore - a.colorMatchScore);
  }

  findColorHarmonies(colors1, colors2) {
    let bestHarmony = { type: null, score: 0 };

    for (const color1 of colors1) {
      for (const color2 of colors2) {
        const hsl1 = this.hexToHsl(color1);
        const hsl2 = this.hexToHsl(color2);
        
        const hueDiff = Math.min(
          Math.abs(hsl1.h - hsl2.h),
          360 - Math.abs(hsl1.h - hsl2.h)
        );

        // Check different harmony types
        if (Math.abs(hueDiff - 180) < 15) {
          if (bestHarmony.score < 0.9) {
            bestHarmony = { type: 'complementary', score: 0.9 };
          }
        } else if (Math.abs(hueDiff - 120) < 15 || Math.abs(hueDiff - 240) < 15) {
          if (bestHarmony.score < 0.8) {
            bestHarmony = { type: 'triadic', score: 0.8 };
          }
        } else if (hueDiff < 30) {
          if (bestHarmony.score < 0.7) {
            bestHarmony = { type: 'analogous', score: 0.7 };
          }
        } else if (Math.abs(hueDiff - 150) < 15 || Math.abs(hueDiff - 210) < 15) {
          if (bestHarmony.score < 0.75) {
            bestHarmony = { type: 'split-complementary', score: 0.75 };
          }
        }
      }
    }

    return bestHarmony;
  }

  calculateRoomColorScore(itemColors, roomPalette) {
    const allRoomColors = [
      ...roomPalette.accent,
      ...roomPalette.neutral,
      ...roomPalette.secondary
    ];

    let bestScore = 0;
    for (const itemColor of itemColors) {
      for (const roomColor of allRoomColors) {
        const distance = this.calculateColorDistance(itemColor, roomColor);
        const score = Math.max(0, 1 - distance / 300);
        bestScore = Math.max(bestScore, score);
      }
    }

    return bestScore;
  }

  calculateNeutralScore(colors) {
    const neutrals = this.generateNeutralColors({ h: 0, s: 0, l: 50 });
    let score = 0;

    for (const color of colors) {
      const hsl = this.hexToHsl(color);
      // Low saturation indicates neutral
      if (hsl.s < 20) {
        score += 0.3;
      }
      // Check against known neutrals
      for (const neutral of neutrals) {
        const distance = this.calculateColorDistance(color, neutral);
        if (distance < 50) {
          score += 0.4;
          break;
        }
      }
    }

    return Math.min(1, score / colors.length);
  }
}

module.exports = new ColorMatchingService();