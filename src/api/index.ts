import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { FlightService } from '../services/flightService';
import { JetlagCalculationService } from '../services/jetlagCalculationService';

// Log all environment variables at startup (excluding sensitive data)
const envVars = Object.keys(process.env).sort().reduce((acc: Record<string, string>, key: string) => {
  if (!key.includes('KEY') && !key.includes('SECRET') && !key.includes('PASSWORD')) {
    acc[key] = process.env[key] || '';
  } else {
    acc[key] = process.env[key] ? '[PRESENT]' : '[MISSING]';
  }
  return acc;
}, {});

console.log('=== Environment Variables at Startup ===');
console.log(JSON.stringify(envVars, null, 2));
console.log('=======================================');

// Log specific environment group variables
console.log('Environment Group Status:', {
  GROUP_NAME: 'jetlag',
  AMADEUS_API_KEY: process.env.AMADEUS_API_KEY ? `Present (${process.env.AMADEUS_API_KEY.length} chars)` : 'Missing',
  AMADEUS_API_SECRET: process.env.AMADEUS_API_SECRET ? `Present (${process.env.AMADEUS_API_SECRET.length} chars)` : 'Missing',
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'Missing',
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || 'Missing',
  FIREBASE_EMULATOR: process.env.FIREBASE_EMULATOR || 'Missing'
});

const app = express();
const flightService = new FlightService();

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint with API documentation
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Jetlag API',
    version: '1.0.0',
    endpoints: {
      '/api/weather': {
        method: 'GET',
        params: {
          lat: 'number (latitude)',
          lon: 'number (longitude)'
        },
        description: 'Get weather data for a location'
      },
      '/api/jetlag': {
        method: 'POST',
        body: {
          flight: {
            departure: 'string (ISO date)',
            arrival: 'string (ISO date)',
            originTimezone: 'string',
            destinationTimezone: 'string'
          },
          phase: 'string'
        },
        description: 'Get jetlag mitigation schedule'
      },
      '/api/flights/search': {
        method: 'POST',
        body: {
          origin: 'string (IATA code)',
          destination: 'string (IATA code)',
          date: 'string (YYYY-MM-DD)'
        },
        description: 'Search for flights between airports'
      },
      '/api/airports/search': {
        method: 'GET',
        params: {
          keyword: 'string'
        },
        description: 'Search for airports by keyword'
      }
    }
  });
});

// Health check endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Weather endpoint
app.get('/api/weather', (req: Request, res: Response) => {
  const { lat, lon } = req.query;
  
  // Mock weather response for testing
  res.json({
    location: { lat, lon },
    temperature: 20,
    conditions: 'sunny',
    timestamp: new Date().toISOString()
  });
});

// Flight search endpoint
app.post('/api/flights/search', async (req: Request, res: Response) => {
  try {
    const { carrierCode, flightNumber, scheduledDepartureDate, segmentChoice } = req.body;
    
    if (!carrierCode || !flightNumber || !scheduledDepartureDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        message: 'Please provide carrierCode, flightNumber, and scheduledDepartureDate'
      });
    }

    const flights = await flightService.searchFlights(
      carrierCode,
      flightNumber,
      scheduledDepartureDate,
      segmentChoice || 'full'
    );
    res.json(flights);
  } catch (error: any) {
    console.error('Error details:', error);
    res.status(500).json({
      error: 'Something went wrong!',
      message: error.message,
      type: error.name
    });
  }
});

// Airport search endpoint
app.get('/api/airports/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyword } = req.query;
    if (!keyword || typeof keyword !== 'string') {
      return res.status(400).json({ error: 'Keyword parameter is required' });
    }
    const airports = await flightService.searchAirports(keyword);
    res.json(airports);
  } catch (error) {
    next(error);
  }
});

// Jetlag endpoint
app.post('/api/jetlag', (req: Request, res: Response) => {
  try {
    const { flight, phase } = req.body;
    const jetlagService = new JetlagCalculationService();
    
    // Convert timezone offsets to IANA names
    const originTimezone = offsetToIANA(flight.originTimezone);
    const destinationTimezone = offsetToIANA(flight.destinationTimezone);
    
    const adaptationSchedule = jetlagService.calculateJetlagAdaptation({
      origin: { timezone: originTimezone },
      destination: { timezone: destinationTimezone },
      departureTime: new Date(flight.departure),
      arrivalTime: new Date(flight.arrival),
      duration: flight.duration,
      layovers: flight.layovers
    }, {
      chronotype: 'normal',
      lightSensitivity: 'normal',
      caffeineMetabolism: 'normal',
      canTakeMelatonin: true
    });

    // Return the appropriate phase of the schedule
    let schedule;
    switch (phase) {
      case 'departure':
        schedule = adaptationSchedule.preFlight;
        break;
      case 'inflight':
        schedule = adaptationSchedule.inFlight;
        break;
      case 'arrival':
        schedule = adaptationSchedule.postFlight;
        break;
      default:
        schedule = adaptationSchedule.preFlight;
    }

    res.json({
      flight: {
        ...flight,
        originTimezone,
        destinationTimezone
      },
      phase,
      severity: adaptationSchedule.severity,
      schedule: schedule.activities.map(activity => ({
        time: formatTime(activity.timeWindow.start),
        activity: activity.type,
        duration: activity.duration || '30 minutes',
        description: activity.notes
      })),
      recommendations: [
        ...schedule.lightExposure.map(light => 
          `${light.type === 'bright' ? 'Seek' : 'Avoid'} bright light from ${formatTime(light.start)} to ${formatTime(light.end)}`
        ),
        ...schedule.melatoninWindows.map(window => 
          `Take melatonin at ${formatTime(window.start)}`
        ),
        ...schedule.caffeineWindows.map(window => 
          `Avoid caffeine after ${formatTime(window.end)}`
        ),
        ...schedule.mealWindows.map(window => 
          `Eat meals between ${formatTime(window.start)} and ${formatTime(window.end)}`
        )
      ]
    });
  } catch (error) {
    console.error('Error calculating jetlag schedule:', error);
    res.status(500).json({ 
      error: 'Failed to calculate jetlag schedule',
      message: error.message 
    });
  }
});

// Helper function to format time
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

// Helper function to convert timezone offset to IANA name
function offsetToIANA(offset: string): string {
  const timezoneMap: Record<string, string> = {
    '+08:00': 'Asia/Taipei',
    '-08:00': 'America/Vancouver',
    '-05:00': 'America/Toronto',
    '-03:00': 'America/Sao_Paulo',
    '+00:00': 'UTC',
    '+01:00': 'Europe/Paris',
    '+09:00': 'Asia/Tokyo',
    '+04:00': 'Asia/Dubai'
  };

  const timezone = timezoneMap[offset];
  if (!timezone) {
    throw new Error(`Invalid timezone offset: ${offset}`);
  }
  return timezone;
}

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    name: err.name
  });
  
  // If it's an Amadeus API error, it might have additional details
  const amadeusError = err as any;
  if (amadeusError.response?.body || amadeusError.code || amadeusError.status) {
    return res.status(amadeusError.status || 500).json({
      error: 'API Error',
      details: {
        message: amadeusError.message,
        code: amadeusError.code,
        status: amadeusError.status,
        description: amadeusError.description,
        response: amadeusError.response?.body
      }
    });
  }

  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message,
    type: err.name
  });
});

// Handle 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found. Visit / for API documentation.' });
});

// Start server
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app; 