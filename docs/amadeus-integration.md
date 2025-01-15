# Amadeus API Integration Guide

## Overview
This guide documents the integration between our Jetlag API and the Amadeus Flight API. We use Amadeus to fetch accurate flight schedules and airport information, which feeds into our jetlag calculation algorithm.

## Authentication

```bash
# Get access token (valid for 30 minutes)
curl -X POST "https://api.amadeus.com/v1/security/oauth2/token" \
-H "Content-Type: application/x-www-form-urlencoded" \
-d "grant_type=client_credentials&client_id=$AMADEUS_API_KEY&client_secret=$AMADEUS_API_SECRET"
```

### Response Format
```json
{
    "type": "amadeusOAuth2Token",
    "username": "your_username",
    "application_name": "your_app",
    "client_id": "your_client_id",
    "token_type": "Bearer",
    "access_token": "your_access_token",
    "expires_in": 1799,
    "state": "approved",
    "scope": ""
}
```

## Flight Schedule Search

### Endpoint
```bash
curl -X GET "https://api.amadeus.com/v2/schedule/flights?carrierCode={carrier}&flightNumber={number}&scheduledDepartureDate=2025-01-17" \
-H "Authorization: Bearer {token}"
```

### Example Request
```bash
curl -X GET "https://api.amadeus.com/v2/schedule/flights?carrierCode=BA&flightNumber=286&scheduledDepartureDate=2025-01-17" \
-H "Authorization: Bearer {token}"
```

### Example Response
```json
{
  "data": [{
    "type": "DatedFlight",
    "scheduledDepartureDate": "2025-01-17",
    "flightDesignator": {
      "carrierCode": "BA",
      "flightNumber": 286
    },
    "flightPoints": [{
      "iataCode": "SFO",
      "departure": {
        "timings": [{
          "qualifier": "STD",
          "value": "2025-01-17T20:40-08:00"
        }]
      }
    }, {
      "iataCode": "LHR",
      "arrival": {
        "timings": [{
          "qualifier": "STA",
          "value": "2025-01-18T15:15Z"
        }]
      }
    }],
    "segments": [{
      "boardPointIataCode": "SFO",
      "offPointIataCode": "LHR",
      "scheduledSegmentDuration": "PT10H35M",
      "partnership": {
        "operatingFlight": {
          "carrierCode": "AY",
          "flightNumber": 5526
        }
      }
    }]
  }]
}
```

## Airport Information

### Endpoint
```bash
curl -X GET "https://api.amadeus.com/v1/reference-data/locations?subType=AIRPORT&keyword={airport_code}" \
-H "Authorization: Bearer {token}"
```

### Example Request
```bash
curl -X GET "https://api.amadeus.com/v1/reference-data/locations?subType=AIRPORT&keyword=SFO" \
-H "Authorization: Bearer {token}"
```

### Example Response
```json
{
    "data": [{
        "type": "location",
        "subType": "AIRPORT",
        "name": "SAN FRANCISCO INTL",
        "detailedName": "SAN FRANCISCO/CA/US:SAN FRANCI",
        "timeZoneOffset": "-08:00",
        "iataCode": "SFO",
        "geoCode": {
            "latitude": 37.61889,
            "longitude": -122.37500
        },
        "address": {
            "cityName": "SAN FRANCISCO",
            "cityCode": "SFO",
            "countryName": "UNITED STATES OF AMERICA",
            "countryCode": "US",
            "stateCode": "CA",
            "regionCode": "NAMER"
        }
    }]
}
```

## Integration Notes

### Important Considerations
1. Always use production API (api.amadeus.com)
2. Use 2025-01-17 for testing/development
3. Token expires after 30 minutes
4. All times include timezone offsets
5. Flight durations are in ISO 8601 duration format (e.g., PT10H35M)

### Data Used by Jetlag Algorithm

1. Flight Details:
   - Duration (`scheduledSegmentDuration`)
   - Departure time with timezone (`departure.timings[0].value`)
   - Arrival time with timezone (`arrival.timings[0].value`)
   - Layover information (if multi-segment)

2. Timezone Information:
   - Origin timezone offset
   - Destination timezone offset
   - Used for calculating:
     - Time difference
     - Direction of travel (eastward/westward)
     - Adaptation schedule

