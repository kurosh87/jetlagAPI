import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { JetlagCalculationService } from '../services/jetlagCalculationService';
import { JetlagCalculationRequest, JetlagCalculationResponse, ApiError } from '../types/api';

export class JetlagController {
  private jetlagService: JetlagCalculationService;

  constructor() {
    this.jetlagService = new JetlagCalculationService();
  }

  public calculateJetlag = async (req: Request, res: Response): Promise<void> => {
    try {
      const request = req.body as JetlagCalculationRequest;

      // Validate request
      this.validateRequest(request);

      // Convert string dates to Date objects
      const flight = {
        ...request.flight,
        departureTime: new Date(request.flight.departureTime),
        arrivalTime: new Date(request.flight.arrivalTime),
        layovers: request.flight.layovers?.map(layover => ({
          ...layover,
          arrivalTime: new Date(layover.arrivalTime),
          departureTime: new Date(layover.departureTime)
        }))
      };

      // Calculate adaptation schedule
      const adaptationSchedule = this.jetlagService.calculateJetlagAdaptation(
        flight,
        request.preferences
      );

      const response: JetlagCalculationResponse = {
        adaptationSchedule,
        requestId: uuidv4(),
        calculatedAt: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      const apiError: ApiError = {
        code: error instanceof Error ? 'CALCULATION_ERROR' : 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? { stack: error.stack } : undefined
      };

      res.status(400).json(apiError);
    }
  };

  private validateRequest(request: JetlagCalculationRequest): void {
    if (!request.flight) {
      throw new Error('Flight details are required');
    }

    const { origin, destination, departureTime, arrivalTime, duration } = request.flight;

    if (!origin || !origin.code || !origin.timezone) {
      throw new Error('Origin airport details are incomplete');
    }

    if (!destination || !destination.code || !destination.timezone) {
      throw new Error('Destination airport details are incomplete');
    }

    if (!departureTime || !this.isValidISODate(departureTime)) {
      throw new Error('Invalid departure time');
    }

    if (!arrivalTime || !this.isValidISODate(arrivalTime)) {
      throw new Error('Invalid arrival time');
    }

    if (!duration || duration <= 0) {
      throw new Error('Invalid flight duration');
    }

    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);

    if (arrival <= departure) {
      throw new Error('Arrival time must be after departure time');
    }

    // Validate layovers if present
    if (request.flight.layovers) {
      request.flight.layovers.forEach((layover, index) => {
        if (!layover.airport || !layover.airport.code || !layover.airport.timezone) {
          throw new Error(`Layover ${index + 1} airport details are incomplete`);
        }

        if (!layover.arrivalTime || !this.isValidISODate(layover.arrivalTime)) {
          throw new Error(`Invalid arrival time for layover ${index + 1}`);
        }

        if (!layover.departureTime || !this.isValidISODate(layover.departureTime)) {
          throw new Error(`Invalid departure time for layover ${index + 1}`);
        }

        if (!layover.duration || layover.duration <= 0) {
          throw new Error(`Invalid duration for layover ${index + 1}`);
        }

        const layoverArrival = new Date(layover.arrivalTime);
        const layoverDeparture = new Date(layover.departureTime);

        if (layoverDeparture <= layoverArrival) {
          throw new Error(`Layover ${index + 1} departure must be after arrival`);
        }
      });
    }

    // Validate preferences if present
    if (request.preferences) {
      const { chronotype, lightSensitivity, caffeineMetabolism, typicalSleepDuration, preferredWakeTime } = request.preferences;

      if (chronotype && !['early', 'normal', 'late'].includes(chronotype)) {
        throw new Error('Invalid chronotype value');
      }

      if (lightSensitivity && !['low', 'normal', 'high'].includes(lightSensitivity)) {
        throw new Error('Invalid light sensitivity value');
      }

      if (caffeineMetabolism && !['fast', 'normal', 'slow'].includes(caffeineMetabolism)) {
        throw new Error('Invalid caffeine metabolism value');
      }

      if (typicalSleepDuration && (typicalSleepDuration < 4 || typicalSleepDuration > 12)) {
        throw new Error('Invalid sleep duration (must be between 4 and 12 hours)');
      }

      if (preferredWakeTime && !this.isValidTimeFormat(preferredWakeTime)) {
        throw new Error('Invalid preferred wake time format (use HH:mm)');
      }
    }
  }

  private isValidISODate(dateStr: string): boolean {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime()) && dateStr.includes('T');
  }

  private isValidTimeFormat(timeStr: string): boolean {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr);
  }
} 