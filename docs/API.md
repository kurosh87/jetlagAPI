# Jetlag API Documentation

## Overview
The Jetlag API provides endpoints for retrieving flight information and generating personalized jetlag adaptation schedules. It integrates with the Amadeus API to fetch real-time flight data and uses advanced algorithms to calculate optimal adaptation strategies.

## Base URL
```
https://jetlag-api.up.railway.app
```

## Authentication
The API uses environment variables for Amadeus API authentication:
- `AMADEUS_API_KEY`: Your Amadeus API key
- `AMADEUS_API_SECRET`: Your Amadeus API secret

## Endpoints

### Search Flight Schedule
```http
GET /api/flights/search
```

Searches for a flight and returns detailed schedule information including jetlag adaptation plan.

#### Query Parameters
| Parameter    | Type   | Required | Description                    |
|-------------|--------|----------|--------------------------------|
| carrier     | string | Yes      | Airline carrier code (e.g., BA)|
| flightNumber| string | Yes      | Flight number (e.g., 286)      |
| date        | string | Yes      | Flight date (YYYY-MM-DD)       |

#### Response Format
```typescript
{
  success: boolean;
  data: {
    flight: {
      id: string;
      carrier: string;
      flightNumber: string;
      origin: {
        code: string;
        timezone: string;
        name: string;
        city: string;
        country: string;
        coordinates: {
          latitude: number;
          longitude: number;
        }
      };
      destination: {
        // Same structure as origin
      };
      departureTime: string;
      arrivalTime: string;
      duration: number;
      layovers?: Array<{
        airport: {
          // Same structure as origin
        };
        arrival: string;
        departure: string;
        duration: number;
      }>;
    };
    jetlagPlan: {
      severity: {
        score: number;
        timezoneDifference: number;
        factors: {
          timezoneDifference: number;
          flightDuration: number;
          layoverImpact: number;
          directionality: 'eastward' | 'westward';
          timeOfDayImpact: number;
        };
        adaptationDays: number;
      };
      preFlight: {
        activities: Array<{
          type: 'SLEEP' | 'LIGHT_EXPOSURE' | 'AVOID_LIGHT' | 'MELATONIN' | 'MEAL' | 'CAFFEINE' | 'EXERCISE';
          timeWindow: {
            start: string;
            end: string;
          };
          priority: number;
          notes?: string;
        }>;
      };
      inFlight: {
        // Same structure as preFlight
      };
      postFlight: {
        // Same structure as preFlight
      };
    };
  };
  error?: string;
}
```

#### Example Request
```bash
curl "https://jetlag-api.up.railway.app/api/flights/search?carrier=BA&flightNumber=286&date=2024-04-20"
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "flight": {
      "id": "BA286",
      "carrier": "BA",
      "flightNumber": "286",
      "origin": {
        "code": "SFO",
        "timezone": "-08:00",
        "name": "San Francisco International",
        "city": "San Francisco",
        "country": "USA",
        "coordinates": {
          "latitude": 37.6213,
          "longitude": -122.3790
        }
      },
      "destination": {
        "code": "LHR",
        "timezone": "+00:00",
        "name": "London Heathrow",
        "city": "London",
        "country": "United Kingdom",
        "coordinates": {
          "latitude": 51.4700,
          "longitude": -0.4543
        }
      },
      "departureTime": "2024-04-20T16:05:00-08:00",
      "arrivalTime": "2024-04-21T10:25:00+00:00",
      "duration": 625
    },
    "jetlagPlan": {
      "severity": {
        "score": 4.8,
        "timezoneDifference": 8,
        "factors": {
          "timezoneDifference": 8,
          "flightDuration": 10.42,
          "layoverImpact": 0,
          "directionality": "eastward",
          "timeOfDayImpact": 1.5
        },
        "adaptationDays": 4
      },
      "preFlight": {
        "activities": [
          {
            "type": "SLEEP",
            "timeWindow": {
              "start": "2024-04-19T22:00:00-08:00",
              "end": "2024-04-20T06:00:00-08:00"
            },
            "priority": 5,
            "notes": "Get well-rested before flight"
          }
          // ... more activities
        ]
      }
      // ... inFlight and postFlight activities
    }
  }
}
```

## Error Handling

The API uses standard HTTP status codes and returns detailed error messages:

| Status Code | Description                                          |
|------------|------------------------------------------------------|
| 200        | Success                                              |
| 400        | Bad Request - Invalid parameters                     |
| 401        | Unauthorized - Invalid or missing Amadeus credentials |
| 404        | Not Found - Flight not found                         |
| 500        | Internal Server Error                                |

Error Response Format:
```json
{
  "success": false,
  "error": "Detailed error message"
}
```

## Rate Limiting
The API inherits Amadeus API's rate limiting:
- 10 requests per second
- 5000 requests per month (test environment)

## Implementation Notes

### Asynchronous Processing
The API handles all Amadeus requests asynchronously:
1. Authenticates with Amadeus
2. Fetches flight schedule
3. Retrieves detailed airport information
4. Calculates timezone differences
5. Generates jetlag adaptation plan

### Timezone Handling
- Uses UTC offsets from Amadeus API
- Handles international date line crossing
- Accounts for DST where applicable

### Activity Scheduling
Pre-flight, in-flight, and post-flight activities are calculated based on:
- Flight duration
- Timezone difference
- Travel direction (eastward/westward)
- Departure/arrival times
- Layover impact

## Deployment
The API is deployed on Railway with automatic scaling and high availability:
- Node.js runtime
- Express.js framework
- TypeScript
- Environment variables for configuration
- Automatic SSL/TLS
- Continuous deployment from main branch 