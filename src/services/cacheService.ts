import NodeCache from 'node-cache';

class CacheService {
  private static instance: CacheService;
  private cache: NodeCache;

  private constructor() {
    this.cache = new NodeCache({
      stdTTL: 3600, // 1 hour default TTL
      checkperiod: 600 // Check for expired keys every 10 minutes
    });
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  public async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get<T>(key);
  }

  public async set<T>(
    key: string,
    value: T,
    ttl: number = 3600
  ): Promise<boolean> {
    return this.cache.set(key, value, ttl);
  }

  public async delete(key: string): Promise<number> {
    return this.cache.del(key);
  }

  public async flush(): Promise<void> {
    this.cache.flushAll();
  }

  public generateKey(...args: any[]): string {
    return args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(':');
  }
}

export const cacheService = CacheService.getInstance(); 