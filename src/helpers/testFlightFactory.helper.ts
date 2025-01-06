import { Flight, Airport } from '../../types';

export function createTestAirport(code: string, timezone: number): Airport {
  return {
    code,
    name: `${code} International Airport`,
    city: code,
    country: 'Test Country',
    location: {
      latitude: 0,
      longitude: 0
    },
    timezone: {
      name: 'UTC',
      offset: timezone
    }
  };
}

export function createTestFlight(
  origin: string,
  destination: string,
  originTimezone: number,
  destinationTimezone: number,
  departure: Date,
  duration: number // in seconds
): Flight {
  const originAirport = createTestAirport(origin, originTimezone);
  const destinationAirport = createTestAirport(destination, destinationTimezone);
  const arrival = new Date(departure.getTime() + duration * 1000);

  return {
    carrier: 'TEST',
    flightNumber: `TEST${origin}${destination}`,
    origin: originAirport,
    destination: destinationAirport,
    departure,
    arrival,
    duration
  };
} 