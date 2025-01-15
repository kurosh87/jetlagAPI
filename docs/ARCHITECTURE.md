# Jetlag API Architecture

## System Overview

The Jetlag API is designed as a microservice that integrates with Amadeus API to provide jetlag adaptation schedules. The system follows a layered architecture pattern with clear separation of concerns.

```
┌─────────────────┐
│   Flutter App   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│   API Layer     │───▶│  Amadeus API    │
└────────┬────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Service Layer   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Domain Layer   │
└─────────────────┘
```

## Core Components

### 1. API Layer (`src/api/`)
- Express.js REST API
- Request validation
- Error handling
- Response formatting
- Rate limiting
- CORS configuration

### 2. Service Layer (`src/services/`)

#### FlightService
- Handles Amadeus API integration
- Flight search and mapping
- Airport details retrieval
- Timezone data management

#### JetlagCalculationService
- Calculates jetlag severity
- Generates adaptation schedules
- Handles timezone calculations
- Activity scheduling logic

### 3. Domain Layer (`src/types/`)
- Type definitions
- Interfaces
- Enums
- Domain models

### 4. Utilities (`src/utils/`)
- Authentication helpers
- Timezone utilities
- Date handling
- Error types

## Key Features

### Asynchronous Processing
```typescript
async function searchFlights(carrier: string, flightNumber: string, date: string): Promise<Flight[]> {
  const token = await getAmadeusToken();
  const flightData = await fetchFlightSchedule(token, carrier, flightNumber, date);
  const enrichedData = await enrichWithAirportDetails(token, flightData);
  return mapToFlightModel(enrichedData);
}
```

### Error Handling
```typescript
try {
  const result = await operation();
  return success(result);
} catch (error) {
  if (error instanceof AmadeusError) {
    return failure(error.message, 401);
  }
  return failure('Internal server error', 500);
}
```

### Caching Strategy
- In-memory caching for Amadeus tokens
- Airport data caching
- Cache invalidation on error

## Data Flow

1. **Request Reception**
   ```
   Client Request → API Endpoint → Request Validation
   ```

2. **Flight Data Retrieval**
   ```
   Amadeus Authentication → Flight Search → Airport Details
   ```

3. **Jetlag Calculation**
   ```
   Flight Data → Timezone Analysis → Schedule Generation
   ```

4. **Response Delivery**
   ```
   Schedule Formatting → Response Validation → Client Response
   ```

## Security

### Authentication
- Environment-based configuration
- Secure token management
- API key rotation support

### Data Protection
- HTTPS only
- Request validation
- Input sanitization
- Rate limiting

## Testing Strategy

### Unit Tests
- Service methods
- Utility functions
- Type validations

### Integration Tests
- API endpoints
- Amadeus integration
- Error scenarios

### End-to-End Tests
- Complete flow testing
- Real flight scenarios
- Edge cases

## Deployment

### Railway Configuration
```yaml
services:
  - name: jetlag-api
    type: web
    env: node
    buildCommand: npm run build
    startCommand: npm start
    envVars:
      - key: AMADEUS_API_KEY
        sync: false
      - key: AMADEUS_API_SECRET
        sync: false
```

### Scaling
- Automatic horizontal scaling
- Load balancing
- Health monitoring

## Monitoring

### Metrics
- Request latency
- Error rates
- API usage
- Cache hit rates

### Logging
- Request/response logging
- Error tracking
- Performance monitoring

## Future Improvements

1. **Performance**
   - Response caching
   - Batch processing
   - Query optimization

2. **Features**
   - Multiple flight support
   - Custom adaptation preferences
   - Historical data analysis

3. **Integration**
   - Additional flight data providers
   - Weather integration
   - Travel advisory services 