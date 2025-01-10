# Jetlag API Quick Start Guide

## Introduction
The Jetlag API provides endpoints for calculating personalized jet lag adaptation schedules based on flight details, user chronotype, and sleep preferences.

## Getting Started

### Base URL
All API requests should be made to:
```
https://jetlag-cxqrhjtmy-intrepid-app.vercel.app/api
```

### Basic Flow

1. **Check API Status**
```bash
curl https://jetlag-cxqrhjtmy-intrepid-app.vercel.app/api/test
```

2. **Search for Airports**
```bash
# Search by city
curl "https://jetlag-cxqrhjtmy-intrepid-app.vercel.app/api/airports/search?city=San%20Francisco"

# Search by IATA code
curl "https://jetlag-cxqrhjtmy-intrepid-app.vercel.app/api/airports/search?code=SFO"
```

3. **Search for Flights**
```bash
curl "https://jetlag-cxqrhjtmy-intrepid-app.vercel.app/api/flights/search?carrier=UA&flightNumber=837&date=2024-02-01"
```

4. **Create User Profile**
```bash
curl -X POST "https://jetlag-cxqrhjtmy-intrepid-app.vercel.app/api/chronotype" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 30,
    "sleepProfile": {
      "typicalBedTime": "23:00",
      "typicalWakeTime": "07:00",
      "sleepQuality": "GOOD",
      "sleepLatency": 15,
      "canNap": true,
      "consistentSchedule": true
    }
  }'
```

5. **Calculate Jet Lag Schedule**
```bash
curl -X POST "https://jetlag-cxqrhjtmy-intrepid-app.vercel.app/api/calculate" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

## Common Use Cases

### 1. Flight Planning
1. Search for airports by city or code
2. Search for specific flight using carrier and flight number
3. Calculate jet lag schedule for the flight

### 2. User Personalization
1. Get chronotype assessment questions
2. Submit user profile with sleep preferences
3. Get personalized recommendations

### 3. Schedule Generation
1. Submit flight details with user profile
2. Receive personalized adaptation schedule
3. Get activity recommendations for each day

## Best Practices

1. **Error Handling**
   - Always check response status codes
   - Handle 404 (Not Found) for searches
   - Handle 400 (Bad Request) for invalid inputs

2. **Date/Time Handling**
   - Use ISO 8601 format for timestamps
   - Always specify timezone as UTC
   - Use 24-hour format for time strings

3. **Rate Limiting**
   - Stay within rate limits (100/minute, 1000/hour)
   - Implement exponential backoff for retries
   - Cache frequently accessed data

4. **Data Validation**
   - Validate all required fields
   - Check time format consistency
   - Verify IATA codes are uppercase

## Example Applications

### 1. Travel Planning App
```javascript
async function planTrip(origin, destination, date) {
  // 1. Search for airports
  const originAirport = await searchAirport(origin);
  const destAirport = await searchAirport(destination);

  // 2. Search for flights
  const flights = await searchFlights(originAirport.code, destAirport.code, date);

  // 3. Calculate jet lag for each flight
  const schedules = await Promise.all(
    flights.map(flight => calculateJetlag(flight))
  );

  return { flights, schedules };
}
```

### 2. User Profile Setup
```javascript
async function setupUserProfile(userDetails) {
  // 1. Get assessment questions
  const assessment = await getChronotypeAssessment();

  // 2. Process user responses
  const profile = processResponses(userDetails, assessment);

  // 3. Create user profile
  const result = await createChronotypeProfile(profile);

  return result;
}
```

## Need Help?
- See full [API Documentation](./ENDPOINTS.md)
- Check [Common Issues](./TROUBLESHOOTING.md)
- Review [Rate Limits](./ENDPOINTS.md#rate-limits) 