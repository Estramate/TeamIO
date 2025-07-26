import { logger } from '../logger';

interface CacheItem<T> {
  value: T;
  expiry: number;
}

export class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private static instance: MemoryCache;

  static getInstance(): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache();
    }
    return MemoryCache.instance;
  }

  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiry });
    
    logger.debug('Cache SET', { key, ttlSeconds });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      logger.debug('Cache MISS', { key });
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      logger.debug('Cache EXPIRED', { key });
      return null;
    }

    logger.debug('Cache HIT', { key });
    return item.value;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug('Cache DELETE', { key });
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    logger.debug('Cache CLEAR');
  }

  // Cache with function execution
  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    this.set(key, value, ttlSeconds);
    return value;
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug('Cache cleanup', { cleaned });
    }
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Auto cleanup every 5 minutes
setInterval(() => {
  MemoryCache.getInstance().cleanup();
}, 5 * 60 * 1000);