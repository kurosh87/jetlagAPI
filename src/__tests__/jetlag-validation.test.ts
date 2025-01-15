import { FlightService } from '../services/flightService';
import { JetlagCalculationService } from '../services/jetlagCalculationService';
import { Flight } from '../types';
import { ActivityType } from '../types';
import { mockFlightData } from '../__mocks__/amadeusData';

// Mock the fetch function
global.fetch = jest.fn((url: string) => {
  if (url.includes('/oauth2/token')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ access_token: 'mock_token' })
    });
  }
  
  if (url.includes('/schedule/flights')) {
    const flightMatch = url.match(/flightNumber=(\w+)/);
    const flightNumber = flightMatch ? flightMatch[1] : '';
    const carrierMatch = url.match(/carrierCode=(\w+)/);
    const carrier = carrierMatch ? carrierMatch[1] : '';
    const key = `${carrier}${flightNumber}`;
    
    if (mockFlightData[key]) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockFlightData[key])
      });
    }
  }

  if (url.includes('/reference-data/locations/')) {
    const iataCode = url.split('/').pop();
    // Mock airport data with proper timezone offsets
    const mockAirportData = {
      'TPE': { timeZoneOffset: '+08:00', name: 'Taoyuan International', cityName: 'Taipei', countryName: 'Taiwan' },
      'YVR': { timeZoneOffset: '-08:00', name: 'Vancouver International', cityName: 'Vancouver', countryName: 'Canada' },
      'SFO': { timeZoneOffset: '-08:00', name: 'San Francisco International', cityName: 'San Francisco', countryName: 'USA' },
      'LHR': { timeZoneOffset: '+00:00', name: 'Heathrow', cityName: 'London', countryName: 'United Kingdom' },
      'JFK': { timeZoneOffset: '-05:00', name: 'John F Kennedy International', cityName: 'New York', countryName: 'USA' },
      'NRT': { timeZoneOffset: '+09:00', name: 'Narita International', cityName: 'Tokyo', countryName: 'Japan' },
      'DXB': { timeZoneOffset: '+04:00', name: 'Dubai International', cityName: 'Dubai', countryName: 'UAE' },
      'SYD': { timeZoneOffset: '+11:00', name: 'Kingsford Smith', cityName: 'Sydney', countryName: 'Australia' },
      'YYZ': { timeZoneOffset: '-05:00', name: 'Pearson International', cityName: 'Toronto', countryName: 'Canada' },
      'GRU': { timeZoneOffset: '-03:00', name: 'Guarulhos International', cityName: 'Sao Paulo', countryName: 'Brazil' },
      'EZE': { timeZoneOffset: '-03:00', name: 'Ministro Pistarini', cityName: 'Buenos Aires', countryName: 'Argentina' }
    };

    if (iataCode && mockAirportData[iataCode]) {
      const airport = mockAirportData[iataCode];
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: {
            iataCode,
            timeZoneOffset: airport.timeZoneOffset,
            name: airport.name,
            address: {
              cityName: airport.cityName,
              countryName: airport.countryName
            },
            geoCode: {
              latitude: 0,
              longitude: 0
            }
          }
        })
      });
    }
  }
  
  return Promise.reject(new Error('Not found'));
}) as jest.Mock;

