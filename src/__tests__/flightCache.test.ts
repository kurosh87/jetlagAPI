import Redis from 'ioredis';
import { FlightCacheService } from '../services/flightCacheService';
import { CachedFlightRoute } from '../types/cache';

jest.mock('ioredis');

describe('FlightCacheService', () => {
  let flightCache: FlightCacheService;
  let mockRedis: jest.Mocked<Redis>;

  const mockFlightRoute: CachedFlightRoute = {
    carrier: 'AA',
    flightNumber: '123',
    departureAirport: 'SFO',
    arrivalAirport: 'JFK',
    departureTime: '2024-01-01T08:00:00Z',
    arrivalTime: '2024-01-01T16:00:00Z',
    duration: 480,
    lastUpdated: new Date().toISOString(),
    cacheHits: 0
  };

  beforeEach(() => {
    mockRedis = new Redis() as jest.Mocked<Redis>;
    flightCache = new FlightCacheService(mockRedis);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFlightRoute', () => {
    it('should return null when flight route is not in cache', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await flightCache.getFlightRoute('AA', '123');
      
      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith('flight:AA:123');
    });

    it('should return cached flight route and update cache hits', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(mockFlightRoute));
      mockRedis.hset.mockResolvedValue(1);

      const result = await flightCache.getFlightRoute('AA', '123');
      
      expect(result).toEqual({
        ...mockFlightRoute,
        cacheHits: 1
      });
      expect(mockRedis.get).toHaveBeenCalledWith('flight:AA:123');
      expect(mockRedis.hset).toHaveBeenCalledWith('flight:AA:123', 'cacheHits', '1');
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const result = await flightCache.getFlightRoute('AA', '123');
      
      expect(result).toBeNull();
    });
  });

  describe('cacheFlightRoute', () => {
    it('should cache flight route with TTL', async () => {
      mockRedis.setex.mockResolvedValue('OK');

      await flightCache.cacheFlightRoute(mockFlightRoute);
      
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'flight:AA:123',
        24 * 60 * 60,
        JSON.stringify(mockFlightRoute)
      );
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis error'));

      await expect(flightCache.cacheFlightRoute(mockFlightRoute))
        .resolves.toBeUndefined();
    });
  });

  describe('invalidateCache', () => {
    it('should delete flight route from cache', async () => {
      mockRedis.del.mockResolvedValue(1);

      await flightCache.invalidateCache('AA', '123');
      
      expect(mockRedis.del).toHaveBeenCalledWith('flight:AA:123');
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      await expect(flightCache.invalidateCache('AA', '123'))
        .resolves.toBeUndefined();
    });
  });

  describe('Cache Stats', () => {
    const mockStats = {
      hits: 10,
      misses: 5,
      lastCleared: new Date().toISOString(),
      size: 15,
      avgResponseTime: 150
    };

    it('should update stats on cache hit', async () => {
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(mockFlightRoute))
        .mockResolvedValueOnce(JSON.stringify(mockStats));
      mockRedis.hset.mockResolvedValue(1);
      mockRedis.set.mockResolvedValue('OK');

      await flightCache.getFlightRoute('AA', '123');
      
      expect(mockRedis.set).toHaveBeenCalledWith(
        'flight_cache:stats',
        expect.stringContaining('"hits":11')
      );
    });

    it('should update stats on cache miss', async () => {
      mockRedis.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(JSON.stringify(mockStats));
      mockRedis.set.mockResolvedValue('OK');

      await flightCache.getFlightRoute('AA', '123');
      
      expect(mockRedis.set).toHaveBeenCalledWith(
        'flight_cache:stats',
        expect.stringContaining('"misses":6')
      );
    });

    it('should initialize stats when none exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const stats = await flightCache.getStats();
      
      expect(stats).toEqual({
        hits: 0,
        misses: 0,
        lastCleared: expect.any(String),
        size: 0,
        avgResponseTime: 0
      });
    });
  });

  describe('clearCache', () => {
    it('should clear all flight routes and reset stats', async () => {
      mockRedis.keys.mockResolvedValue(['flight:AA:123', 'flight:UA:456']);
      mockRedis.del.mockResolvedValue(2);
      mockRedis.set.mockResolvedValue('OK');

      await flightCache.clearCache();
      
      expect(mockRedis.keys).toHaveBeenCalledWith('flight:*');
      expect(mockRedis.del).toHaveBeenCalledWith('flight:AA:123', 'flight:UA:456');
      expect(mockRedis.set).toHaveBeenCalledWith(
        'flight_cache:stats',
        expect.stringContaining('"hits":0')
      );
    });

    it('should handle empty cache gracefully', async () => {
      mockRedis.keys.mockResolvedValue([]);
      mockRedis.set.mockResolvedValue('OK');

      await flightCache.clearCache();
      
      expect(mockRedis.del).not.toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalledWith(
        'flight_cache:stats',
        expect.stringContaining('"hits":0')
      );
    });
  });

  describe('close', () => {
    it('should close Redis connection', async () => {
      mockRedis.quit.mockResolvedValue('OK');

      await flightCache.close();
      
      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });
}); 