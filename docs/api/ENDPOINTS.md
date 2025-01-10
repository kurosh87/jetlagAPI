# API Endpoints Reference

## Base URL
```
https://jetlag-cxqrhjtmy-intrepid-app.vercel.app/api
```

## Available Endpoints

### Health Check
```http
GET /test
```

Response:
```json
{
  "message": "Jetlag API is running!",
  "timestamp": "2024-02-01T12:00:00Z",
  "version": "1.0.0"
}
```

### Flight Search

#### Search by Carrier and Flight Number
```http
GET /flights/search
```

Query Parameters:
- `carrier` (required): Airline carrier code (e.g., "UA")
- `flightNumber` (required): Flight number
- `date` (optional): Flight date (YYYY-MM-DD)

Success Response (200):
```json
{
  "flights": [
    {
      "id": "flight123",
      "carrier": "UA",
      "flightNumber": "837",
      "departureTime": "2024-02-01T10:00:00Z",
      "arrivalTime": "2024-02-02T14:00:00Z",
      "origin": {
        "code": "SFO",
        "name": "San Francisco International Airport",
        "timezone": "America/Los_Angeles"
      },
      "destination": {
        "code": "NRT",
        "name": "Narita International Airport",
        "timezone": "Asia/Tokyo"
      }
    }
  ]
}
```

Error Responses:
- 400: Missing required parameters
- 404: No flights found
- 500: Server error

### Airport Search

#### Search by IATA Code
```http
GET /airports/search?code={iata_code}
```

#### Search by City
```http
GET /airports/search?city={city_name}
```

#### General Search
```http
GET /airports/search?query={search_term}
```

Query Parameters (use one of):
- `code`: IATA airport code (e.g., "SFO")
- `city`: City name (e.g., "San Francisco")
- `query`: General search term

Success Response (200):
```json
{
  "airports": [
    {
      "id": "sfo",
      "iataCode": "SFO",
      "name": "San Francisco International Airport",
      "city": "San Francisco",
      "country": "United States",
      "timezone": "America/Los_Angeles",
      "coordinates": {
        "latitude": 37.7749,
        "longitude": -122.4194
      }
    }
  ]
}
```

Error Responses:
- 400: Missing search parameter
- 404: No airports found
- 500: Server error

### Jetlag Schedule Calculation

```http
POST /calculate
```

Request Body:
```json
{
  "departureTime": "2024-02-01T10:00:00Z",
  "arrivalTime": "2024-02-02T14:00:00Z",
  "timeZoneDifference": 8,
  "userProfile": {
    "age": 30,
    "chronotype": "MODERATE_MORNING",
    "sleepProfile": {
      "typicalBedTime": "23:00",
      "typicalWakeTime": "07:00",
      "sleepQuality": "GOOD",
      "sleepLatency": 15,
      "canNap": true,
      "consistentSchedule": true
    }
  }
}
```

Success Response (200):
```json
{
  "postArrival": {
    "days": [
      {
        "dayIndex": 0,
        "activities": [
          {
            "id": "act_123",
            "type": "BRIGHT_LIGHT",
            "timeWindow": {
              "start": "06:00",
              "end": "08:00"
            },
            "priority": "HIGH"
          },
          {
            "id": "act_124",
            "type": "SLEEP",
            "timeWindow": {
              "start": "22:00",
              "end": "06:00"
            },
            "priority": "HIGH"
          }
        ]
      }
    ],
    "expectedRecoveryDays": 3
  }
}
```

Error Responses:
- 400: Missing required fields
- 500: Calculation error

### Chronotype Profile

#### Get Assessment
```http
GET /chronotype
```

Success Response (200):
```json
{
  "questions": [
    {
      "id": "q1",
      "text": "On a free day (no work/commitments), what time would you naturally go to bed?",
      "type": "TIME_SELECT",
      "options": ["Before 21:00", "21:00-22:00", "22:00-23:00", "23:00-00:00", "After 00:00"]
    },
    {
      "id": "q2",
      "text": "How long does it typically take you to fall asleep?",
      "type": "DURATION_SELECT",
      "options": ["Less than 15 minutes", "15-30 minutes", "30-60 minutes", "More than 60 minutes"]
    },
    {
      "id": "q3",
      "text": "Can you usually take naps during the day?",
      "type": "BOOLEAN_SELECT",
      "options": ["Yes", "No", "Sometimes"]
    }
  ]
}
```

#### Create/Update Profile
```http
POST /chronotype
```

Request Body:
```json
{
  "age": 30,
  "sleepProfile": {
    "typicalBedTime": "23:00",
    "typicalWakeTime": "07:00",
    "sleepQuality": "GOOD",
    "sleepLatency": 15,
    "canNap": true,
    "consistentSchedule": true
  }
}
```

Success Response (200):
```json
{
  "profile": {
    "age": 30,
    "chronotype": "MODERATE_MORNING",
    "sleepProfile": {
      "typicalBedTime": "23:00",
      "typicalWakeTime": "07:00",
      "sleepQuality": "GOOD",
      "sleepLatency": 15,
      "canNap": true,
      "consistentSchedule": true
    }
  },
  "recommendations": {
    "optimalSleepWindow": {
      "start": "23:00",
      "end": "07:00"
    },
    "lightExposurePreference": {
      "morning": "CRITICAL",
      "evening": "MODERATE"
    },
    "adaptationSpeed": "NORMAL",
    "napRecommendation": {
      "timing": "MID_AFTERNOON",
      "duration": "20-30 minutes"
    }
  }
}
```

