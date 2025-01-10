import Redis from 'ioredis';
import { CachedFlightRoute, CacheStats } from '../types/cache';

export class FlightCacheService {
  private redis: Redis;
  private readonly FLIGHT_PREFIX = 'flight:';
  private readonly STATS_KEY = 'flight_cache:stats';
  private readonly DEFAULT_TTL = 24 * 60 * 60; // 24 hours in seconds

  constructor(redisClient?: Redis) {
    this.redis = redisClient || new Redis(process.env.REDIS_URL!);
  }

  private generateFlightKey(carrier: string, flightNumber: string): string {
    return `${this.FLIGHT_PREFIX}${carrier}:${flightNumber}`;
  }

  async getFlightRoute(carrier: string, flightNumber: string): Promise<CachedFlightRoute | null> {
    const key = this.generateFlightKey(carrier, flightNumber);
    const startTime = Date.now();
    
    try {
      const cachedData = await this.redis.get(key);
      
      if (!cachedData) {
        await this.updateStats({ hit: false, responseTime: Date.now() - startTime });
        return null;
      }

      const flightRoute = JSON.parse(cachedData) as CachedFlightRoute;
      
      // Update cache hits
      await this.redis.hset(key, 'cacheHits', (flightRoute.cacheHits + 1).toString());
      await this.updateStats({ hit: true, responseTime: Date.now() - startTime });
      
      return {
        ...flightRoute,
        cacheHits: flightRoute.cacheHits + 1
      };
    } catch (error) {
      console.error('Error retrieving flight route from cache:', error);
      return null;
    }
  }

  async cacheFlightRoute(flightRoute: CachedFlightRoute): Promise<void> {
    const key = this.generateFlightKey(flightRoute.carrier, flightRoute.flightNumber);
    
    try {
      await this.redis.setex(
        key,
        this.DEFAULT_TTL,
        JSON.stringify(flightRoute)
      );

      await this.updateCacheSize(1);
    } catch (error) {
      console.error('Error caching flight route:', error);
    }
  }

  async invalidateCache(carrier: string, flightNumber: string): Promise<void> {
    const key = this.generateFlightKey(carrier, flightNumber);
    
    try {
      await this.redis.del(key);
      await this.updateCacheSize(-1);
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }

  private async updateStats({ hit, responseTime }: { hit: boolean, responseTime: number }): Promise<void> {
    try {
      const stats = await this.getStats();
      
      const updatedStats: CacheStats = {
        hits: hit ? stats.hits + 1 : stats.hits,
        misses: hit ? stats.misses : stats.misses + 1,
        lastCleared: stats.lastCleared,
        size: stats.size,
        avgResponseTime: (stats.avgResponseTime * (stats.hits + stats.misses) + responseTime) / (stats.hits + stats.misses + 1)
      };

      await this.redis.set(this.STATS_KEY, JSON.stringify(updatedStats));
    } catch (error) {
      console.error('Error updating cache stats:', error);
    }
  }

  private async updateCacheSize(delta: number): Promise<void> {
    try {
      const stats = await this.getStats();
      
      const updatedStats: CacheStats = {
        ...stats,
        size: Math.max(0, stats.size + delta)
      };

      await this.redis.set(this.STATS_KEY, JSON.stringify(updatedStats));
    } catch (error) {
      console.error('Error updating cache size:', error);
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const statsData = await this.redis.get(this.STATS_KEY);
      
      if (!statsData) {
        return {
          hits: 0,
          misses: 0,
          lastCleared: new Date().toISOString(),
          size: 0,
          avgResponseTime: 0
        };
      }

      return JSON.parse(statsData) as CacheStats;
    } catch (error) {
      console.error('Error retrieving cache stats:', error);
      return {
        hits: 0,
        misses: 0,
        lastCleared: new Date().toISOString(),
        size: 0,
        avgResponseTime: 0
      };
    }
  }

  async clearCache(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.FLIGHT_PREFIX}*`);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      const stats: CacheStats = {
        hits: 0,
        misses: 0,
        lastCleared: new Date().toISOString(),
        size: 0,
        avgResponseTime: 0
      };

      await this.redis.set(this.STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
} 