import { Amadeus } from 'amadeus';

export interface AmadeusConfig {
  clientId: string;
  clientSecret: string;
}

export interface AmadeusFlightResponse {
  carrier: string;
  flightNumber: string;
  origin: {
    code: string;
    city: string;
    timezone: string;
  };
  destination: {
    code: string;
    city: string;
    timezone: string;
  };
  distance: number;
  typicalDuration: number;
}

export class AmadeusService {
  private amadeus: Amadeus;
  private rateLimiter: {
    lastRequest: number;
    requestCount: number;
  };

  constructor(config: AmadeusConfig) {
    this.amadeus = new Amadeus({
      clientId: config.clientId,
      clientSecret: config.clientSecret
    });
    this.rateLimiter = {
      lastRequest: Date.now(),
      requestCount: 0
    };
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (now - this.rateLimiter.lastRequest > oneMinute) {
      this.rateLimiter.requestCount = 0;
      this.rateLimiter.lastRequest = now;
    }

    if (this.rateLimiter.requestCount >= 30) {
      throw new Error('Rate limit exceeded');
    }

    this.rateLimiter.requestCount++;
  }

  async searchFlight(carrier: string, flightNumber: string): Promise<AmadeusFlightResponse | null> {
    try {
      await this.checkRateLimit();

      const response = await this.amadeus.schedule.flights.get({
        carrierCode: carrier,
        flightNumber: flightNumber
      });

      if (!response.data || response.data.length === 0) {
        return null;
      }

      const flight = response.data[0];
      return {
        carrier: flight.carrierCode,
        flightNumber: flight.flightNumber,
        origin: {
          code: flight.flightPoints[0].iataCode,
          city: flight.flightPoints[0].city.name,
          timezone: flight.flightPoints[0].timeZone
        },
        destination: {
          code: flight.flightPoints[1].iataCode,
          city: flight.flightPoints[1].city.name,
          timezone: flight.flightPoints[1].timeZone
        },
        distance: flight.distance.value,
        typicalDuration: flight.duration
      };
    } catch (error) {
      console.error('Error searching flight:', error);
      return null;
    }
  }

  async searchAirport(query: string): Promise<any[]> {
    try {
      await this.checkRateLimit();

      const response = await this.amadeus.referenceData.locations.get({
        keyword: query,
        subType: 'AIRPORT'
      });

      return response.data.map((airport: any) => ({
        iataCode: airport.iataCode,
        name: airport.name,
        city: airport.address.cityName,
        country: airport.address.countryName,
        timezone: airport.timeZone,
        coordinates: {
          latitude: airport.geoCode.latitude,
          longitude: airport.geoCode.longitude
        }
      }));
    } catch (error) {
      console.error('Error searching airport:', error);
      return [];
    }
  }
} 