# API Reference

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication

All endpoints except `/users/register` require authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## Endpoints

### User Management

#### Register User
```http
POST /users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Get User Profile
```http
GET /users/:uid/profile
```

#### Update User Preferences
```http
PUT /users/:uid/preferences
Content-Type: application/json

{
  "preferences": {
    "defaultTimezone": "America/Los_Angeles",
    "notificationsEnabled": true
  }
}
```

### Flight Operations

#### Search Flights
```http
GET /flights/search?origin=SFO&destination=NRT&date=2024-02-01
```

Response:
```json
{
  "flights": [
    {
      "id": "flight123",
      "carrier": "United",
      "flightNumber": "UA837",
      "origin": {
        "code": "SFO",
        "name": "San Francisco International Airport",
        "timezone": "America/Los_Angeles",
        // ...
      },
      "destination": {
        "code": "NRT",
        "name": "Narita International Airport",
        "timezone": "Asia/Tokyo",
        // ...
      },
      "departureTime": "2024-02-01T10:00:00Z",
      "arrivalTime": "2024-02-02T14:00:00Z",
      "duration": 720
    }
  ]
}
```

#### Search Airports
```http
GET /flights/airports?keyword=San%20Francisco
```

#### Get Flight Schedule
```http
GET /flights/schedule?carrierCode=UA&flightNumber=837&date=2024-02-01
```

### Jetlag Calculations

#### Calculate Jetlag
```http
POST /jetlag/calculate
Content-Type: application/json

{
  "origin": {
    "code": "SFO",
    "timezone": "America/Los_Angeles"
  },
  "destination": {
    "code": "NRT",
    "timezone": "Asia/Tokyo"
  },
  "departureTime": "2024-02-01T10:00:00Z",
  "arrivalTime": "2024-02-02T14:00:00Z",
  "duration": 720
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
    "sleepWindows": [
      {
        "start": "2024-02-01T21:00:00Z",
        "end": "2024-02-02T05:00:00Z",
        "priority": 4,
        "notes": "Pre-flight sleep window"
      }
    ],
    "lightExposure": [
      {
        "start": "2024-02-02T06:00:00Z",
        "end": "2024-02-02T10:00:00Z",
        "type": "bright",
        "intensity": 10000
      }
    ],
    "melatoninWindows": [
      {
        "start": "2024-02-02T19:00:00Z",
        "end": "2024-02-02T21:00:00Z",
        "priority": 3
      }
    ]
  }
}
```

## Error Handling

The API uses standard HTTP status codes and returns errors in the following format:

```json
{
  "error": "Error message here"
}
```

Common status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting

- Development: 100 requests per minute
- Production: 60 requests per minute

## Data Models

### Flight
```typescript
interface Flight {
  id: string;
  carrier: string;
  flightNumber: string;
  origin: Airport;
  destination: Airport;
  departureTime: Date;
  arrivalTime: Date;
  duration: number; // in minutes
  layovers?: Layover[];
}
```

### Airport
```typescript
interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}
```

### JetlagSeverity
```typescript
interface JetlagSeverity {
  score: number; // 0-10 scale
  timezoneDifference: number;
  factors: {
    timezoneDifference: number;
    flightDuration: number;
    layoverImpact: number;
    directionality: 'eastward' | 'westward';
  };
}
```

## SDKs and Examples

See the [examples](../examples/) directory for code samples in various languages. 