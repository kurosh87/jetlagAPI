import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';

const app = express();

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
      }
    }
  });
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

// Jetlag endpoint
app.post('/api/jetlag', (req: Request, res: Response) => {
  const { flight, phase } = req.body;
  
  // Mock schedule response for testing
  res.json({
    flight,
    phase,
    schedule: [
      {
        time: '08:00',
        activity: 'Light exposure',
        duration: '30 minutes'
      },
      {
        time: '12:00',
        activity: 'Meal',
        description: 'Light lunch'
      }
    ],
    recommendations: [
      'Avoid caffeine after 2 PM',
      'Get morning sunlight'
    ]
  });
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
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