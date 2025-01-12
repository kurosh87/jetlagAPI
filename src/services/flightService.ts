import axios from 'axios';
import { Flight, Airport } from '../types';

const API_BASE = 'https://api.amadeus.com/v1';
const AUTH_URL = 'https://api.amadeus.com/v1/security/oauth2/token';

export class FlightService {
  private accessToken: string | null = null;

  private async getAccessToken(): Promise<string> {
    try {
      const response = await axios.post(AUTH_URL, 
        'grant_type=client_credentials&client_id=5v4qAUOvNrAE0DKEvHFi9On5KM4c5mD1&client_secret=mvoeMRpVhsIAxseJ',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  private async makeRequest(url: string, params: any = {}): Promise<any> {
    if (!this.accessToken) {
      await this.getAccessToken();
    }

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        },
        params
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Token expired, get new one and retry
        await this.getAccessToken();
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`
          },
          params
        });
        return response.data;
      }
      throw error;
    }
  }

  /**
   * Search for flights between two cities
   */
  public async searchFlights(
    originCode: string,
    destinationCode: string,
    departureDate: string
  ): Promise<Flight[]> {
    try {
      console.log('Searching flights with params:', { originCode, destinationCode, departureDate });
      
      const response = await this.makeRequest(`${API_BASE}/shopping/flight-offers`, {
        originLocationCode: originCode,
        destinationLocationCode: destinationCode,
        departureDate,
        adults: '1',
        max: '5'
      });

      console.log('Amadeus response:', {
        hasData: !!response.data,
        dataLength: response.data?.length
      });

      return this.mapAmadeusFlightsToFlights(response.data);
    } catch (error: any) {
      console.error('Error searching flights:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Search for airports by city name
   */
  public async searchAirports(keyword: string): Promise<Airport[]> {
    try {
      console.log('Searching airports with keyword:', keyword);
      
      const response = await this.makeRequest(`${API_BASE}/reference-data/locations`, {
        keyword,
        subType: 'AIRPORT'
      });

      console.log('Amadeus airports response:', {
        hasData: !!response.data,
        dataLength: response.data?.length
      });

      return response.data.map(this.mapAmadeusAirportToAirport);
    } catch (error: any) {
      console.error('Error searching airports:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Map Amadeus flight data to our Flight type
   */
  private mapAmadeusFlightsToFlights(amadeusFlights: any[]): Flight[] {
    return amadeusFlights.map(offer => {
      const segment = offer.itineraries[0].segments[0];
      return {
        id: offer.id,
        carrier: segment.carrierCode,
        flightNumber: segment.number,
        origin: {
          code: segment.departure.iataCode,
          name: '', // To be filled with getAirportInfo
          city: '',
          country: '',
          timezone: segment.departure.terminal || 'UTC',
          coordinates: {
            latitude: 0,
            longitude: 0
          }
        },
        destination: {
          code: segment.arrival.iataCode,
          name: '', // To be filled with getAirportInfo
          city: '',
          country: '',
          timezone: segment.arrival.terminal || 'UTC',
          coordinates: {
            latitude: 0,
            longitude: 0
          }
        },
        departureTime: new Date(segment.departure.at),
        arrivalTime: new Date(segment.arrival.at),
        duration: parseInt(segment.duration.replace('PT', '').replace('H', '')) * 60, // Convert PT2H30M to minutes
        layovers: offer.itineraries[0].segments.length > 1 ? 
          this.extractLayovers(offer.itineraries[0].segments) : undefined
      };
    });
  }

  /**
   * Map Amadeus airport data to our Airport type
   */
  private mapAmadeusAirportToAirport(amadeusAirport: any): Airport {
    return {
      code: amadeusAirport.iataCode,
      name: amadeusAirport.name,
      city: amadeusAirport.address.cityName,
      country: amadeusAirport.address.countryName,
      timezone: amadeusAirport.timeZoneOffset || 'UTC',
      coordinates: {
        latitude: parseFloat(amadeusAirport.geoCode.latitude),
        longitude: parseFloat(amadeusAirport.geoCode.longitude)
      }
    };
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
} 