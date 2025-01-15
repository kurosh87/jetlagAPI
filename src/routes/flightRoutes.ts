import express from 'express';
import { FlightService } from '../services/flightService';
import { JetlagCalculationService } from '../services/jetlagCalculationService';

const router = express.Router();
const flightService = new FlightService();
const jetlagService = new JetlagCalculationService();

router.get('/search', async (req, res) => {
  try {
    const { carrier, flightNumber, date } = req.query;
    
    if (!carrier || !flightNumber || !date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: carrier, flightNumber, date'
      });
    }

    // Get flight data
    const flights = await flightService.searchFlights(
      carrier as string,
      flightNumber as string,
      date as string
    );

    if (flights.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Flight not found'
      });
    }

    const flight = flights[0];
    
    // Calculate jetlag adaptation
    const adaptationSchedule = jetlagService.calculateJetlagAdaptation({
      origin: {
        timezone: flight.origin.timezone,
      },
      destination: {
        timezone: flight.destination.timezone,
      },
      departureTime: new Date(flight.departureTime),
      arrivalTime: new Date(flight.arrivalTime),
      duration: flight.duration,
      layovers: flight.layovers
    });

    return res.json({
      success: true,
      data: {
        flight,
        jetlagPlan: adaptationSchedule
      }
    });
  } catch (error) {
    console.error('Error processing flight search:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router; 