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

export async function flightSearchHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { carrier, flightNumber } = req.query;

  if (!carrier || !flightNumber) {
    return res.status(400).json({
      error: 'Missing required parameters',
      details: 'carrier and flightNumber are required'
    });
  }

  const startTime = Date.now();

  try {
    // Try to get from cache first
    const cachedRoute = await flightCache.getFlightRoute(
      carrier as string,
      flightNumber as string
    );

    if (cachedRoute) {
      return res.status(200).json({
        data: cachedRoute,
        source: 'cache',
        _meta: {
          responseTime: Date.now() - startTime
        }
      });
    }

    // If not in cache, fetch from Amadeus
    const flightData = await amadeus.searchFlight(
      carrier as string,
      flightNumber as string
    );

    if (!flightData) {
      return res.status(404).json({
        error: 'Flight not found',
        details: 'No flight information available for the given carrier and flight number'
      });
    }

    // Get airport details
    const originAirport = await airportCache.getAirport(flightData.origin.code);
    const destinationAirport = await airportCache.getAirport(flightData.destination.code);

    // Prepare the route data
    const routeData = {
      ...flightData,
      origin: {
        ...flightData.origin,
        coordinates: originAirport?.coordinates
      },
      destination: {
        ...flightData.destination,
        coordinates: destinationAirport?.coordinates
      }
    };

    // Cache the route data
    await flightCache.cacheFlightRoute(
      carrier as string,
      flightNumber as string,
      routeData
    );

    return res.status(200).json({
      data: routeData,
      source: 'amadeus',
      _meta: {
        responseTime: Date.now() - startTime
      }
    });
  } catch (error) {
    console.error('Error searching flight:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: 'An error occurred while searching for flights'
    });
  }
} 