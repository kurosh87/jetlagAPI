# Jetlag API Documentation

Welcome to the Jetlag API documentation. This API service helps calculate and mitigate jetlag effects for travelers.

## Table of Contents

1. [Getting Started](./getting-started.md)
2. [API Reference](./api/README.md)
3. [Firebase Setup](./firebase/README.md)
4. [Deployment Guide](./deployment/README.md)

## Project Overview

The Jetlag API is a TypeScript-based service that:
- Calculates jetlag severity based on flight details
- Generates personalized mitigation schedules
- Integrates with Amadeus and FlightAware for flight data
- Uses Firebase for user management and data storage

## Quick Start

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
# Edit .env with your configuration
```

4. Start development server:
```bash
# Start API and emulators
npm run dev:full

# Or start individually
npm run dev          # API only
npm run dev:emulator # Firebase emulators only
```

## Development Environment

The project uses several development tools:
- TypeScript for type-safe code
- Firebase Emulators for local development
- Jest for testing
- ESLint and Prettier for code quality

## Available Scripts

- `npm run dev` - Start development server
- `npm run dev:emulator` - Start Firebase emulators
- `npm run dev:full` - Start both API and emulators
- `npm run build` - Build production version
- `npm run test` - Run tests
- `npm run deploy` - Deploy to Firebase
- `npm run deploy:rules` - Deploy Firebase rules only

## Project Structure

```
jetlag-api/
├── src/
│   ├── config/      # Configuration files
│   ├── controllers/ # Request handlers
│   ├── services/    # Business logic
│   ├── types/       # TypeScript types
│   └── routes/      # API routes
├── docs/           # Documentation
├── tests/          # Test files
└── firebase/       # Firebase configuration
```

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

## License

This project is licensed under the ISC License - see the [LICENSE](../LICENSE) file for details. 