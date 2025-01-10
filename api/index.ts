import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.status(200).json({
    name: 'Jetlag API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      test: '/api/test',
      calculate: '/api/calculate',
      chronotype: '/api/chronotype',
      flightSearch: '/api/flights/search',
      airportSearch: '/api/airports/search'
    },
    documentation: 'https://github.com/kurosh87/jetlagAPI/blob/main/docs/api/ENDPOINTS.md'
  });
} 