import { JetlagService } from '../services/jetlagService';
import { WeatherService } from '../services/weatherService';
import { FlightService } from '../services/flightService';
import { Flight } from '../types/flight';
import { ActivityType, ActivityPriority } from '../types/circadian';

describe('Amadeus API and Jetlag Tests', () => {
  let jetlagService: JetlagService;
  let weatherService: WeatherService;
  let flightService: FlightService;

  beforeEach(() => {
    weatherService = new WeatherService();
    jetlagService = new JetlagService(weatherService);
    flightService = new FlightService();
  });

  it('should search flights and calculate jetlag', async () => {
    // Search for a specific flight
    const flights = await flightService.searchFlights('BA', '286', '2025-01-17');
    console.log('\nAmadeus Flight Search Results:');
    console.log('-----------------------------');
    flights.forEach((flight, index) => {
      console.log(`\nFlight ${index + 1}:`);
      console.log(`Carrier: ${flight.carrier}`);
      console.log(`Flight Number: ${flight.flightNumber}`);
      console.log(`From: ${flight.origin.code} (${flight.origin.timezone})`);
      console.log(`To: ${flight.destination.code} (${flight.destination.timezone})`);
      console.log(`Departure: ${flight.departureTime}`);
      console.log(`Arrival: ${flight.arrivalTime}`);
      console.log(`Duration: ${flight.duration} minutes`);
      
      if (flight.layovers && flight.layovers.length > 0) {
        console.log('\nLayovers:');
        flight.layovers.forEach((layover, layoverIndex) => {
          console.log(`  ${layoverIndex + 1}. ${layover.airport.code}`);
          console.log(`     Duration: ${layover.duration} minutes`);
          console.log(`     Arrival: ${layover.arrival}`);
          console.log(`     Departure: ${layover.departure}`);
        });
      }
    });

    // Use the first flight for jetlag calculations
    if (flights.length > 0) {
      const flight = flights[0];
      
      // Convert to our Flight type
      const jetlagFlight: Flight = {
        id: `${flight.carrier}${flight.flightNumber}`,
        origin: {
          code: flight.origin.code,
          name: flight.origin.name || flight.origin.code,
          location: {
            latitude: flight.origin.coordinates.latitude,
            longitude: flight.origin.coordinates.longitude
          },
          timezone: {
            name: 'America/Los_Angeles',
            offset: -8 // SFO is UTC-8
          }
        },
        destination: {
          code: flight.destination.code,
          name: flight.destination.name || flight.destination.code,
          location: {
            latitude: flight.destination.coordinates.latitude,
            longitude: flight.destination.coordinates.longitude
          },
          timezone: {
            name: 'Europe/London',
            offset: 0 // LHR is UTC+0
          }
        },
        departureTime: flight.departureTime.toString(),
        arrivalTime: flight.arrivalTime.toString(),
        timezoneOffset: 8 // 8 hours difference between SFO and LHR
      };

      console.log('\nJetlag Calculation Input:');
      console.log('------------------------');
      console.log(JSON.stringify(jetlagFlight, null, 2));

      const schedule = await jetlagService.generateActivitySchedule(jetlagFlight);

      console.log('\nJetlag Schedule:');
      console.log('----------------');
      console.log('\nArrival Day Activities:');
      schedule.arrivalDayActivities.forEach((activity, index) => {
        console.log(`\nActivity ${index + 1}:`);
        console.log(`Type: ${activity.type}`);
        console.log(`Start: ${activity.timeWindow.start}`);
        console.log(`End: ${activity.timeWindow.end}`);
        console.log(`Priority: ${activity.priority}`);
        if (activity.supplementType) console.log(`Supplement Type: ${activity.supplementType}`);
      });

      console.log('\nAdaptation Days:');
      schedule.adaptationDays.forEach((day, dayIndex) => {
        console.log(`\nDay ${day.dayIndex}:`);
        day.activities.forEach((activity, actIndex) => {
          console.log(`\n  Activity ${actIndex + 1}:`);
          console.log(`  Type: ${activity.type}`);
          console.log(`  Start: ${activity.timeWindow.start}`);
          console.log(`  End: ${activity.timeWindow.end}`);
          console.log(`  Priority: ${activity.priority}`);
          if (activity.supplementType) console.log(`  Supplement Type: ${activity.supplementType}`);
        });
      });
    }
  }, 30000);

  // Keep the original test for validation
  it('should calculate correct jetlag for SFO-LHR flight', async () => {
    // Create a mock flight from SFO to LHR
    const flight: Flight = {
      id: 'BA286',
      origin: {
        code: 'SFO',
        name: 'San Francisco International Airport',
        location: {
          latitude: 37.7749,
          longitude: -122.4194
        },
        timezone: {
          name: 'America/Los_Angeles',
          offset: -8
        }
      },
      destination: {
        code: 'LHR',
        name: 'London Heathrow Airport',
        location: {
          latitude: 51.5074,
          longitude: -0.1278
        },
        timezone: {
          name: 'Europe/London',
          offset: 0
        }
      },
      departureTime: '2025-01-17T10:00:00-08:00',
      arrivalTime: '2025-01-18T06:00:00+00:00',
      timezoneOffset: 8 // 8 hours difference between SFO and LHR
    };

    const schedule = await jetlagService.generateActivitySchedule(flight);

    // Validate the schedule
    expect(schedule.arrivalDayActivities.length).toBeGreaterThan(0);

    // Check light exposure timing
    const lightActivities = schedule.arrivalDayActivities.filter(a => 
      a.type === ActivityType.BRIGHT_LIGHT || a.type === ActivityType.AVOID_LIGHT
    );
    expect(lightActivities.length).toBe(2);

    // For eastward travel (SFO to LHR), bright light should be in morning
    const brightLight = lightActivities.find(a => a.type === ActivityType.BRIGHT_LIGHT);
    expect(brightLight).toBeDefined();
    expect(brightLight!.timeWindow.start).toMatch(/^(0[6-9]|1[0-1]):/); // Between 6-11 AM

    // Sleep timing should be appropriate for destination time
    const sleepActivity = schedule.arrivalDayActivities.find(a => a.type === ActivityType.SLEEP);
    expect(sleepActivity).toBeDefined();
    expect(sleepActivity!.timeWindow.start).toMatch(/^(2[0-3]|00):/); // Between 8 PM - 12 AM
    expect(sleepActivity!.timeWindow.end).toMatch(/^(0[5-8]):/); // Between 5-8 AM
  }, 30000);
});

