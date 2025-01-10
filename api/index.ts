import { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  runtime: 'edge',
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    return res.status(200).json({
      name: 'Jetlag API',
      version: '1.0.0',
      status: 'operational',
      timestamp: new Date().toISOString(),
      endpoints: {
        root: '/api',
        test: '/api/test',
        calculate: '/api/calculate',
        chronotype: '/api/chronotype',
        flightSearch: '/api/flights/search',
        airportSearch: '/api/airports/search',
        weather: {
          location: '/api/weather/location',
          airport: '/api/weather/airport'
        }
      },
      documentation: 'https://github.com/kurosh87/jetlagAPI/blob/main/docs/api/ENDPOINTS.md'
    });
  } catch (error) {
    console.error('Error in root endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while processing your request'
    });
  }
} 