3. Geographic Data:
   - Airport coordinates
   - Used for:
     - Solar exposure calculations
     - Seasonal adjustments
     - Regional adaptations

### Error Handling

Common error codes:
- 401: Invalid/expired token
- 400: Invalid parameters (e.g., past date)
- 404: Flight or airport not found
- 429: Rate limit exceeded

### Rate Limits
- 10 requests per second
- 5000 requests per month (production)

## Testing

### Test Flight Numbers
1. BA286: SFO-LHR (10h 35m)
2. UA857: SFO-PVG (13h 55m)

### Test Airports
1. SFO: UTC-08:00
2. LHR: UTC+00:00
3. PVG: UTC+08:00

## Troubleshooting

1. Invalid Token
   ```bash
   # Regenerate token
   curl -X POST "https://api.amadeus.com/v1/security/oauth2/token" ...
   ```

2. Past Date Error
   ```bash
   # Always use 2025-01-17 for testing
   curl -X GET "https://api.amadeus.com/v2/schedule/flights?...&scheduledDepartureDate=2025-01-17" ...
   ```

3. Invalid Flight
   - Verify carrier code is correct (e.g., BA, not BAW)
   - Verify flight operates on chosen date
   - Check if flight number includes leading zeros 

## Service Integration

### Complete Flow Example

1. User Input:
```typescript
{
  carrierCode: "BA",
  flightNumber: "286",
  date: "2025-01-17"
}
```

2. Service Flow:
```typescript
async function searchFlightWithJetlag(carrier: string, flightNumber: string, date: string) {
  // 1. Get Amadeus token
  const token = await getAmadeusToken();

  // 2. Get flight schedule
  const flightData = await fetch(
    `https://api.amadeus.com/v2/schedule/flights?carrierCode=${carrier}&flightNumber=${flightNumber}&scheduledDepartureDate=${date}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  // 3. Get airport details for origin and destination
  const originData = await fetch(
    `https://api.amadeus.com/v1/reference-data/locations?subType=AIRPORT&keyword=${flightData.data[0].flightPoints[0].iataCode}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const destData = await fetch(
    `https://api.amadeus.com/v1/reference-data/locations?subType=AIRPORT&keyword=${flightData.data[0].flightPoints[1].iataCode}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  // 4. Transform data for jetlag calculation
  const flight = {
    origin: {
      timezone: originData.data[0].timeZoneOffset,
      coordinates: originData.data[0].geoCode
    },
    destination: {
      timezone: destData.data[0].timeZoneOffset,
      coordinates: destData.data[0].geoCode
    },
    departureTime: new Date(flightData.data[0].flightPoints[0].departure.timings[0].value),
    arrivalTime: new Date(flightData.data[0].flightPoints[1].arrival.timings[0].value),
    duration: parseDuration(flightData.data[0].segments[0].scheduledSegmentDuration),
    layovers: [] // Add logic for multi-segment flights
  };

  // 5. Calculate jetlag adaptation
  const jetlagService = new JetlagCalculationService();
  const adaptationSchedule = jetlagService.calculateJetlagAdaptation(flight);

  return {
    flight: {
      ...flight,
      carrier,
      flightNumber,
      origin: {
        ...flight.origin,
        code: originData.data[0].iataCode,
        name: originData.data[0].name,
        city: originData.data[0].address.cityName,
        country: originData.data[0].address.countryName
      },
      destination: {
        ...flight.destination,
        code: destData.data[0].iataCode,
        name: destData.data[0].name,
        city: destData.data[0].address.cityName,
        country: destData.data[0].address.countryName
      }
    },
    jetlagPlan: adaptationSchedule
  };
}
```

### Data Transformations

1. ISO Duration to Minutes:
```typescript
function parseDuration(isoDuration: string): number {
  // Convert "PT10H35M" to minutes
  const hours = parseInt(isoDuration.match(/(\d+)H/)?.[1] || "0");
  const minutes = parseInt(isoDuration.match(/(\d+)M/)?.[1] || "0");
  return hours * 60 + minutes;
}
```

2. Example Data Mapping:
```typescript
// Amadeus Response → Jetlag Input
{
  // Flight BA286: SFO-LHR
  "flightPoints": [{                    →  origin: {
    "iataCode": "SFO",                        timezone: "-08:00",
    "departure": {                            coordinates: {
      "timings": [{                             latitude: 37.61889,
        "value": "2025-01-17T20:40-08:00"      longitude: -122.37500
      }]                                      }
    }                                       },
  }, {                                    destination: {
    "iataCode": "LHR",                      timezone: "+00:00",
    "arrival": {                            coordinates: {
      "timings": [{                           latitude: 51.47750,
        "value": "2025-01-18T15:15Z"          longitude: -0.46138
      }]                                    }
    }                                     },
  }],                                    departureTime: new Date("2025-01-17T20:40-08:00"),
  "segments": [{                         arrivalTime: new Date("2025-01-18T15:15Z"),
    "scheduledSegmentDuration": "PT10H35M"  duration: 635,  // 10h35m in minutes
  }]                                     layovers: []
}
```

### Error Handling

1. Token Expiration:
```typescript
async function handleAmadeusRequest(url: string, token: string) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (response.status === 401) {
    // Token expired, get new token and retry
    const newToken = await getAmadeusToken();
    return fetch(url, {
      headers: { Authorization: `Bearer ${newToken}` }
    });
  }
  
  return response;
}
```

2. Invalid Flight:
```typescript
async function validateFlight(carrier: string, flightNumber: string, date: string) {
  const response = await searchFlightSchedule(carrier, flightNumber, date);
  
  if (response.data.length === 0) {
    throw new Error(`No flights found for ${carrier}${flightNumber} on ${date}`);
  }
  
  if (response.data[0].segments.length > 1) {
    console.warn('Multi-segment flight detected, layover calculations will be included');
  }
  
  return response;
}
```

### Testing the Integration

1. Complete Test Flow:
```bash
# 1. Get token
TOKEN=$(curl -X POST "https://api.amadeus.com/v1/security/oauth2/token" \
-H "Content-Type: application/x-www-form-urlencoded" \
-d "grant_type=client_credentials&client_id=$AMADEUS_API_KEY&client_secret=$AMADEUS_API_SECRET" \
| jq -r '.access_token')

