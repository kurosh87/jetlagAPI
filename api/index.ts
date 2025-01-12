import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Root path - API documentation
  if (req.url === '/' || !req.url) {
    return res.status(200).json({
      name: 'Jetlag API',
      version: '1.0.0',
      endpoints: {
        '/weather': {
          method: 'GET',
          description: 'Get weather data for a location',
          parameters: {
            lat: 'number (required) - Latitude',
            lon: 'number (required) - Longitude'
          },
          example: '/weather?lat=37.7749&lon=-122.4194'
        },
        '/jetlag': {
          method: 'POST',
          description: 'Get jetlag adaptation schedule',
          body: {
            flight: {
              departure: 'string (required) - ISO timestamp',
              arrival: 'string (required) - ISO timestamp'
            },
            phase: 'string (required) - pre-flight, in-flight, or post-flight'
          },
          example: {
            flight: {
              departure: '2024-01-07T10:00:00Z',
              arrival: '2024-01-07T18:00:00Z'
            },
            phase: 'pre-flight'
          }
        }
      }
    });
  }

  // Weather endpoint
  if (req.url?.includes('/weather') && req.method === 'GET') {
    try {
      const { lat, lon } = req.query;
      if (!lat || !lon) {
        return res.status(400).json({ error: 'Missing latitude or longitude' });
      }
      // Mock weather response for now
      return res.status(200).json({
        temperature: 20,
        conditions: 'sunny',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Jetlag endpoint
  if (req.url?.includes('/jetlag') && req.method === 'POST') {
    try {
      const { flight, phase } = req.body;
      if (!flight || !phase) {
        return res.status(400).json({ error: 'Missing flight or phase data' });
      }
      // Mock jetlag response for now
      return res.status(200).json({
        schedule: {
          lightExposure: { start: '08:00', end: '10:00' },
          meals: [{ time: '12:00', type: 'lunch' }],
          sleep: { start: '22:00', end: '06:00' }
        },
        recommendations: ['Avoid caffeine after 2pm', 'Get morning sunlight']
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Debug response for 404s
  return res.status(404).json({ 
    error: 'Endpoint not found',
    message: 'Visit / for API documentation',
    requestedPath: req.url,
    method: req.method
  });
} 