describe('Jetlag Validation Tests', () => {
  const flightService = new FlightService();
  const jetlagService = new JetlagCalculationService();

  // Test routes with significant timezone differences
  const routes = [
    { carrier: 'BR', flight: '10', date: '2025-01-17', description: 'TPE-YVR (Westward, 16h difference)' },
    { carrier: 'BA', flight: '286', date: '2025-01-17', description: 'SFO-LHR (Eastward, 8h difference)' },
    { carrier: 'JL', flight: '7', date: '2025-01-17', description: 'JFK-NRT (Eastward, 14h difference)' },
    { carrier: 'QF', flight: '8', date: '2025-01-17', description: 'DXB-SYD (Eastward, 7h difference)' },
    { carrier: 'AC', flight: '90', date: '2025-01-17', description: 'YYZ-GRU-EZE (Southward, multi-segment)' }
  ];

  // Helper function to log jetlag analysis
  const analyzeJetlag = async (flight: Flight) => {
    const adaptationSchedule = await jetlagService.calculateJetlagAdaptation({
      origin: { timezone: flight.origin.timezone },
      destination: { timezone: flight.destination.timezone },
      departureTime: new Date(flight.departureTime),
      arrivalTime: new Date(flight.arrivalTime),
      duration: flight.duration,
      layovers: flight.layovers?.map(l => ({ duration: l.duration }))
    });
    
    console.log(`\nAnalyzing ${flight.id}:`);
    console.log('--------------------');
    console.log(`Route: ${flight.origin.code} to ${flight.destination.code}`);
    console.log(`Departure: ${flight.departureTime}`);
    console.log(`Arrival: ${flight.arrivalTime}`);
    console.log(`Origin Timezone: ${flight.origin.timezone}`);
    console.log(`Destination Timezone: ${flight.destination.timezone}`);
    
    console.log('\nJetlag Analysis:');
    console.log('Severity:', adaptationSchedule.severity);
    
    console.log('\nPre-flight Schedule:');
    adaptationSchedule.preFlight.activities.forEach((activity, index) => {
      console.log(`  ${index + 1}. ${activity.type} (${activity.timeWindow.start} - ${activity.timeWindow.end})`);
      if (activity.priority) console.log(`     Priority: ${activity.priority}`);
      if (activity.notes) console.log(`     Notes: ${activity.notes}`);
    });

    console.log('\nIn-flight Schedule:');
    adaptationSchedule.inFlight.activities.forEach((activity, index) => {
      console.log(`  ${index + 1}. ${activity.type} (${activity.timeWindow.start} - ${activity.timeWindow.end})`);
      if (activity.priority) console.log(`     Priority: ${activity.priority}`);
      if (activity.notes) console.log(`     Notes: ${activity.notes}`);
    });

    console.log('\nPost-flight Schedule:');
    adaptationSchedule.postFlight.activities.forEach((activity, index) => {
      console.log(`  ${index + 1}. ${activity.type} (${activity.timeWindow.start} - ${activity.timeWindow.end})`);
      if (activity.priority) console.log(`     Priority: ${activity.priority}`);
      if (activity.notes) console.log(`     Notes: ${activity.notes}`);
    });

    return adaptationSchedule;
  };

  // Test each route
  test.each(routes)('should validate jetlag for $description', async ({ carrier, flight, date }) => {
    const flights = await flightService.searchFlights(carrier, flight, date);
    expect(flights.length).toBeGreaterThan(0);

    const testFlight = flights[0];
    const schedule = await analyzeJetlag(testFlight);

    // Validate schedule structure
    expect(schedule.preFlight.activities.length).toBeGreaterThan(0);
    expect(schedule.inFlight.activities.length).toBeGreaterThan(0);
    expect(schedule.postFlight.activities.length).toBeGreaterThan(0);

    // Validate severity calculation
    expect(schedule.severity.score).toBeDefined();
    expect(schedule.severity.timezoneDifference).toBeDefined();
    expect(schedule.severity.adaptationDays).toBeGreaterThan(0);

    // Validate activity types
    const allActivities = [
      ...schedule.preFlight.activities,
      ...schedule.inFlight.activities,
      ...schedule.postFlight.activities
    ];

    expect(allActivities.some(a => a.type === ActivityType.SLEEP)).toBe(true);
    expect(allActivities.some(a => 
      a.type === ActivityType.LIGHT_EXPOSURE || a.type === ActivityType.AVOID_LIGHT
    )).toBe(true);
  }, 30000);

  // Test specific patterns for eastward travel
  test('should validate eastward travel patterns', async () => {
    const flights = await flightService.searchFlights('BA', '286', '2025-01-17'); // SFO-LHR
    const schedule = await analyzeJetlag(flights[0]);

    // Validate timezone difference
    expect(schedule.severity.timezoneDifference).toBeGreaterThan(0); // Positive for eastward
    
    // For eastward travel, bright light exposure should be in the morning at destination
    const postFlightLight = schedule.postFlight.activities.find(a => a.type === ActivityType.LIGHT_EXPOSURE);
    expect(postFlightLight).toBeDefined();
    const lightHour = new Date(postFlightLight!.timeWindow.start).getHours();
    expect(lightHour).toBeGreaterThanOrEqual(6);
    expect(lightHour).toBeLessThanOrEqual(11);
  }, 30000);

  // Test specific patterns for westward travel
  test('should validate westward travel patterns', async () => {
    const flights = await flightService.searchFlights('BR', '10', '2025-01-17'); // TPE-YVR
    const schedule = await analyzeJetlag(flights[0]);

    // Validate timezone difference
    expect(schedule.severity.timezoneDifference).toBeLessThan(0); // Negative for westward
    
    // For westward travel, bright light exposure should be in the evening at destination
    const postFlightLight = schedule.postFlight.activities.find(a => a.type === ActivityType.LIGHT_EXPOSURE);
    expect(postFlightLight).toBeDefined();
    const lightHour = new Date(postFlightLight!.timeWindow.start).getHours();
    expect(lightHour).toBeGreaterThanOrEqual(14);
    expect(lightHour).toBeLessThanOrEqual(20);
  }, 30000);

  // Test multi-segment flight patterns
  test('should validate multi-segment flight patterns', async () => {
    const flights = await flightService.searchFlights('AC', '90', '2025-01-17', 'full'); // YYZ-GRU-EZE
    const schedule = await analyzeJetlag(flights[0]);

    // Validate layover handling
    if (flights[0].layovers && flights[0].layovers.length > 0) {
      console.log('\nLayover Analysis:');
      flights[0].layovers.forEach((layover, index) => {
        console.log(`\nLayover ${index + 1}:`);
        console.log(`Airport: ${layover.airport.code}`);
        console.log(`Duration: ${layover.duration} minutes`);
        console.log(`Arrival: ${layover.arrival}`);
        console.log(`Departure: ${layover.departure}`);
      });

      // Validate that layovers are factored into severity
      expect(schedule.severity.factors.layoverImpact).toBeGreaterThan(0);
    }

    // Validate that schedule accounts for total journey time
    expect(schedule.inFlight.activities.length).toBeGreaterThan(0);
    expect(schedule.postFlight.activities.length).toBeGreaterThan(0);
  }, 30000);
}); 