import { FlightService } from './services/flightService';
import { JetlagCalculationService } from './services/jetlagCalculationService';
import { Flight, Airport } from './types';

async function testIntegration() {
  try {
    // Get command line arguments
    const [carrier, flightNumber, date] = process.argv.slice(2);
    
    if (!carrier || !flightNumber || !date) {
      throw new Error('Usage: ts-node src/test.ts <carrier> <flightNumber> <date>');
    }

    console.log(`Testing flight ${carrier}${flightNumber} on ${date}`);
    
    const flightService = new FlightService();
    const jetlagService = new JetlagCalculationService();

    // Search for flight
    const flights = await flightService.searchFlights(carrier, flightNumber, date);
    
    if (flights.length === 0) {
      throw new Error('Flight not found');
    }

    const flight = flights[0];
    console.log('Flight details:', JSON.stringify(flight, null, 2));

    // Convert string dates to Date objects for jetlag calculation
    const adaptationInput = {
      ...flight,
      departureTime: new Date(flight.departureTime),
      arrivalTime: new Date(flight.arrivalTime)
    };

    // Calculate jetlag adaptation
    const adaptationPlan = jetlagService.calculateJetlagAdaptation(adaptationInput);
    
    // Output the entire raw adaptation plan
    console.log('COMPLETE RAW ADAPTATION PLAN:');
    console.log(JSON.stringify(adaptationPlan, null, 2));
  } catch (error) {
    console.error('Error during integration test:', error);
  }
}

testIntegration().catch(console.error); 