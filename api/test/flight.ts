import { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  runtime: 'edge',
  public: true
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Sample data for EVA Air BR10 (TPE to LAX)
  const flightData = {
    carrier: 'EVA',
    flightNumber: 'BR10',
    route: {
      departure: {
        airport: 'TPE',
        city: 'Taipei',
        timezone: 'Asia/Taipei',
        coordinates: {
          latitude: 25.0777,
          longitude: 121.2322
        },
        datetime: '2024-01-10T20:45:00+08:00'
      },
      arrival: {
        airport: 'LAX',
        city: 'Los Angeles',
        timezone: 'America/Los_Angeles',
        coordinates: {
          latitude: 33.9416,
          longitude: -118.4085
        },
        datetime: '2024-01-10T16:45:00-08:00'
      },
      duration: '12:00',
      timezoneOffset: -16
    }
  };

  const recommendations = {
    beforeFlight: [
      {
        day: -2,
        activities: [
          { time: '22:00', action: 'Go to bed 1 hour earlier than usual' },
          { time: '07:00', action: 'Wake up 1 hour earlier than usual' }
        ]
      },
      {
        day: -1,
        activities: [
          { time: '21:00', action: 'Go to bed 2 hours earlier than usual' },
          { time: '06:00', action: 'Wake up 2 hours earlier than usual' },
          { time: '15:00', action: 'Avoid caffeine from this point' }
        ]
      }
    ],
    duringFlight: [
      { time: 'First 6 hours', action: 'Stay awake, keep cabin lights on' },
      { time: 'After 6 hours', action: 'Try to sleep, adjust to LA time' },
      { time: '2 hours before landing', action: 'Wake up, exposure to bright light' }
    ],
    afterArrival: [
      {
        day: 1,
        activities: [
          { time: '07:00', action: 'Get morning sunlight exposure' },
          { time: '12:00', action: 'Light lunch' },
          { time: '22:00', action: 'Sleep at destination time' }
        ]
      },
      {
        day: 2,
        activities: [
          { time: '07:00', action: 'Morning walk outside' },
          { time: '15:00', action: 'Light exercise' },
          { time: '22:00', action: 'Normal sleep schedule' }
        ]
      }
    ]
  };

  res.status(200).json({
    flight: flightData,
    jetlagMitigation: recommendations,
    _meta: {
      generated: new Date().toISOString(),
      flightType: 'westward',
      timezoneChange: '-16 hours',
      recoveryDays: 'Approximately 3-4 days'
    }
  });
} 