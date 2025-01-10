export interface AirportCoordinates {
  latitude: number;
  longitude: number;
}

export interface CachedAirport {
  iataCode: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  coordinates: AirportCoordinates;
  lastUpdated: string;
  cacheHits: number;
}

export interface CachedFlightRoute {
  carrier: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  lastUpdated: string;
  cacheHits: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  lastCleared: string;
  size: number;
  avgResponseTime: number;
} 