import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Root endpoint with API documentation
app.get('/', (req, res) => {
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
app.get('/api/weather', (req, res) => {
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
app.post('/api/jetlag', (req, res) => {
  const { flight, phase } = req.body;
  
  // Mock schedule response for testing
  res.json({
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
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found. Visit / for API documentation.' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app; 