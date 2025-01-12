import { Flight, Airport } from '../types';
import dotenv from 'dotenv';

// Load environment variables from .env in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

export class FlightService {
  private baseUrl = 'https://api.amadeus.com/v1';
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  /**
   * Get access token for Amadeus API
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    const apiKey = process.env.AMADEUS_API_KEY;
    const apiSecret = process.env.AMADEUS_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('Amadeus API credentials required for this operation');
    }

    try {
      const response = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'grant_type': 'client_credentials',
          'client_id': apiKey,
          'client_secret': apiSecret
        }).toString(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
      return this.accessToken;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search for flights between two cities
   */
  public async searchFlights(
    carrierCode: string,
    flightNumber: string,
    scheduledDepartureDate: string,
    segmentChoice: 'first' | 'second' | 'full' = 'full'
  ): Promise<Flight[]> {
    try {
      const token = await this.getAccessToken();
      const url = `${this.baseUrl}/schedule/flights?carrierCode=${carrierCode}&flightNumber=${flightNumber}&scheduledDepartureDate=${scheduledDepartureDate}`;
      
      console.log('Searching flights with URL:', url);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Flight search failed:', error);
        throw new Error(`Flight search failed: ${error.errors?.[0]?.detail || response.statusText}`);
      }

      const data = await response.json();
      console.log('Flight search response:', JSON.stringify(data, null, 2));
      
      return this.mapAmadeusFlightsToFlights(data.data, segmentChoice);
    } catch (error) {
      console.error('Error searching flights:', error);
      throw error;
    }
  }

  /**
   * Search for airports by city name
   */
  public async searchAirports(keyword: string): Promise<Airport[]> {
    try {
      console.log('Searching airports with keyword:', keyword);
      
      const token = await this.getAccessToken();
      const url = new URL('https://api.amadeus.com/v1/reference-data/locations');
      url.searchParams.append('keyword', keyword);
      url.searchParams.append('subType', 'AIRPORT');
      url.searchParams.append('page[limit]', '10');

      console.log('Airport search URL:', url.toString());
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Airport search failed:', error);
        throw new Error(`Airport search failed: ${error.errors?.[0]?.detail || response.statusText}`);
      }

      const data = await response.json();
      console.log('Airport search response:', JSON.stringify(data, null, 2));

      return this.mapAmadeusAirportsToAirports(data.data);
    } catch (error) {
      console.error('Error searching airports:', error);
      throw error;
    }
  }

  /**
   * Map Amadeus flight data to our Flight type
   */
  private mapAmadeusFlightsToFlights(flights: any[], segmentChoice: 'first' | 'second' | 'full' = 'full'): Flight[] {
    return flights.flatMap(flight => {
      const legs = flight.legs;
      const segments = flight.segments;
      
      // For direct flights or full journey, use the main points
      const mainDeparture = new Date(flight.flightPoints[0].departure.timings[0].value);
      const mainArrival = new Date(flight.flightPoints[1].arrival.timings[0].value);
      
      // Direct flight
      if (legs.length === 1) {
        const leg = legs[0];
        const segment = segments[0];
        
        const directFlight: Flight = {
          id: `${flight.flightDesignator.carrierCode}${flight.flightDesignator.flightNumber}`,
          carrier: flight.flightDesignator.carrierCode,
          flightNumber: flight.flightDesignator.flightNumber.toString(),
          origin: {
            code: leg.boardPointIataCode,
            name: leg.boardPointIataCode,
            city: '',
            country: '',
            timezone: this.getTimezoneForAirport(leg.boardPointIataCode),
            coordinates: { latitude: 0, longitude: 0 }
          },
          destination: {
            code: leg.offPointIataCode,
            name: leg.offPointIataCode,
            city: '',
            country: '',
            timezone: this.getTimezoneForAirport(leg.offPointIataCode),
            coordinates: { latitude: 0, longitude: 0 }
          },
          departureTime: mainDeparture,
          arrivalTime: mainArrival,
          duration: this.parseDuration(leg.scheduledLegDuration),
          equipment: leg.aircraftEquipment?.aircraftType || '',
          isSegment: false,
          segmentIndex: 0,
          totalSegments: 1,
          ...(segment?.partnership?.operatingFlight && {
            partnership: {
              operatingCarrier: segment.partnership.operatingFlight.carrierCode,
              operatingFlightNumber: segment.partnership.operatingFlight.flightNumber.toString()
            }
          })
        };
        return [directFlight];
      }
      
      // Calculate intermediate times for multi-leg flights
      const firstLegDuration = this.parseDuration(legs[0].scheduledLegDuration);
      const intermediateArrival = new Date(mainDeparture.getTime() + firstLegDuration * 60000);
      const intermediateDeparture = new Date(intermediateArrival.getTime() + 100 * 60000);
      
      // Multi-leg flight
      switch (segmentChoice) {
        case 'first': {
          const leg = legs[0];
          const segment = segments.find(s => 
            s.boardPointIataCode === leg.boardPointIataCode && 
            s.offPointIataCode === leg.offPointIataCode
          );
          
          const firstSegment: Flight = {
            id: `${flight.flightDesignator.carrierCode}${flight.flightDesignator.flightNumber}`,
            carrier: flight.flightDesignator.carrierCode,
            flightNumber: flight.flightDesignator.flightNumber.toString(),
            origin: {
              code: leg.boardPointIataCode,
              name: leg.boardPointIataCode,
              city: '',
              country: '',
              timezone: this.getTimezoneForAirport(leg.boardPointIataCode),
              coordinates: { latitude: 0, longitude: 0 }
            },
            destination: {
              code: leg.offPointIataCode,
              name: leg.offPointIataCode,
              city: '',
              country: '',
              timezone: this.getTimezoneForAirport(leg.offPointIataCode),
              coordinates: { latitude: 0, longitude: 0 }
            },
            departureTime: mainDeparture,
            arrivalTime: intermediateArrival,
            duration: firstLegDuration,
            equipment: leg.aircraftEquipment?.aircraftType || '',
            isSegment: true,
            segmentIndex: 0,
            totalSegments: 2,
            ...(segment?.partnership?.operatingFlight && {
              partnership: {
                operatingCarrier: segment.partnership.operatingFlight.carrierCode,
                operatingFlightNumber: segment.partnership.operatingFlight.flightNumber.toString()
              }
            })
          };
          return [firstSegment];
        }
        
        case 'second': {
          const leg = legs[1];
          const segment = segments.find(s => 
            s.boardPointIataCode === leg.boardPointIataCode && 
            s.offPointIataCode === leg.offPointIataCode
          );
          
          const secondSegment: Flight = {
            id: `${flight.flightDesignator.carrierCode}${flight.flightDesignator.flightNumber}`,
            carrier: flight.flightDesignator.carrierCode,
            flightNumber: flight.flightDesignator.flightNumber.toString(),
            origin: {
              code: leg.boardPointIataCode,
              name: leg.boardPointIataCode,
              city: '',
              country: '',
              timezone: this.getTimezoneForAirport(leg.boardPointIataCode),
              coordinates: { latitude: 0, longitude: 0 }
            },
            destination: {
              code: leg.offPointIataCode,
              name: leg.offPointIataCode,
              city: '',
              country: '',
              timezone: this.getTimezoneForAirport(leg.offPointIataCode),
              coordinates: { latitude: 0, longitude: 0 }
            },
            departureTime: intermediateDeparture,
            arrivalTime: mainArrival,
            duration: this.parseDuration(leg.scheduledLegDuration),
            equipment: leg.aircraftEquipment?.aircraftType || '',
            isSegment: true,
            segmentIndex: 1,
            totalSegments: 2,
            ...(segment?.partnership?.operatingFlight && {
              partnership: {
                operatingCarrier: segment.partnership.operatingFlight.carrierCode,
                operatingFlightNumber: segment.partnership.operatingFlight.flightNumber.toString()
              }
            })
          };
          return [secondSegment];
        }
        
        default: {
          // Full journey
          const directSegment = segments.find(s => 
            s.boardPointIataCode === flight.flightPoints[0].iataCode && 
            s.offPointIataCode === flight.flightPoints[1].iataCode
          );
          
          const fullFlight: Flight = {
            id: `${flight.flightDesignator.carrierCode}${flight.flightDesignator.flightNumber}`,
            carrier: flight.flightDesignator.carrierCode,
            flightNumber: flight.flightDesignator.flightNumber.toString(),
            origin: {
              code: flight.flightPoints[0].iataCode,
              name: flight.flightPoints[0].iataCode,
              city: '',
              country: '',
              timezone: this.getTimezoneForAirport(flight.flightPoints[0].iataCode),
              coordinates: { latitude: 0, longitude: 0 }
            },
            destination: {
              code: flight.flightPoints[1].iataCode,
              name: flight.flightPoints[1].iataCode,
              city: '',
              country: '',
              timezone: this.getTimezoneForAirport(flight.flightPoints[1].iataCode),
              coordinates: { latitude: 0, longitude: 0 }
            },
            departureTime: mainDeparture,
            arrivalTime: mainArrival,
            duration: Math.round((mainArrival.getTime() - mainDeparture.getTime()) / 60000),
            equipment: legs[0].aircraftEquipment?.aircraftType || '',
            isSegment: false,
            segmentIndex: 0,
            totalSegments: 2,
            layovers: [{
              airport: {
                code: legs[0].offPointIataCode,
                name: legs[0].offPointIataCode,
                city: '',
                country: '',
                timezone: this.getTimezoneForAirport(legs[0].offPointIataCode),
                coordinates: { latitude: 0, longitude: 0 }
              },
              arrival: intermediateArrival.toISOString(),
              departure: intermediateDeparture.toISOString(),
              duration: 100
            }],
            ...(directSegment?.partnership?.operatingFlight && {
              partnership: {
                operatingCarrier: directSegment.partnership.operatingFlight.carrierCode,
                operatingFlightNumber: directSegment.partnership.operatingFlight.flightNumber.toString()
              }
            })
          };
          return [fullFlight];
        }
      }
    });
  }

  /**
   * Parse duration from PT format (e.g., PT14H35M)
   */
  private parseDuration(ptDuration: string): number {
    const durationMatch = ptDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    const hours = parseInt(durationMatch?.[1] || '0');
    const minutes = parseInt(durationMatch?.[2] || '0');
    return hours * 60 + minutes;
  }

  /**
   * Map Amadeus airport data to our Airport type
   */
  private mapAmadeusAirportsToAirports(amadeusAirports: any[]): Airport[] {
    if (!Array.isArray(amadeusAirports)) {
      console.error('Expected array of airports, got:', amadeusAirports);
      return [];
    }

    return amadeusAirports.map(airport => {
      console.log('Mapping airport:', JSON.stringify(airport, null, 2));
      
      if (!airport.iataCode) {
        console.error('Invalid airport structure:', airport);
        throw new Error('Invalid airport data structure');
      }

      return {
        code: airport.iataCode,
        name: airport.name,
        city: airport.address.cityName,
        country: airport.address.countryName,
        timezone: airport.timeZoneOffset,
        coordinates: {
          latitude: parseFloat(airport.geoCode.latitude),
          longitude: parseFloat(airport.geoCode.longitude)
        }
      };
    });
  }

  /**
   * Extract layover information from flight segments
   */
  private extractLayovers(segments: any[]): any[] {
    const layovers = [];
    for (let i = 0; i < segments.length - 1; i++) {
      const currentSegment = segments[i];
      const nextSegment = segments[i + 1];
      
      const layoverStart = new Date(currentSegment.arrival.at);
      const layoverEnd = new Date(nextSegment.departure.at);
      const duration = (layoverEnd.getTime() - layoverStart.getTime()) / (1000 * 60); // Convert to minutes

      layovers.push({
        airport: {
          code: currentSegment.arrival.iataCode,
          name: '', // To be filled with getAirportInfo
          city: '',
          country: '',
          timezone: currentSegment.arrival.terminal || 'UTC',
          coordinates: {
            latitude: 0,
            longitude: 0
          }
        },
        arrival: layoverStart,
        departure: layoverEnd,
        duration
      });
    }
    return layovers;
  }

  /**
   * Get timezone offset for airport
   */
  private getTimezoneForAirport(code: string): string {
    // Common airport timezone mapping
    const timezones: Record<string, string> = {
      'YYZ': '-05:00', // Toronto
      'GRU': '-03:00', // Sao Paulo
      'EZE': '-03:00', // Buenos Aires
      'TPE': '+08:00', // Taipei
      'YVR': '-08:00', // Vancouver
      'LAX': '-08:00', // Los Angeles
      'JFK': '-05:00', // New York
      'LHR': '+00:00', // London
      'CDG': '+01:00', // Paris
      'NRT': '+09:00', // Tokyo
      'HKG': '+08:00', // Hong Kong
      'SIN': '+08:00', // Singapore
      'DXB': '+04:00'  // Dubai
    };
    return timezones[code] || '+00:00';
  }
} 