describe('AC90 Multi-segment Flight Tests', () => {
  test('should calculate jetlag for Toronto-São Paulo-Buenos Aires segments', async () => {
    // First segment: Toronto to São Paulo
    const segment1 = {
      id: 'AC90-1',
      origin: { timezone: 'America/Toronto' },
      destination: { timezone: 'America/Sao_Paulo' },
      departureTime: new Date('2025-01-17T22:45:00-05:00'),
      arrivalTime: new Date('2025-01-18T10:45:00-03:00'),
      duration: 720 // 12 hours
    };

    // Second segment: São Paulo to Buenos Aires
    const segment2 = {
      id: 'AC90-2',
      origin: { timezone: 'America/Sao_Paulo' },
      destination: { timezone: 'America/Argentina/Buenos_Aires' },
      departureTime: new Date('2025-01-18T13:45:00-03:00'),
      arrivalTime: new Date('2025-01-18T16:45:00-03:00'),
      duration: 180 // 3 hours
    };

    const jetlagService = new JetlagService();

    // Calculate jetlag for first segment
    const result1 = await jetlagService.calculateJetlag(segment1);
    console.log('\nAC90 Segment 1: Toronto to São Paulo');
    console.log('Timezone difference:', result1.severity.timezoneDifference, 'hours');
    console.log('Severity score:', result1.severity.score);
    console.log('Adaptation days:', result1.severity.adaptationDays);
    console.log('\nActivities:');
    result1.schedule.forEach((day, index) => {
      console.log(`\nDay ${index + 3}:`);
      day.activities.forEach(a => {
        console.log(`- ${a.type} from ${a.timeWindow.start} to ${a.timeWindow.end}`);
        if (a.priority) console.log(`  Priority: ${a.priority}`);
        if (a.supplementType) console.log(`  Supplement: ${a.supplementType}`);
      });
    });

    // Calculate jetlag for second segment
    const result2 = await jetlagService.calculateJetlag(segment2);
    console.log('\nAC90 Segment 2: São Paulo to Buenos Aires');
    console.log('Timezone difference:', result2.severity.timezoneDifference, 'hours');
    console.log('Severity score:', result2.severity.score);
    console.log('Adaptation days:', result2.severity.adaptationDays);
    console.log('\nActivities:');
    result2.schedule.forEach((day, index) => {
      console.log(`\nDay ${index + 3}:`);
      day.activities.forEach(a => {
        console.log(`- ${a.type} from ${a.timeWindow.start} to ${a.timeWindow.end}`);
        if (a.priority) console.log(`  Priority: ${a.priority}`);
        if (a.supplementType) console.log(`  Supplement: ${a.supplementType}`);
      });
    });

    // Assertions for first segment (Toronto to São Paulo)
    expect(result1.severity.timezoneDifference).toBe(2); // 2 hours ahead
    expect(result1.severity.score).toBeGreaterThan(0);
    expect(result1.severity.adaptationDays).toBeGreaterThan(0);
    expect(result1.schedule.length).toBeGreaterThan(0);

    // Assertions for second segment (São Paulo to Buenos Aires)
    expect(result2.severity.timezoneDifference).toBe(0); // Same timezone
    expect(result2.severity.score).toBeLessThan(result1.severity.score);
    expect(result2.severity.adaptationDays).toBeLessThanOrEqual(result1.severity.adaptationDays);
    expect(result2.schedule.length).toBeGreaterThan(0);
  });
}); 