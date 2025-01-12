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

## Flutter Models

Here are some helpful model classes for your Flutter app:

```dart
// models/flight.dart
class Flight {
  final String id;
  final String carrier;
  final String flightNumber;
  final Airport origin;
  final Airport destination;
  final DateTime departureTime;
  final DateTime arrivalTime;
  final int duration;
  final String equipment;
  final Partnership? partnership;

  Flight({
    required this.id,
    required this.carrier,
    required this.flightNumber,
    required this.origin,
    required this.destination,
    required this.departureTime,
    required this.arrivalTime,
    required this.duration,
    required this.equipment,
    this.partnership,
  });

  factory Flight.fromJson(Map<String, dynamic> json) {
    return Flight(
      id: json['id'],
      carrier: json['carrier'],
      flightNumber: json['flightNumber'],
      origin: Airport.fromJson(json['origin']),
      destination: Airport.fromJson(json['destination']),
      departureTime: DateTime.parse(json['departureTime']),
      arrivalTime: DateTime.parse(json['arrivalTime']),
      duration: json['duration'],
      equipment: json['equipment'],
      partnership: json['partnership'] != null 
        ? Partnership.fromJson(json['partnership']) 
        : null,
    );
  }
}

// models/airport.dart
class Airport {
  final String code;
  final String name;
  final String city;
  final String country;
  final String timezone;
  final Coordinates coordinates;

  Airport({
    required this.code,
    required this.name,
    required this.city,
    required this.country,
    required this.timezone,
    required this.coordinates,
  });

  factory Airport.fromJson(Map<String, dynamic> json) {
    return Airport(
      code: json['code'],
      name: json['name'] ?? '',
      city: json['city'] ?? '',
      country: json['country'] ?? '',
      timezone: json['timezone'],
      coordinates: Coordinates.fromJson(json['coordinates'] ?? {'latitude': 0, 'longitude': 0}),
    );
  }
}

// models/coordinates.dart
class Coordinates {
  final double latitude;
  final double longitude;

  Coordinates({
    required this.latitude,
    required this.longitude,
  });

  factory Coordinates.fromJson(Map<String, dynamic> json) {
    return Coordinates(
      latitude: json['latitude'].toDouble(),
      longitude: json['longitude'].toDouble(),
    );
  }
}

// models/partnership.dart
class Partnership {
  final String operatingCarrier;
  final String operatingFlightNumber;

  Partnership({
    required this.operatingCarrier,
    required this.operatingFlightNumber,
  });

  factory Partnership.fromJson(Map<String, dynamic> json) {
    return Partnership(
      operatingCarrier: json['operatingCarrier'],
      operatingFlightNumber: json['operatingFlightNumber'],
    );
  }
}

// models/jetlag_schedule.dart
class JetlagSchedule {
  final Flight flight;
  final String phase;
  final JetlagSeverity severity;
  final List<Activity> schedule;
  final List<String> recommendations;

  JetlagSchedule({
    required this.flight,
    required this.phase,
    required this.severity,
    required this.schedule,
    required this.recommendations,
  });

  factory JetlagSchedule.fromJson(Map<String, dynamic> json) {
    return JetlagSchedule(
      flight: Flight.fromJson(json['flight']),
      phase: json['phase'],
      severity: JetlagSeverity.fromJson(json['severity']),
      schedule: (json['schedule'] as List)
          .map((e) => Activity.fromJson(e))
          .toList(),
      recommendations: List<String>.from(json['recommendations']),
    );
  }
}

## Common Use Cases

### 1. Search and Display Flight Details

```dart
class FlightSearchScreen extends StatefulWidget {
  @override
  _FlightSearchScreenState createState() => _FlightSearchScreenState();
}

class _FlightSearchScreenState extends State<FlightSearchScreen> {
  final api = JetlagApiClient();
  Flight? flight;
  String? error;

  Future<void> searchFlight(String carrier, String number, String date) async {
    try {
      setState(() => error = null);
      final response = await api.searchFlight(carrier, number, date);
      final flights = (response as List)
          .map((e) => Flight.fromJson(e))
          .toList();
      
      if (flights.isNotEmpty) {
        setState(() => flight = flights.first);
      }
    } catch (e) {
      setState(() => error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    // Build your UI here
  }
}
```

### 2. Calculate and Display Jetlag Schedule

```dart
class JetlagScheduleScreen extends StatefulWidget {
  final Flight flight;
  
  JetlagScheduleScreen({required this.flight});
  
  @override
  _JetlagScheduleScreenState createState() => _JetlagScheduleScreenState();
}

class _JetlagScheduleScreenState extends State<JetlagScheduleScreen> {
  final api = JetlagApiClient();
  JetlagSchedule? schedule;
  String? error;

  @override
  void initState() {
    super.initState();
    calculateSchedule();
  }

  Future<void> calculateSchedule() async {
    try {
      setState(() => error = null);
      final response = await api.calculateJetlag(
        departure: widget.flight.departureTime.toIso8601String(),
        arrival: widget.flight.arrivalTime.toIso8601String(),
        originTimezone: widget.flight.origin.timezone,
        destinationTimezone: widget.flight.destination.timezone,
      );
      setState(() => schedule = JetlagSchedule.fromJson(response));
    } catch (e) {
      setState(() => error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    // Build your UI here
  }
}
```

## Error Handling

The API returns standard HTTP status codes:

- 200: Success
- 400: Bad Request (invalid parameters)
- 401: Unauthorized (invalid API credentials)
- 404: Not Found
- 500: Internal Server Error

Example error response:
```json
{
  "error": "Something went wrong!",
  "message": "Flight search failed: The targeted resource doesn't exist",
  "type": "Error"
}
```

Handle errors in your Flutter app:

```dart
try {
  final result = await api.searchFlight('XX', '999', '2025-01-15');
  // Handle success
} catch (e) {
  if (e is Exception) {
    // Handle specific error types
    showErrorDialog(context, e.toString());
  }
}
```

## Rate Limits

- Flight Search: 100 requests per minute
- Airport Search: 200 requests per minute
- Jetlag Calculation: 300 requests per minute

## Best Practices

1. Cache responses when possible to reduce API calls
2. Implement retry logic for failed requests
3. Use proper error handling
4. Format dates in ISO 8601 format
5. Handle timezone conversions properly
6. Validate input before making API calls

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