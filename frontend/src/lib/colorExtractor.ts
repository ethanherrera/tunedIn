import React from 'react';

/**
 * Extracts multiple colors from an image URL and combines them for a vibrant glow
 * @param imageUrl URL of the image to extract colors from
 * @returns Promise that resolves to a CSS color string
 */
export async function extractDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    // Default color in case extraction fails
    const defaultColor = 'rgba(59, 130, 246, 0.6)'; // Default blue glow
    
    if (!imageUrl) {
      resolve(defaultColor);
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Handle CORS
    
    img.onload = () => {
      try {
        // Create canvas and context
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(defaultColor);
          return;
        }
        
        // Set canvas size to a small sample (for performance)
        const sampleSize = 50;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
        
        // Extract colors from different regions of the image
        const colors = extractColorsFromRegions(imageData, sampleSize);
        
        // Combine the colors for a vibrant glow
        const combinedColor = combineColors(colors);
        
        resolve(combinedColor);
      } catch (error) {
        console.error('Error extracting color:', error);
        resolve(defaultColor);
      }
    };
    
    img.onerror = () => {
      resolve(defaultColor);
    };
    
    img.src = imageUrl;
  });
}

/**
 * Extract colors from different regions of the image
 * @param imageData The raw image data
 * @param size The size of the image sample
 * @returns Array of RGB colors
 */
function extractColorsFromRegions(imageData: Uint8ClampedArray, size: number): Array<{r: number, g: number, b: number}> {
  const colors: Array<{r: number, g: number, b: number}> = [];
  
  // Define regions to sample (center, corners, edges)
  const regions = [
    { name: 'center', x: Math.floor(size/4), y: Math.floor(size/4), width: Math.floor(size/2), height: Math.floor(size/2) },
    { name: 'topLeft', x: 0, y: 0, width: Math.floor(size/3), height: Math.floor(size/3) },
    { name: 'topRight', x: Math.floor(size*2/3), y: 0, width: Math.floor(size/3), height: Math.floor(size/3) },
    { name: 'bottomLeft', x: 0, y: Math.floor(size*2/3), width: Math.floor(size/3), height: Math.floor(size/3) },
    { name: 'bottomRight', x: Math.floor(size*2/3), y: Math.floor(size*2/3), width: Math.floor(size/3), height: Math.floor(size/3) }
  ];
  
  // Extract color from each region
  regions.forEach(region => {
    let r = 0, g = 0, b = 0, count = 0;
    
    // Loop through pixels in this region
    for (let y = region.y; y < region.y + region.height; y++) {
      for (let x = region.x; x < region.x + region.width; x++) {
        const index = (y * size + x) * 4;
        
        // Skip transparent pixels
        if (imageData[index + 3] < 128) continue;
        
        // Skip very light pixels (close to white)
        const brightness = (imageData[index] + imageData[index + 1] + imageData[index + 2]) / 3;
        if (brightness > 240) continue;
        
        r += imageData[index];
        g += imageData[index + 1];
        b += imageData[index + 2];
        count++;
      }
    }
    
    if (count > 0) {
      // Average values
      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);
      
      // Add to colors array if it's not too light
      const brightness = (r + g + b) / 3;
      if (brightness < 240) {
        colors.push({ r, g, b });
      }
    }
  });
  
  // If we didn't get any valid colors, add a default
  if (colors.length === 0) {
    colors.push({ r: 59, g: 130, b: 246 }); // Default blue
  }
  
  return colors;
}

/**
 * Combine multiple colors into a vibrant glow color
 * @param colors Array of RGB colors
 * @returns CSS color string
 */
function combineColors(colors: Array<{r: number, g: number, b: number}>): string {
  if (colors.length === 0) {
    return 'rgba(59, 130, 246, 0.6)'; // Default blue glow
  }
  
  if (colors.length === 1) {
    const { r, g, b } = colors[0];
    return `rgba(${r}, ${g}, ${b}, 0.7)`;
  }
  
  // Find the most vibrant color (highest saturation)
  let mostVibrantColor = colors[0];
  let highestSaturation = calculateSaturation(colors[0]);
  
  colors.forEach(color => {
    const saturation = calculateSaturation(color);
    if (saturation > highestSaturation) {
      highestSaturation = saturation;
      mostVibrantColor = color;
    }
  });
  
  // Enhance the vibrance
  const enhancedColor = enhanceVibrance(mostVibrantColor);
  
  return `rgba(${enhancedColor.r}, ${enhancedColor.g}, ${enhancedColor.b}, 0.7)`;
}

/**
 * Calculate the saturation of a color
 * @param color RGB color object
 * @returns Saturation value (0-1)
 */
function calculateSaturation(color: {r: number, g: number, b: number}): number {
  const { r, g, b } = color;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  // Avoid division by zero
  if (max === 0) return 0;
  
  return (max - min) / max;
}

/**
 * Enhance the vibrance of a color
 * @param color RGB color object
 * @returns Enhanced RGB color object
 */
function enhanceVibrance(color: {r: number, g: number, b: number}): {r: number, g: number, b: number} {
  const { r, g, b } = color;
  
  // Convert to HSL to adjust saturation
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  
  // Enhance colors that are too dark
  if (l < 0.3) {
    // Brighten dark colors
    return {
      r: Math.min(255, r * 1.5),
      g: Math.min(255, g * 1.5),
      b: Math.min(255, b * 1.5)
    };
  }
  
  // Enhance saturation for mid-range colors
  const enhanceFactor = 1.2;
  const avgColor = (r + g + b) / 3;
  
  return {
    r: Math.min(255, r + (r > avgColor ? (r - avgColor) * enhanceFactor : 0)),
    g: Math.min(255, g + (g > avgColor ? (g - avgColor) * enhanceFactor : 0)),
    b: Math.min(255, b + (b > avgColor ? (b - avgColor) * enhanceFactor : 0))
  };
}

/**
 * React hook to use the dominant color from an image
 * @param imageUrl URL of the image to extract color from
 * @returns Object with the dominant color and loading state
 */
export function useDominantColor(imageUrl: string | undefined) {
  const [color, setColor] = React.useState<string>('rgba(59, 130, 246, 0.6)');
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  
  React.useEffect(() => {
    if (!imageUrl) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    extractDominantColor(imageUrl)
      .then((dominantColor) => {
        setColor(dominantColor);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [imageUrl]);
  
  return { color, isLoading };
} 