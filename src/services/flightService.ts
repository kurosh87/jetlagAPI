import { amadeus } from '../config/amadeus';
import { Flight, Airport } from '../types';

export class FlightService {
  /**
   * Search for flights between two cities
   */
  public async searchFlights(
    originCode: string,
    destinationCode: string,
    departureDate: string
  ): Promise<Flight[]> {
    try {
      const response = await amadeus.shopping.flightOffersSearch.get({
        originLocationCode: originCode,
        destinationLocationCode: destinationCode,
        departureDate,
        adults: '1',
        max: '5'
      });

      return this.mapAmadeusFlightsToFlights(response.data);
    } catch (error) {
      console.error('Error searching flights:', error);
      throw error;
    }
  }

  /**
   * Get airport information by IATA code
   */
  public async getAirportInfo(iataCode: string): Promise<Airport> {
    try {
      const response = await amadeus.referenceData.locations.get({
        keyword: iataCode,
        subType: 'AIRPORT'
      });

      if (response.data.length === 0) {
        throw new Error(`Airport with code ${iataCode} not found`);
      }

      return this.mapAmadeusAirportToAirport(response.data[0]);
    } catch (error) {
      console.error('Error fetching airport info:', error);
      throw error;
    }
  }

  /**
   * Search for airports by city name
   */
  public async searchAirports(keyword: string): Promise<Airport[]> {
    try {
      const response = await amadeus.referenceData.locations.get({
        keyword,
        subType: 'AIRPORT'
      });

      return response.data.map(this.mapAmadeusAirportToAirport);
    } catch (error) {
      console.error('Error searching airports:', error);
      throw error;
    }
  }

  /**
   * Get flight schedule
   */
  public async getFlightSchedule(
    carrierCode: string,
    flightNumber: string,
    scheduledDepartureDate: string
  ): Promise<any> {
    try {
      const response = await amadeus.schedule.flights.get({
        carrierCode,
        flightNumber,
        scheduledDepartureDate
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching flight schedule:', error);
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
          timezone: segment.departure.terminal || '',
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
          timezone: segment.arrival.terminal || '',
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
          timezone: currentSegment.arrival.terminal || '',
          coordinates: {
            latitude: 0,
            longitude: 0
          }
        },
        duration,
        arrivalTime: layoverStart,
        departureTime: layoverEnd
      });
    }
    return layovers;
  }
} 