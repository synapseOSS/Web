import { Injectable, signal } from '@angular/core';

/**
 * Performance optimization service for story feature
 * Implements:
 * - Media compression pipeline
 * - Thumbnail generation
 * - Lazy loading for story feed
 * - Image preloading for next stories
 * - Client-side caching
 * - Debouncing for real-time updates
 * 
 * Requirements: 11.1-11.10
 */
@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  // Cache for story data
  private storyCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Cache for media URLs
  private mediaCache = new Map<string, string>();

  // Preload queue
  private preloadQueue: string[] = [];
  private preloadedImages = new Set<string>();

  // Debounce timers
  private debounceTimers = new Map<string, any>();

  // Performance metrics
  metrics = signal({
    cacheHits: 0,
    cacheMisses: 0,
    preloadedImages: 0,
    compressionSavings: 0
  });

  /**
   * Compress image file
   * Requirement 11.2: Media compression
   */
  async compressImage(file: File, options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'webp' | 'png';
  } = {}): Promise<File> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.85,
      format = 'jpeg'
    } = options;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve(file); // Return original if canvas not supported
            return;
          }

          // Calculate new dimensions maintaining aspect ratio
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          // Use high-quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with specified format and quality
          const mimeType = `image/${format}`;
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const originalSize = file.size;
                const compressedSize = blob.size;
                const savings = originalSize - compressedSize;
                
                // Update metrics
                const current = this.metrics();
                this.metrics.set({
                  ...current,
                  compressionSavings: current.compressionSavings + savings
                });

                const compressedFile = new File([blob], file.name, {
                  type: mimeType,
                  lastModified: Date.now()
                });
                
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            mimeType,
            quality
          );
        };

        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };

      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generate thumbnail from image or video
   * Requirement 11.2: Thumbnail generation
   */
  async generateThumbnail(file: File, options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}): Promise<Blob | null> {
    const {
      width = 200,
      height = 200,
      quality = 0.7
    } = options;

    if (file.type.startsWith('image/')) {
      return this.generateImageThumbnail(file, width, height, quality);
    } else if (file.type.startsWith('video/')) {
      return this.generateVideoThumbnail(file, width, height, quality);
    }

    return null;
  }

  /**
   * Generate thumbnail from image
   */
  private async generateImageThumbnail(
    file: File,
    width: number,
    height: number,
    quality: number
  ): Promise<Blob | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve(null);
            return;
          }

          // Calculate dimensions to maintain aspect ratio
          const aspectRatio = img.width / img.height;
          let thumbWidth = width;
          let thumbHeight = height;

          if (aspectRatio > 1) {
            thumbHeight = width / aspectRatio;
          } else {
            thumbWidth = height * aspectRatio;
          }

          canvas.width = thumbWidth;
          canvas.height = thumbHeight;

          ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);

          canvas.toBlob(
            (blob) => resolve(blob),
            'image/jpeg',
            quality
          );
        };

        img.onerror = () => resolve(null);
        img.src = e.target?.result as string;
      };

      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generate thumbnail from video
   */
  private async generateVideoThumbnail(
    file: File,
    width: number,
    height: number,
    quality: number
  ): Promise<Blob | null> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(null);
        return;
      }

      video.preload = 'metadata';
      video.muted = true;

      video.onloadedmetadata = () => {
        // Seek to 1 second or 10% of video duration
        video.currentTime = Math.min(1, video.duration * 0.1);
      };

      video.onseeked = () => {
        // Calculate dimensions
        const aspectRatio = video.videoWidth / video.videoHeight;
        let thumbWidth = width;
        let thumbHeight = height;

        if (aspectRatio > 1) {
          thumbHeight = width / aspectRatio;
        } else {
          thumbWidth = height * aspectRatio;
        }

        canvas.width = thumbWidth;
        canvas.height = thumbHeight;

        ctx.drawImage(video, 0, 0, thumbWidth, thumbHeight);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(video.src);
            resolve(blob);
          },
          'image/jpeg',
          quality
        );
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(null);
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Cache story data
   * Requirement 11.5: Client-side caching
   */
  cacheStory(storyId: string, data: any): void {
    this.storyCache.set(storyId, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get cached story data
   * Requirement 11.5: Client-side caching
   */
  getCachedStory(storyId: string): any | null {
    const cached = this.storyCache.get(storyId);
    
    if (!cached) {
      const current = this.metrics();
      this.metrics.set({ ...current, cacheMisses: current.cacheMisses + 1 });
      return null;
    }

    // Check if cache is still valid
    const age = Date.now() - cached.timestamp;
    if (age > this.CACHE_TTL) {
      this.storyCache.delete(storyId);
      const current = this.metrics();
      this.metrics.set({ ...current, cacheMisses: current.cacheMisses + 1 });
      return null;
    }

    const current = this.metrics();
    this.metrics.set({ ...current, cacheHits: current.cacheHits + 1 });
    return cached.data;
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.storyCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.storyCache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.storyCache.clear();
    this.mediaCache.clear();
    this.preloadedImages.clear();
  }

  /**
   * Preload images for next stories
   * Requirement 11.4: Image preloading
   */
  preloadImages(urls: string[]): void {
    // Add to queue
    for (const url of urls) {
      if (!this.preloadedImages.has(url) && !this.preloadQueue.includes(url)) {
        this.preloadQueue.push(url);
      }
    }

    // Process queue
    this.processPreloadQueue();
  }

  /**
   * Process preload queue
   */
  private processPreloadQueue(): void {
    // Limit concurrent preloads to 3
    const MAX_CONCURRENT = 3;
    let processing = 0;

    while (this.preloadQueue.length > 0 && processing < MAX_CONCURRENT) {
      const url = this.preloadQueue.shift();
      if (!url) continue;

      processing++;
      this.preloadImage(url).finally(() => {
        processing--;
        if (this.preloadQueue.length > 0) {
          this.processPreloadQueue();
        }
      });
    }
  }

  /**
   * Preload single image
   */
  private async preloadImage(url: string): Promise<void> {
    return new Promise((resolve) => {
      if (this.preloadedImages.has(url)) {
        resolve();
        return;
      }

      const img = new Image();
      
      img.onload = () => {
        this.preloadedImages.add(url);
        const current = this.metrics();
        this.metrics.set({
          ...current,
          preloadedImages: current.preloadedImages + 1
        });
        resolve();
      };

      img.onerror = () => {
        // Still mark as attempted to avoid retrying
        this.preloadedImages.add(url);
        resolve();
      };

      img.src = url;
    });
  }

  /**
   * Check if image is preloaded
   */
  isPreloaded(url: string): boolean {
    return this.preloadedImages.has(url);
  }

  /**
   * Debounce function calls
   * Requirement 11.6: Debouncing for real-time updates
   */
  debounce<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay: number = 300
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      // Clear existing timer
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key));
      }

      // Set new timer
      const timer = setTimeout(() => {
        fn(...args);
        this.debounceTimers.delete(key);
      }, delay);

      this.debounceTimers.set(key, timer);
    };
  }

  /**
   * Throttle function calls
   * Requirement 11.6: Throttling for real-time updates
   */
  throttle<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay: number = 300
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;

    return (...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCall >= delay) {
        lastCall = now;
        fn(...args);
      }
    };
  }

  /**
   * Lazy load images with Intersection Observer
   * Requirement 11.3: Lazy loading for story feed
   */
  createLazyLoader(options: {
    rootMargin?: string;
    threshold?: number;
  } = {}): IntersectionObserver {
    const {
      rootMargin = '50px',
      threshold = 0.01
    } = options;

    return new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset['src'];
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
          }
        }
      });
    }, {
      rootMargin,
      threshold
    });
  }

  /**
   * Batch multiple operations
   */
  batch<T>(
    operations: Array<() => Promise<T>>,
    batchSize: number = 5
  ): Promise<T[]> {
    const results: T[] = [];
    
    const processBatch = async (startIndex: number): Promise<void> => {
      const batch = operations.slice(startIndex, startIndex + batchSize);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);
      
      if (startIndex + batchSize < operations.length) {
        await processBatch(startIndex + batchSize);
      }
    };

    return processBatch(0).then(() => results);
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return this.metrics();
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics.set({
      cacheHits: 0,
      cacheMisses: 0,
      preloadedImages: 0,
      compressionSavings: 0
    });
  }

  /**
   * Cleanup on service destroy
   */
  cleanup(): void {
    // Clear all timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Clear caches
    this.clearCache();
  }
}
