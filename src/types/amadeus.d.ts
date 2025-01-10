declare module 'amadeus' {
  export interface AmadeusConfig {
    clientId: string;
    clientSecret: string;
  }

  export interface AmadeusFlightPoint {
    iataCode: string;
    city: {
      name: string;
    };
    timeZone: string;
  }

  export interface AmadeusFlightData {
    carrierCode: string;
    flightNumber: string;
    flightPoints: AmadeusFlightPoint[];
    distance: {
      value: number;
    };
    duration: number;
  }

  export interface AmadeusAirportData {
    iataCode: string;
    name: string;
    address: {
      cityName: string;
      countryName: string;
    };
    timeZone: string;
    geoCode: {
      latitude: number;
      longitude: number;
    };
  }

  export interface AmadeusResponse<T> {
    data: T[];
  }

  export class Amadeus {
    constructor(config: AmadeusConfig);

    schedule: {
      flights: {
        get(params: { carrierCode: string; flightNumber: string }): Promise<AmadeusResponse<AmadeusFlightData>>;
      };
    };

    referenceData: {
      locations: {
        get(params: { keyword: string; subType: string }): Promise<AmadeusResponse<AmadeusAirportData>>;
      };
    };
  }
} 