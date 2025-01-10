# Jetlag API

A RESTful API service for calculating and managing jet lag adaptation schedules, built with TypeScript and Vercel serverless functions.

## Features

- Flight search and information retrieval
- Airport data with timezone information
- Personalized jet lag calculations
- Chronotype assessment and recommendations
- Weather data integration
- Caching system for optimal performance

## API Documentation

### Base URL
```
https://jetlag-cxqrhjtmy-intrepid-app.vercel.app/api
```

### Core Endpoints

- `POST /calculate` - Calculate jet lag adaptation schedule
- `GET /chronotype` - Get chronotype assessment
- `POST /chronotype` - Create/update user profile
- `GET /flights/search` - Search flights
- `GET /airports/search` - Search airports

For detailed API documentation, see [API Documentation](docs/api/ENDPOINTS.md).

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Redis (for caching)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/jetlag-api.git
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

Required environment variables:
- `AMADEUS_CLIENT_ID` - Amadeus API client ID
- `AMADEUS_CLIENT_SECRET` - Amadeus API client secret
- `OPENWEATHER_API_KEY` - OpenWeather API key
- `REDIS_URL` - Redis connection URL

4. Run development server:
```bash
npm run dev
```

### Testing

Run the test suite:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

## Mobile Integration

### iOS Swift Integration

1. Add the base URL to your configuration:
```swift
let baseURL = "https://jetlag-cxqrhjtmy-intrepid-app.vercel.app/api"
```

2. Create API client methods:
```swift
func searchFlight(carrier: String, flightNumber: String) async throws -> Flight {
    let url = "\(baseURL)/flights/search?carrier=\(carrier)&flightNumber=\(flightNumber)"
    // Implementation
}

func calculateJetlag(departureTime: Date, arrivalTime: Date, timeZoneDifference: Int) async throws -> Schedule {
    let url = "\(baseURL)/calculate"
    // Implementation
}
```

See [Quick Start Guide](docs/api/QUICKSTART.md) for more integration examples.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 