# 2. Get flight data
FLIGHT_DATA=$(curl -X GET "https://api.amadeus.com/v2/schedule/flights?carrierCode=BA&flightNumber=286&scheduledDepartureDate=2025-01-17" \
-H "Authorization: Bearer $TOKEN")

# 3. Get airport data
ORIGIN_DATA=$(curl -X GET "https://api.amadeus.com/v1/reference-data/locations?subType=AIRPORT&keyword=SFO" \
-H "Authorization: Bearer $TOKEN")

DEST_DATA=$(curl -X GET "https://api.amadeus.com/v1/reference-data/locations?subType=AIRPORT&keyword=LHR" \
-H "Authorization: Bearer $TOKEN")

# 4. Process data and calculate jetlag (via API endpoint)
curl -X POST "http://localhost:3000/api/flights/jetlag" \
-H "Content-Type: application/json" \
-d "{
  \"flight\": $FLIGHT_DATA,
  \"origin\": $ORIGIN_DATA,
  \"destination\": $DEST_DATA
}"
```

2. Sample API Response:
```json
{
  "success": true,
  "data": {
    "flight": {
      "carrier": "BA",
      "flightNumber": "286",
      "origin": {
        "code": "SFO",
        "timezone": "-08:00",
        "name": "San Francisco International",
        "coordinates": {
          "latitude": 37.61889,
          "longitude": -122.37500
        }
      },
      "destination": {
        "code": "LHR",
        "timezone": "+00:00",
        "name": "London Heathrow",
        "coordinates": {
          "latitude": 51.47750,
          "longitude": -0.46138
        }
      },
      "departureTime": "2025-01-17T20:40:00-08:00",
      "arrivalTime": "2025-01-18T15:15:00Z",
      "duration": 635
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
      "preFlight": { /* adaptation schedule */ },
      "inFlight": { /* adaptation schedule */ },
      "postFlight": { /* adaptation schedule */ }
    }
  }
} 