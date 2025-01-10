import { VercelRequest, VercelResponse } from '@vercel/node';
import { createMocks } from 'node-mocks-http';
import { flightSearchHandler } from '../../../api/flights/search';
import { FlightCacheService } from '../../services/flightCacheService';
import { AmadeusService, AmadeusFlightResponse } from '../../services/amadeusService';
import { CachedFlightRoute } from '../../types/cache';

jest.mock('../../services/flightCacheService');
jest.mock('../../services/amadeusService');

describe('Flight Search Endpoint', () => {
  const mockAmadeusResponse: AmadeusFlightResponse = {
    carrier: 'AA',
    flightNumber: '123',
    origin: {
      code: 'SFO',
      city: 'San Francisco',
      timezone: 'America/Los_Angeles'
    },
    destination: {
      code: 'JFK',
      city: 'New York',
      timezone: 'America/New_York'
    },
    distance: 2586,
    typicalDuration: 480
  };

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
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should return 405 for non-GET requests', async () => {
      const { req, res } = createMocks({
        method: 'POST'
      });

      await flightSearchHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
      
      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method not allowed'
      });
    });

    it('should return 400 when required parameters are missing', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {}
      });

      await flightSearchHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
      
      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Missing required parameters',
        details: 'carrier and flightNumber are required'
      });
    });
  });

  describe('Flight Search', () => {
    it('should return cached flight when available', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          carrier: 'AA',
          flightNumber: '123'
        }
      });

      jest.spyOn(FlightCacheService.prototype, 'getFlightRoute')
        .mockResolvedValue(mockFlightRoute);

      await flightSearchHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
      
      expect(res._getStatusCode()).toBe(200);
      const response = JSON.parse(res._getData());
      expect(response.data).toEqual(mockFlightRoute);
      expect(response.source).toBe('cache');
      expect(response._meta.responseTime).toBeDefined();
    });

    it('should fetch from Amadeus when not in cache', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          carrier: 'AA',
          flightNumber: '123'
        }
      });

      jest.spyOn(FlightCacheService.prototype, 'getFlightRoute')
        .mockResolvedValue(null);
      jest.spyOn(AmadeusService.prototype, 'searchFlight')
        .mockResolvedValue(mockAmadeusResponse);

      await flightSearchHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
      
      expect(res._getStatusCode()).toBe(200);
      const response = JSON.parse(res._getData());
      expect(response.data).toEqual(expect.objectContaining({
        carrier: mockAmadeusResponse.carrier,
        flightNumber: mockAmadeusResponse.flightNumber,
        origin: mockAmadeusResponse.origin,
        destination: mockAmadeusResponse.destination
      }));
      expect(response.source).toBe('amadeus');
      expect(response._meta.responseTime).toBeDefined();
    });

    it('should return 404 when flight not found', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          carrier: 'AA',
          flightNumber: '999'
        }
      });

      jest.spyOn(FlightCacheService.prototype, 'getFlightRoute')
        .mockResolvedValue(null);
      jest.spyOn(AmadeusService.prototype, 'searchFlight')
        .mockResolvedValue(null);

      await flightSearchHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
      
      expect(res._getStatusCode()).toBe(404);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Flight not found',
        details: 'No flight information available for the given carrier and flight number'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Amadeus API errors gracefully', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          carrier: 'AA',
          flightNumber: '123'
        }
      });

      jest.spyOn(FlightCacheService.prototype, 'getFlightRoute')
        .mockResolvedValue(null);
      jest.spyOn(AmadeusService.prototype, 'searchFlight')
        .mockRejectedValue(new Error('Amadeus API error'));

      await flightSearchHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
      
      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Internal server error',
        details: 'An error occurred while searching for flights'
      });
    });

    it('should handle cache service errors gracefully', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          carrier: 'AA',
          flightNumber: '123'
        }
      });

      jest.spyOn(FlightCacheService.prototype, 'getFlightRoute')
        .mockRejectedValue(new Error('Redis error'));

      await flightSearchHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
      
      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Internal server error',
        details: 'An error occurred while searching for flights'
      });
    });
  });
}); 