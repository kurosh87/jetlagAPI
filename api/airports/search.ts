import { VercelRequest, VercelResponse } from '@vercel/node';
import { FlightCacheService } from '../../src/services/flightCacheService';
import { AirportCacheService } from '../../src/services/airportCacheService';
import { AmadeusService } from '../../src/services/amadeusService';

const flightCache = new FlightCacheService();
const airportCache = new AirportCacheService();
const amadeus = new AmadeusService({
  clientId: process.env.AMADEUS_CLIENT_ID!,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET!
});

export async function airportSearchHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, city, query } = req.query;

  if (!code && !city && !query) {
    return res.status(400).json({
      error: 'Missing search parameter',
      details: 'Please provide either code, city, or query parameter'
    });
  }

  const startTime = Date.now();

  try {
    // If searching by IATA code
    if (code) {
      const cachedAirport = await airportCache.getAirport(code as string);
      
      if (cachedAirport) {
        return res.status(200).json({
          data: cachedAirport,
          source: 'cache',
          _meta: {
            responseTime: Date.now() - startTime
          }
        });
      }

      // If not in cache, search using Amadeus
      const airports = await amadeus.searchAirport(code as string);
      
      if (airports.length === 0) {
        return res.status(404).json({
          error: 'Airport not found',
          details: 'No airport found with the provided IATA code'
        });
      }

      const airport = airports[0];
      
      // Cache the airport data
      await airportCache.cacheAirport({
        ...airport,
        lastUpdated: new Date().toISOString(),
        cacheHits: 0
      });

      return res.status(200).json({
        data: airport,
        source: 'amadeus',
        _meta: {
          responseTime: Date.now() - startTime
        }
      });
    }

    // If searching by city or general query
    const searchTerm = (city || query) as string;
    const airports = await amadeus.searchAirport(searchTerm);

    if (airports.length === 0) {
      return res.status(404).json({
        error: 'No airports found',
        details: 'No airports match the search criteria'
      });
    }

    // Cache all airports from the search results
    await Promise.all(
      airports.map(airport =>
        airportCache.cacheAirport({
          ...airport,
          lastUpdated: new Date().toISOString(),
          cacheHits: 0
        })
      )
    );

    return res.status(200).json({
      data: airports,
      source: 'amadeus',
      _meta: {
        responseTime: Date.now() - startTime
      }
    });
  } catch (error) {
    console.error('Error searching airports:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: 'An error occurred while searching for airports'
    });
  }
} 