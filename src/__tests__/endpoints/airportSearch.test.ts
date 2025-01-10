import { VercelRequest, VercelResponse } from '@vercel/node';
import { createMocks } from 'node-mocks-http';
import { airportSearchHandler } from '../../../api/airports/search';
import { AirportCacheService } from '../../services/airportCacheService';
import { AmadeusService } from '../../services/amadeusService';
import { CachedAirport } from '../../types/cache';

jest.mock('../../services/airportCacheService');
jest.mock('../../services/amadeusService');

describe('Airport Search Endpoint', () => {
  const mockAirport: CachedAirport = {
    iataCode: 'SFO',
    name: 'San Francisco International Airport',
    city: 'San Francisco',
    country: 'United States',
    timezone: 'America/Los_Angeles',
    coordinates: {
      latitude: 37.6189,
      longitude: -122.3750
    },
    lastUpdated: new Date().toISOString(),
    cacheHits: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should return 405 for non-GET requests', async () => {
      const { req, res } = createMocks({
        method: 'POST'
      });

      await airportSearchHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
      
      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method not allowed'
      });
    });

    it('should return 400 when no search parameters are provided', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {}
      });

      await airportSearchHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
      
      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Missing search parameter',
        details: 'Please provide either code, city, or query parameter'
      });
    });
  });

  describe('IATA Code Search', () => {
    it('should return cached airport when available', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { code: 'SFO' }
      });

      jest.spyOn(AirportCacheService.prototype, 'getAirport')
        .mockResolvedValue(mockAirport);

      await airportSearchHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
      
      expect(res._getStatusCode()).toBe(200);
      const response = JSON.parse(res._getData());
      expect(response.data).toEqual(mockAirport);
      expect(response.source).toBe('cache');
      expect(response._meta.responseTime).toBeDefined();
    });

    it('should fetch from Amadeus when not in cache', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { code: 'SFO' }
      });

      jest.spyOn(AirportCacheService.prototype, 'getAirport')
        .mockResolvedValue(null);
      jest.spyOn(AmadeusService.prototype, 'searchAirport')
        .mockResolvedValue([mockAirport]);

      await airportSearchHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
      
      expect(res._getStatusCode()).toBe(200);
      const response = JSON.parse(res._getData());
      expect(response.data).toEqual(mockAirport);
      expect(response.source).toBe('amadeus');
      expect(response._meta.responseTime).toBeDefined();
    });

    it('should return 404 when airport not found', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { code: 'XXX' }
      });

      jest.spyOn(AirportCacheService.prototype, 'getAirport')
        .mockResolvedValue(null);
      jest.spyOn(AmadeusService.prototype, 'searchAirport')
        .mockResolvedValue([]);

      await airportSearchHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
      
      expect(res._getStatusCode()).toBe(404);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Airport not found',
        details: 'No airport found with the provided IATA code'
      });
    });
  });

  describe('City/Query Search', () => {
    const mockAirports = [
      mockAirport,
      {
        ...mockAirport,
        iataCode: 'OAK',
        name: 'Oakland International Airport'
      }
    ];

    it('should search airports by city', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { city: 'San Francisco' }
      });

      jest.spyOn(AmadeusService.prototype, 'searchAirport')
        .mockResolvedValue(mockAirports);

      await airportSearchHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
      
      expect(res._getStatusCode()).toBe(200);
      const response = JSON.parse(res._getData());
      expect(response.data).toEqual(mockAirports);
      expect(response.source).toBe('amadeus');
      expect(response._meta.responseTime).toBeDefined();
    });

    it('should search airports by general query', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'San' }
      });

      jest.spyOn(AmadeusService.prototype, 'searchAirport')
        .mockResolvedValue(mockAirports);

      await airportSearchHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
      
      expect(res._getStatusCode()).toBe(200);
      const response = JSON.parse(res._getData());
      expect(response.data).toEqual(mockAirports);
      expect(response.source).toBe('amadeus');
      expect(response._meta.responseTime).toBeDefined();
    });

    it('should return 404 when no airports found', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { city: 'NonexistentCity' }
      });

      jest.spyOn(AmadeusService.prototype, 'searchAirport')
        .mockResolvedValue([]);

      await airportSearchHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
      
      expect(res._getStatusCode()).toBe(404);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'No airports found',
        details: 'No airports match the search criteria'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle internal server errors', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { code: 'SFO' }
      });

      jest.spyOn(AirportCacheService.prototype, 'getAirport')
        .mockRejectedValue(new Error('Database error'));

      await airportSearchHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
      
      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Internal server error',
        details: 'An error occurred while searching for airports'
      });
    });
  });
}); 