Error Responses:
- 400: Invalid profile data
- 500: Server error

## Error Response Format
All error responses follow this format:
```json
{
  "error": "Error message description",
  "details": "Additional error details (if available)"
}
```

## Rate Limits
- 100 requests per minute per IP
- 1000 requests per hour per IP

## Notes
- All timestamps should be in ISO 8601 format with UTC timezone
- Time strings for bed/wake times should be in 24-hour format (HH:MM)
- IATA codes should be uppercase 

## Flight Search Endpoints

### Search Flights
```http
GET /api/flights/search
```

#### Query Parameters
- `carrier` (string): Airline carrier code (e.g., "UA", "AA")
- `flightNumber` (string): Flight number
- `date` (string, optional): Flight date in YYYY-MM-DD format

#### Response
```json
{
  "flights": [{
    "id": "flightUA837",
    "carrier": "UA",
    "flightNumber": "837",
    "departureTime": "2024-02-01T10:00:00Z",
    "arrivalTime": "2024-02-02T14:00:00Z",
    "origin": {
      "code": "SFO",
      "name": "San Francisco International Airport",
      "timezone": "America/Los_Angeles",
      "coordinates": {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "elevation": 4
      }
    },
    "destination": {
      "code": "NRT",
      "name": "Tokyo Narita International Airport",
      "timezone": "Asia/Tokyo",
      "coordinates": {
        "latitude": 35.7720,
        "longitude": 140.3929,
        "elevation": 41
      }
    },
    "distance": 8279.12, // in kilometers
    "typicalDuration": 650, // in minutes
    "source": "cache" // or "amadeus"
  }]
}
```

### Search Airports/Cities
```http
GET /api/airports/search
```

#### Query Parameters
Use one of:
- `code` (string): IATA airport code (e.g., "SFO")
- `city` (string): City name (e.g., "San Francisco")
- `query` (string): General search term (searches across city, airport name, and code)

#### Response
```json
{
  "airports": [{
    "iataCode": "SFO",
    "name": "San Francisco International Airport",
    "city": "San Francisco",
    "country": "United States",
    "timezone": "America/Los_Angeles",
    "coordinates": {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "elevation": 4
    },
    "utcOffset": -8,
    "daylightSavings": true,
    "type": "international"
  }]
}
```

## Data Flow and Caching Strategy

### Flight Route Lookup
1. **Cache First**
   - First checks Redis cache for carrier + flight number combination
   - Returns cached data if available (includes coordinates and timezone info)
   - Cache has no expiration (flight routes rarely change)

2. **Amadeus Fallback**
   - If route not in cache, fetches from Amadeus API
   - Stores new route data in cache for future use
   - Includes coordinates and timezone data

### Airport/City Search
1. **Firebase Cities Collection**
   ```typescript
   interface City {
     name: string;
     country: string;
     timezone: string;
     coordinates: {
       latitude: number;
       longitude: number;
     };
     airports: {
       iataCode: string;
       name: string;
       type: string; // international, domestic
       coordinates?: {
         latitude: number;
         longitude: number;
         elevation: number;
       };
     }[];
   }
   ```

2. **Search Process**
   - Searches Firebase cities collection first
   - Falls back to Amadeus for unknown airports
   - Caches all results in Redis for future use

## Common Use Cases

### 1. Direct Flight Number Search
```typescript
// Example: United Airlines flight 837
GET /api/flights/search?carrier=UA&flightNumber=837
```

### 2. City-Based Search
```typescript
// Find airports in Tokyo
GET /api/airports/search?city=Tokyo

// General search
GET /api/airports/search?query=Tokyo
```

### 3. Airport Code Search
```typescript
// Get SFO airport details
GET /api/airports/search?code=SFO
```

## Timezone Calculation

The API automatically calculates:
- Time zone difference between origin and destination
- Flight duration
- Distance between airports
- UTC offsets for both locations
- Daylight savings applicability

### Example Calculation
```typescript
interface TimezoneInfo {
  originOffset: number;      // e.g., -8 for PST
  destinationOffset: number; // e.g., +9 for JST
  difference: number;        // e.g., 17 hours
  isDaylightSavings: {
    origin: boolean,
    destination: boolean
  }
}
```

## Error Handling

### Common Error Codes
- `400`: Missing or invalid parameters
- `404`: Flight or airport not found
- `500`: External API error (Amadeus)
- `503`: Cache service unavailable

### Error Response Format
```json
{
  "error": "Error type",
  "details": "Detailed error message"
}
```

## Testing Scenarios

### 1. Flight Number Search
- Valid flight number with cached data
- Valid flight number requiring Amadeus lookup
- Invalid flight number
- Missing carrier or flight number

### 2. Airport/City Search
- Exact IATA code match
- Partial city name match
- Multiple matches for general query
- No matches found

### 3. Edge Cases
- Cities with multiple airports
- Airports serving multiple cities
- International date line crossings
- Daylight savings transitions 