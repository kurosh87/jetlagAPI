# Jetlag Mitigation API

A robust TypeScript API service for calculating jetlag severity and generating personalized mitigation schedules based on flight details and scientific principles of circadian rhythm adjustment.

## Features

- Jetlag severity calculation based on multiple factors:
  - Time zone differences
  - Flight duration
  - Layover impact
  - Travel direction (eastward/westward)
- Personalized activity schedules including:
  - Sleep windows
  - Light exposure recommendations
  - Melatonin timing suggestions
  - Caffeine intake guidance
- Integration with flight data providers (Amadeus/FlightAware)
- Firebase integration for user data management
- Scientifically backed algorithms based on circadian rhythm research

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account and credentials
- Amadeus or FlightAware API credentials

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd jetlag-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your configuration values.

4. Build the project:
```bash
npm run build
```

## Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

## API Endpoints

### Calculate Jetlag

`POST /api/jetlag/calculate`

Request body:
```json
{
  "origin": {
    "code": "SFO",
    "name": "San Francisco International Airport",
    "city": "San Francisco",
    "country": "United States",
    "timezone": "America/Los_Angeles",
    "coordinates": {
      "latitude": 37.7749,
      "longitude": -122.4194
    }
  },
  "destination": {
    "code": "NRT",
    "name": "Narita International Airport",
    "city": "Tokyo",
    "country": "Japan",
    "timezone": "Asia/Tokyo",
    "coordinates": {
      "latitude": 35.6762,
      "longitude": 139.6503
    }
  },
  "departureTime": "2024-01-01T08:00:00Z",
  "arrivalTime": "2024-01-02T12:00:00Z",
  "duration": 720,
  "carrier": "United",
  "flightNumber": "UA837"
}
```

Response:
```json
{
  "severity": {
    "score": 7.5,
    "timezoneDifference": 16,
    "factors": {
      "timezoneDifference": 16,
      "flightDuration": 1.5,
      "layoverImpact": 0,
      "directionality": "westward"
    }
  },
  "schedule": {
    "sleepWindows": [...],
    "lightExposure": [...],
    "melatoninWindows": [...],
    "caffeineWindows": [...]
  }
}
```

## Testing

Run the test suite:
```bash
npm test
```

## Deployment

The API is designed to be deployed on Vercel. Configure your Vercel project and deploy:

```bash
vercel
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Circadian rhythm research papers and studies
- Jetlag mitigation best practices
- Open-source contributors 