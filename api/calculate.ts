import { VercelRequest, VercelResponse } from '@vercel/node';
import { JetlagService } from '../src/services/jetlagService';
import { WeatherService } from '../src/services/weatherService';
import { JetlagValidationError } from '../src/types/errors';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      departureTime,
      arrivalTime,
      timeZoneDifference,
      userProfile
    } = req.body;

    // Validate required fields
    if (!departureTime || !arrivalTime || timeZoneDifference === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'departureTime, arrivalTime, and timeZoneDifference are required'
      });
    }

    // Initialize services
    const weatherService = new WeatherService();
    const jetlagService = new JetlagService(weatherService);

    // Calculate schedule
    const schedule = await jetlagService.calculateSchedule({
      departureTime,
      arrivalTime,
      timeZoneDifference,
      userProfile
    });

    return res.status(200).json(schedule);

  } catch (error) {
    if (error instanceof JetlagValidationError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.message
      });
    }

    console.error('Error calculating jetlag schedule:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: 'An error occurred while calculating the jetlag schedule'
    });
  }
} 