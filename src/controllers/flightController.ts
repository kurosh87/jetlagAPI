import { Request, Response } from 'express';
import { FlightService } from '../services/flightService';
import { UserService } from '../services/userService';

export class FlightController {
  private flightService: FlightService;
  private userService: UserService;

  constructor() {
    this.flightService = new FlightService();
    this.userService = new UserService();
  }

  /**
   * Search for flights
   */
  public async searchFlights(req: Request, res: Response): Promise<void> {
    try {
      const { origin, destination, date } = req.query;

      if (!origin || !destination || !date) {
        res.status(400).json({ error: 'Origin, destination, and date are required' });
        return;
      }

      const flights = await this.flightService.searchFlights(
        origin as string,
        destination as string,
        date as string
      );

      // Enrich flight data with complete airport information
      for (const flight of flights) {
        const originInfo = await this.flightService.getAirportInfo(flight.origin.code);
        const destinationInfo = await this.flightService.getAirportInfo(flight.destination.code);

        flight.origin = originInfo;
        flight.destination = destinationInfo;

        // Enrich layover airport information if present
        if (flight.layovers) {
          for (const layover of flight.layovers) {
            const layoverAirportInfo = await this.flightService.getAirportInfo(layover.airport.code);
            layover.airport = layoverAirportInfo;
          }
        }
      }

      res.json({ flights });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }

  /**
   * Search for airports
   */
  public async searchAirports(req: Request, res: Response): Promise<void> {
    try {
      const { keyword } = req.query;

      if (!keyword) {
        res.status(400).json({ error: 'Search keyword is required' });
        return;
      }

      const airports = await this.flightService.searchAirports(keyword as string);
      res.json({ airports });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }

  /**
   * Get flight schedule
   */
  public async getFlightSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { carrierCode, flightNumber, date } = req.query;

      if (!carrierCode || !flightNumber || !date) {
        res.status(400).json({ 
          error: 'Carrier code, flight number, and date are required' 
        });
        return;
      }

      const schedule = await this.flightService.getFlightSchedule(
        carrierCode as string,
        flightNumber as string,
        date as string
      );

      res.json({ schedule });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }

  /**
   * Save flight to user's history
   */
  public async saveFlightToHistory(req: Request, res: Response): Promise<void> {
    try {
      const { uid } = req.params;
      const flightData = req.body;

      if (!flightData) {
        res.status(400).json({ error: 'Flight data is required' });
        return;
      }

      await this.userService.saveFlightHistory(uid, flightData);
      res.json({ message: 'Flight saved to history successfully' });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }
} 