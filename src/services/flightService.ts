import { getAmadeusToken } from '../utils/auth';
import { normalizeTimezone } from '../utils/timezone';
import { Flight, Airport, Layover } from '../types';

interface AmadeusSegment {
  departure: {
    iataCode: string;
    scheduledTime: string;
  };
  arrival: {
    iataCode: string;
    scheduledTime: string;
  };
  carrierCode: string;
  flightNumber: string;
  duration: string;
}

export class FlightService {
  private baseUrl = 'https://api.amadeus.com/v2';
  private baseUrlV1 = 'https://api.amadeus.com/v1';
  private token: string | null = null;

  constructor() {
    // Token will be set before making API calls
  }

  private async getAmadeusToken(): Promise<string> {
    const url = 'https://api.amadeus.com/v1/security/oauth2/token';
    const clientId = process.env.AMADEUS_API_KEY;
    const clientSecret = process.env.AMADEUS_API_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Missing Amadeus API credentials');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token Error Response:', errorText);
      throw new Error('Failed to get access token');
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Fetches airport details from Amadeus API
   */
  private async getAirportDetails(iataCode: string): Promise<Airport> {
    // Ensure we have a valid token
    if (!this.token) {
      this.token = await this.getAmadeusToken();
    }

    const url = `${this.baseUrlV1}/reference-data/locations?subType=AIRPORT&keyword=${iataCode}`;
    console.log('Getting airport details from:', url);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        // If token is invalid, try to get a new one and retry once
        if (response.status === 401) {
          console.log('Token expired, getting new token and retrying...');
          this.token = await this.getAmadeusToken();
          
          const retryResponse = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${this.token}`
            }
          });

          if (!retryResponse.ok) {
            throw new Error('Not Found');
          }

          const data = await retryResponse.json();
          const airport = data.data.find((loc: any) => loc.iataCode === iataCode);

          if (!airport) {
            throw new Error(`Airport not found: ${iataCode}`);
          }

          return {
            code: airport.iataCode,
            name: airport.name,
            timezone: airport.timeZoneOffset,
            city: airport.address.cityName,
            country: airport.address.countryName,
            coordinates: {
              latitude: airport.geoCode.latitude,
              longitude: airport.geoCode.longitude
            }
          };
        }

        throw new Error('Not Found');
      }

      const data = await response.json();
      const airport = data.data.find((loc: any) => loc.iataCode === iataCode);

      if (!airport) {
        throw new Error(`Airport not found: ${iataCode}`);
      }

      return {
        code: airport.iataCode,
        name: airport.name,
        timezone: airport.timeZoneOffset,
        city: airport.address.cityName,
        country: airport.address.countryName,
        coordinates: {
          latitude: airport.geoCode.latitude,
          longitude: airport.geoCode.longitude
        }
      };
    } catch (error: any) {
      console.error('Error fetching airport details:', error);
      throw new Error(`Failed to fetch airport details: ${error.message}`);
    }
  }

  /**
   * Search for flights using Amadeus API
   */
  async searchFlights(carrier: string, flightNumber: string, date: string): Promise<Flight[]> {
    // Ensure we have a valid token
    if (!this.token) {
      this.token = await this.getAmadeusToken();
    }

    const url = `${this.baseUrl}/schedule/flights?carrierCode=${carrier}&flightNumber=${flightNumber}&scheduledDepartureDate=${date}`;
    console.log('Searching flights with URL:', url);

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        // If token is invalid, try to get a new one and retry once
        if (response.status === 401) {
          console.log('Token expired, getting new token and retrying...');
          this.token = await this.getAmadeusToken();
          
          const retryResponse = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${this.token}`
            }
          });

          if (!retryResponse.ok) {
            throw new Error('Failed to search flights');
          }

          const data = await retryResponse.json();
          console.log('API Response:', JSON.stringify(data, null, 2));
          return this.mapAmadeusFlightsToFlights(data.data);
        }

        throw new Error('Failed to search flights');
      }

      const data = await response.json();
      console.log('API Response:', JSON.stringify(data, null, 2));
      return this.mapAmadeusFlightsToFlights(data.data);
    } catch (error: any) {
      console.error('Error searching flights:', error);
      throw error;
    }
  }

  /**
   * Maps Amadeus flight data to our Flight type
   */
  private async mapAmadeusFlightsToFlights(amadeusFlights: any[]): Promise<Flight[]> {
    console.log('Mapping flights:', JSON.stringify(amadeusFlights, null, 2));
    
    const mappedFlights: Flight[] = [];
    
    for (const flight of amadeusFlights) {
      console.log('Processing flight:', JSON.stringify(flight, null, 2));
      
      const originPoint = flight.flightPoints.find((point: any) => point.departure);
      const destinationPoint = flight.flightPoints.find((point: any) => point.arrival);
      
      if (!originPoint || !destinationPoint) {
        console.warn('Missing origin or destination point, skipping flight');
        continue;
      }

      try {
        // Get detailed airport information
        const originAirport = await this.getAirportDetails(originPoint.iataCode);
        const destinationAirport = await this.getAirportDetails(destinationPoint.iataCode);

        // Extract layovers from legs
        const layovers: Layover[] = [];
        for (let i = 0; i < flight.legs.length - 1; i++) {
          const currentLeg = flight.legs[i];
          const nextLeg = flight.legs[i + 1];
          
          const airport = await this.getAirportDetails(currentLeg.offPointIataCode);
          
          // Find arrival and departure times for the layover
          const layoverPoint = flight.flightPoints.find((point: any) => point.iataCode === currentLeg.offPointIataCode);
          if (layoverPoint && layoverPoint.arrival && layoverPoint.departure) {
            const arrival = new Date(layoverPoint.arrival.timings[0].value);
            const departure = new Date(layoverPoint.departure.timings[0].value);
            const duration = (departure.getTime() - arrival.getTime()) / (1000 * 60); // Convert to minutes
            
            layovers.push({
              airport,
              arrival: layoverPoint.arrival.timings[0].value,
              departure: layoverPoint.departure.timings[0].value,
              duration
            });
          }
        }

        // Calculate total duration in minutes
        const departureTime = new Date(originPoint.departure.timings[0].value);
        const arrivalTime = new Date(destinationPoint.arrival.timings[0].value);
        const duration = (arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60);

        mappedFlights.push({
          id: `${flight.flightDesignator.carrierCode}${flight.flightDesignator.flightNumber}`,
          carrier: flight.flightDesignator.carrierCode,
          flightNumber: flight.flightDesignator.flightNumber.toString(),
          origin: originAirport,
          destination: destinationAirport,
          departureTime: originPoint.departure.timings[0].value,
          arrivalTime: destinationPoint.arrival.timings[0].value,
          duration,
          layovers
        });
      } catch (error) {
        console.error('Error mapping flight:', error);
        throw error;
      }
    }

    return mappedFlights;
  }

  /**
   * Search for airports using Amadeus API
   */
  public async searchAirports(keyword: string): Promise<Airport[]> {
    try {
      const token = await getAmadeusToken();
      const url = `${this.baseUrl}/reference-data/locations?subType=AIRPORT&keyword=${encodeURIComponent(keyword)}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to search airports: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.map((airport: any) => ({
        code: airport.iataCode,
        timezone: normalizeTimezone(airport.timeZoneOffset),
        name: airport.name,
        city: airport.address.cityName,
        country: airport.address.countryName,
        coordinates: {
          latitude: airport.geoCode.latitude,
          longitude: airport.geoCode.longitude
        }
      }));
    } catch (error) {
      console.error('Error searching airports:', error);
      throw error;
    }
  }
} 