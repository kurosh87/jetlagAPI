# Jetlag API

A robust TypeScript API service for jetlag mitigation and flight scheduling. This API provides endpoints for flight search, airport lookup, and personalized jetlag adaptation schedules.

## Live API

Base URL: `https://web-production-ab6d3.up.railway.app`

## API Documentation

### Health Check
```http
GET /api
```
Returns the API health status and current timestamp.

#### Response
```json
{
  "status": "healthy",
  "timestamp": "2025-01-12T23:38:35.935Z"
}
```

### Flight Search
```http
POST /api/flights/search
```
Search for flights by carrier code and flight number.

#### Request Body
```json
{
  "carrierCode": "BR",
  "flightNumber": "10",
  "scheduledDepartureDate": "2025-01-15"
}
```

#### Response
```json
[
  {
    "id": "BR10",
    "carrier": "BR",
    "flightNumber": "10",
    "origin": {
      "code": "TPE",
      "timezone": "+08:00"
    },
    "destination": {
      "code": "YVR",
      "timezone": "-08:00"
    },
    "departureTime": "2025-01-15T15:55:00.000Z",
    "arrivalTime": "2025-01-16T02:35:00.000Z",
    "duration": 640,
    "equipment": "77W",
    "partnership": {
      "operatingCarrier": "AC",
      "operatingFlightNumber": "6546"
    }
  }
]
```

### Airport Search
```http
GET /api/airports/search?keyword=tokyo
```
Search for airports by keyword.

#### Response
```json
[
  {
    "code": "HND",
    "name": "TOKYO INTL HANEDA",
    "city": "TOKYO",
    "country": "JAPAN",
    "timezone": "+09:00",
    "coordinates": {
      "latitude": 35.55223,
      "longitude": 139.77969
    }
  }
]
```

### Jetlag Calculation
```http
POST /api/jetlag
```
Calculate personalized jetlag adaptation schedule.

#### Request Body
```json
{
  "flight": {
    "departure": "2025-01-15T15:55:00.000Z",
    "arrival": "2025-01-16T02:35:00.000Z",
    "originTimezone": "+08:00",
    "destinationTimezone": "-08:00"
  },
  "phase": "arrival"
}
```

#### Response
```json
{
  "flight": {
    "departure": "2025-01-15T15:55:00.000Z",
    "arrival": "2025-01-16T02:35:00.000Z",
    "originTimezone": "Asia/Taipei",
    "destinationTimezone": "America/Vancouver"
  },
  "phase": "arrival",
  "severity": {
    "score": null,
    "timezoneDifference": -16,
    "factors": {
      "timezoneDifference": 16,
      "flightDuration": null,
      "layoverImpact": 0,
      "directionality": "westward",
      "timeOfDayImpact": 0.5
    },
    "adaptationDays": 16
  },
  "schedule": [
    {
      "time": "11:00 PM",
      "activity": "sleep",
      "duration": "30 minutes",
      "description": "Post-flight sleep window"
    }
  ],
  "recommendations": [
    "Seek bright light from 07:00 PM to 09:00 PM",
    "Avoid bright light from 06:00 AM to 08:00 AM",
    "Take melatonin at 09:00 PM",
    "Avoid caffeine after 05:00 PM"
  ]
}
```

## Flutter Integration Guide

### 1. Add Dependencies
Add the following to your `pubspec.yaml`:

```yaml
dependencies:
  http: ^1.1.0
  timezone: ^0.9.2
```

### 2. API Client Example

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class JetlagApiClient {
  static const String baseUrl = 'https://web-production-ab6d3.up.railway.app';

  Future<Map<String, dynamic>> searchFlight(String carrierCode, String flightNumber, String date) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/flights/search'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'carrierCode': carrierCode,
        'flightNumber': flightNumber,
        'scheduledDepartureDate': date,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to search flight');
    }
  }

  Future<List<Map<String, dynamic>>> searchAirports(String keyword) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/airports/search?keyword=$keyword'),
    );

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    } else {
      throw Exception('Failed to search airports');
    }
  }

  Future<Map<String, dynamic>> calculateJetlag({
    required String departure,
    required String arrival,
    required String originTimezone,
    required String destinationTimezone,
    String phase = 'arrival',
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/jetlag'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'flight': {
          'departure': departure,
          'arrival': arrival,
          'originTimezone': originTimezone,
          'destinationTimezone': destinationTimezone,
        },
        'phase': phase,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to calculate jetlag schedule');
    }
  }
}
```

### 3. Usage Example

```dart
void main() async {
  final api = JetlagApiClient();

  // Search for a flight
  try {
    final flight = await api.searchFlight('BR', '10', '2025-01-15');
    print('Flight found: ${flight.toString()}');
  } catch (e) {
    print('Error searching flight: $e');
  }

  // Search for airports
  try {
    final airports = await api.searchAirports('tokyo');
    print('Airports found: ${airports.toString()}');
  } catch (e) {
    print('Error searching airports: $e');
  }

  // Calculate jetlag schedule
  try {
    final schedule = await api.calculateJetlag(
      departure: '2025-01-15T15:55:00.000Z',
      arrival: '2025-01-16T02:35:00.000Z',
      originTimezone: '+08:00',
      destinationTimezone: '-08:00',
    );
    print('Jetlag schedule: ${schedule.toString()}');
  } catch (e) {
    print('Error calculating jetlag: $e');
  }
}
```

## Environment Variables

Required environment variables for deployment:

```env
PORT=3000
NODE_ENV=production
FIREBASE_PROJECT_ID=tripbase-13c00
FIREBASE_STORAGE_BUCKET=tripbase-13c00.firebasestorage.app
FIREBASE_EMULATOR=false
AMADEUS_API_KEY=your_api_key
AMADEUS_API_SECRET=your_api_secret
```

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in the values
4. Run development server: `npm run dev`

## Deployment

The API is deployed on Railway. To deploy your own instance:

1. Fork this repository
2. Create a new project on Railway
3. Connect your GitHub repository
4. Add the required environment variables
5. Deploy! 