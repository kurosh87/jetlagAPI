import Redis from 'ioredis';

interface CachedAirport {
  iataCode: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  // Additional useful data
  elevation?: number;
  utcOffset?: number;
  daylightSavings?: boolean;
  type?: string; // international, domestic, etc.
  region?: string;
  // Cache metadata
  lastUpdated: string;
  cacheHits: number;
}

export class AirportCacheService {
  private redis: Redis;
  private readonly keyPrefix = 'airport:';
  private readonly searchIndexKey = 'airport:search:index';

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  private generateKey(iataCode: string): string {
    return `${this.keyPrefix}${iataCode.toUpperCase()}`;
  }

  async getAirport(iataCode: string): Promise<CachedAirport | null> {
    try {
      const key = this.generateKey(iataCode);
      const cachedData = await this.redis.get(key);
      
      if (!cachedData) {
        return null;
      }

      const airport = JSON.parse(cachedData) as CachedAirport;
      
      // Increment cache hits
      await this.redis.hset(key + ':meta', 'hits', (airport.cacheHits + 1).toString());
      
      return airport;
    } catch (error) {
      console.error('Error retrieving airport from cache:', error);
      return null;
    }
  }

  async cacheAirport(airport: Omit<CachedAirport, 'lastUpdated' | 'cacheHits'>): Promise<void> {
    try {
      const key = this.generateKey(airport.iataCode);
      const cacheData: CachedAirport = {
        ...airport,
        lastUpdated: new Date().toISOString(),
        cacheHits: 0
      };

      await this.redis.set(key, JSON.stringify(cacheData));
      
      // Store metadata separately
      await this.redis.hmset(key + ':meta', {
        'lastUpdated': cacheData.lastUpdated,
        'hits': '0'
      });

      // Add to search index
      await this.addToSearchIndex(airport);
    } catch (error) {
      console.error('Error caching airport:', error);
    }
  }

  private async addToSearchIndex(airport: Omit<CachedAirport, 'lastUpdated' | 'cacheHits'>): Promise<void> {
    try {
      // Create search tokens
      const searchTokens = [
        airport.iataCode.toLowerCase(),
        airport.city.toLowerCase(),
        airport.name.toLowerCase(),
        airport.country.toLowerCase(),
        ...(airport.region ? [airport.region.toLowerCase()] : [])
      ];

      // Add to search index with score based on airport type
      const score = airport.type === 'international' ? 2 : 1;
      
      await Promise.all(
        searchTokens.map(token =>
          this.redis.zadd(this.searchIndexKey, score, `${token}:${airport.iataCode}`)
        )
      );
    } catch (error) {
      console.error('Error adding airport to search index:', error);
    }
  }

  async searchAirports(query: string, limit: number = 10): Promise<CachedAirport[]> {
    try {
      const searchPattern = `*${query.toLowerCase()}*:*`;
      const results = await this.redis.zscan(this.searchIndexKey, 0, 'MATCH', searchPattern, 'COUNT', limit);
      
      if (!results[1].length) {
        return [];
      }

      // Extract IATA codes from results
      const iataCodes = results[1]
        .filter((_, index) => index % 2 === 0) // Filter out scores
        .map(result => result.split(':')[1]); // Get IATA code

      // Fetch full airport data for each code
      const airports = await Promise.all(
        iataCodes.map(code => this.getAirport(code))
      );

      return airports.filter((airport): airport is CachedAirport => airport !== null);
    } catch (error) {
      console.error('Error searching airports:', error);
      return [];
    }
  }

  async getCacheStats(iataCode: string): Promise<{
    lastUpdated: string;
    cacheHits: number;
  } | null> {
    try {
      const key = this.generateKey(iataCode);
      const meta = await this.redis.hgetall(key + ':meta');
      
      if (!meta.lastUpdated) {
        return null;
      }

      return {
        lastUpdated: meta.lastUpdated,
        cacheHits: parseInt(meta.hits, 10)
      };
    } catch (error) {
      console.error('Error retrieving cache stats:', error);
      return null;
    }
  }

  async invalidateCache(iataCode: string): Promise<void> {
    try {
      const key = this.generateKey(iataCode);
      const airport = await this.getAirport(iataCode);

      if (airport) {
        // Remove from search index
        const searchTokens = [
          airport.iataCode.toLowerCase(),
          airport.city.toLowerCase(),
          airport.name.toLowerCase(),
          airport.country.toLowerCase(),
          ...(airport.region ? [airport.region.toLowerCase()] : [])
        ];

        await Promise.all([
          this.redis.del(key, key + ':meta'),
          ...searchTokens.map(token =>
            this.redis.zrem(this.searchIndexKey, `${token}:${airport.iataCode}`)
          )
        ]);
      }
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
} 