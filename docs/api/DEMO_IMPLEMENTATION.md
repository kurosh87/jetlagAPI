# EVA Air BR10 Demo Implementation Guide

## Overview
This guide demonstrates how to implement the EVA Air BR10 flight demo using the Jetlag API endpoints. The example shows a complete flow from flight search to jetlag mitigation recommendations.

## API Base URL
```
https://jetlag-pkquid6hn-intrepid-app.vercel.app
```

## Demo Endpoint
### Test Flight Data
```http
GET /api/test/flight
```

This endpoint returns sample data for EVA Air BR10 (TPE to LAX) including flight details and jetlag recommendations.

#### Response Format
```json
{
  "flight": {
    "carrier": "EVA",
    "flightNumber": "BR10",
    "route": {
      "departure": {
        "airport": "TPE",
        "city": "Taipei",
        "timezone": "Asia/Taipei",
        "coordinates": {
          "latitude": 25.0777,
          "longitude": 121.2322
        },
        "datetime": "2024-01-10T20:45:00+08:00"
      },
      "arrival": {
        "airport": "LAX",
        "city": "Los Angeles",
        "timezone": "America/Los_Angeles",
        "coordinates": {
          "latitude": 33.9416,
          "longitude": -118.4085
        },
        "datetime": "2024-01-10T16:45:00-08:00"
      },
      "duration": "12:00",
      "timezoneOffset": -16
    }
  },
  "jetlagMitigation": {
    "beforeFlight": [
      {
        "day": -2,
        "activities": [
          {
            "time": "22:00",
            "action": "Go to bed 1 hour earlier than usual"
          },
          {
            "time": "07:00",
            "action": "Wake up 1 hour earlier than usual"
          }
        ]
      },
      {
        "day": -1,
        "activities": [
          {
            "time": "21:00",
            "action": "Go to bed 2 hours earlier than usual"
          },
          {
            "time": "06:00",
            "action": "Wake up 2 hours earlier than usual"
          },
          {
            "time": "15:00",
            "action": "Avoid caffeine from this point"
          }
        ]
      }
    ],
    "duringFlight": [
      {
        "time": "First 6 hours",
        "action": "Stay awake, keep cabin lights on"
      },
      {
        "time": "After 6 hours",
        "action": "Try to sleep, adjust to LA time"
      },
      {
        "time": "2 hours before landing",
        "action": "Wake up, exposure to bright light"
      }
    ],
    "afterArrival": [
      {
        "day": 1,
        "activities": [
          {
            "time": "07:00",
            "action": "Get morning sunlight exposure"
          },
          {
            "time": "12:00",
            "action": "Light lunch"
          },
          {
            "time": "22:00",
            "action": "Sleep at destination time"
          }
        ]
      },
      {
        "day": 2,
        "activities": [
          {
            "time": "07:00",
            "action": "Morning walk outside"
          },
          {
            "time": "15:00",
            "action": "Light exercise"
          },
          {
            "time": "22:00",
            "action": "Normal sleep schedule"
          }
        ]
      }
    ]
  },
  "_meta": {
    "generated": "2025-01-10T00:51:53.897Z",
    "flightType": "westward",
    "timezoneChange": "-16 hours",
    "recoveryDays": "Approximately 3-4 days"
  }
}
```

## Implementation Examples

### Swift Implementation
```swift
import Foundation

struct JetlagAPI {
    static let baseURL = "https://jetlag-pkquid6hn-intrepid-app.vercel.app"
    
    // Flight data models
    struct FlightRoute: Codable {
        let departure: Airport
        let arrival: Airport
        let duration: String
        let timezoneOffset: Int
    }
    
    struct Airport: Codable {
        let airport: String
        let city: String
        let timezone: String
        let coordinates: Coordinates
        let datetime: String
    }
    
    struct Coordinates: Codable {
        let latitude: Double
        let longitude: Double
    }
    
    // Activity models
    struct Activity: Codable {
        let time: String
        let action: String
    }
    
    struct DayActivities: Codable {
        let day: Int
        let activities: [Activity]
    }
    
    struct JetlagMitigation: Codable {
        let beforeFlight: [DayActivities]
        let duringFlight: [Activity]
        let afterArrival: [DayActivities]
    }
    
    // Response model
    struct FlightResponse: Codable {
        let flight: Flight
        let jetlagMitigation: JetlagMitigation
        let meta: Meta
        
        enum CodingKeys: String, CodingKey {
            case flight
            case jetlagMitigation
            case meta = "_meta"
        }
    }
    
    struct Flight: Codable {
        let carrier: String
        let flightNumber: String
        let route: FlightRoute
    }
    
    struct Meta: Codable {
        let generated: String
        let flightType: String
        let timezoneChange: String
        let recoveryDays: String
    }
    
    // API call function
    static func fetchTestFlight() async throws -> FlightResponse {
        guard let url = URL(string: "\(baseURL)/api/test/flight") else {
            throw URLError(.badURL)
        }
        
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(FlightResponse.self, from: data)
    }
}

// Usage example
func loadFlightData() async {
    do {
        let response = try await JetlagAPI.fetchTestFlight()
        // Handle the response
        print("Flight: \(response.flight.carrier) \(response.flight.flightNumber)")
        print("Departure: \(response.flight.route.departure.city)")
        print("Arrival: \(response.flight.route.arrival.city)")
        
        // Process recommendations
        for day in response.jetlagMitigation.beforeFlight {
            print("Day \(day.day) activities:")
            for activity in day.activities {
                print("- \(activity.time): \(activity.action)")
            }
        }
    } catch {
        print("Error loading flight data: \(error)")
    }
}
```

### Using with SwiftUI
```swift
import SwiftUI

struct FlightDetailView: View {
    @State private var flightData: JetlagAPI.FlightResponse?
    @State private var isLoading = false
    @State private var error: Error?
    
    var body: some View {
        NavigationView {
            Group {
                if isLoading {
                    ProgressView("Loading flight data...")
                } else if let flightData = flightData {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 20) {
                            // Flight Info
                            FlightInfoSection(flight: flightData.flight)
                            
                            // Before Flight
                            RecommendationsSection(
                                title: "Before Flight",
                                days: flightData.jetlagMitigation.beforeFlight
                            )
                            
                            // During Flight
                            DuringFlightSection(
                                activities: flightData.jetlagMitigation.duringFlight
                            )
                            
                            // After Arrival
                            RecommendationsSection(
                                title: "After Arrival",
                                days: flightData.jetlagMitigation.afterArrival
                            )
                            
                            // Meta Info
                            MetaInfoSection(meta: flightData.meta)
                        }
                        .padding()
                    }
                    .navigationTitle("Flight Details")
                } else if let error = error {
                    ErrorView(error: error)
                }
            }
        }
        .onAppear {
            loadData()
        }
    }
    
    private func loadData() {
        isLoading = true
        Task {
            do {
                flightData = try await JetlagAPI.fetchTestFlight()
            } catch {
                self.error = error
            }
            isLoading = false
        }
    }
}

// Supporting Views
struct FlightInfoSection: View {
    let flight: JetlagAPI.Flight
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("\(flight.carrier) \(flight.flightNumber)")
                .font(.title)
            
            HStack {
                VStack(alignment: .leading) {
                    Text(flight.route.departure.city)
                    Text(flight.route.departure.airport)
                        .font(.caption)
                }
                Spacer()
                Image(systemName: "airplane")
                Spacer()
                VStack(alignment: .trailing) {
                    Text(flight.route.arrival.city)
                    Text(flight.route.arrival.airport)
                        .font(.caption)
                }
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(10)
    }
}

struct RecommendationsSection: View {
    let title: String
    let days: [JetlagAPI.DayActivities]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.headline)
            
            ForEach(days, id: \.day) { day in
                VStack(alignment: .leading, spacing: 5) {
                    Text("Day \(day.day)")
                        .font(.subheadline)
                    
                    ForEach(day.activities, id: \.time) { activity in
                        HStack {
                            Text(activity.time)
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(activity.action)
                        }
                    }
                }
                .padding(.vertical, 5)
            }
        }
    }
}

struct DuringFlightSection: View {
    let activities: [JetlagAPI.Activity]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("During Flight")
                .font(.headline)
            
            ForEach(activities, id: \.time) { activity in
                HStack {
                    Text(activity.time)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(activity.action)
                }
            }
        }
    }
}

struct MetaInfoSection: View {
    let meta: JetlagAPI.Meta
    
    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text("Flight Information")
                .font(.headline)
            
            Text("Type: \(meta.flightType)")
            Text("Timezone Change: \(meta.timezoneChange)")
            Text("Recovery: \(meta.recoveryDays)")
            Text("Generated: \(meta.generated)")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

struct ErrorView: View {
    let error: Error
    
    var body: some View {
        VStack {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
                .foregroundColor(.red)
            Text("Error loading data")
                .font(.headline)
            Text(error.localizedDescription)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}
```

## Testing the Implementation

1. Copy the Swift code into your project
2. Make sure you have internet connectivity
3. Call the API:
```swift
// In your view controller or SwiftUI view
Task {
    do {
        let flightData = try await JetlagAPI.fetchTestFlight()
        // Use the flight data
    } catch {
        // Handle errors
    }
}
```

## Notes
- The demo endpoint provides static data for EVA Air BR10
- All times in the response are in the local timezone of the respective location
- The implementation includes error handling and loading states
- The SwiftUI implementation provides a complete UI for displaying the data
- The response includes metadata about the flight type and expected recovery time

## Next Steps
1. Implement the UI using the provided SwiftUI code
2. Add notification scheduling for activities
3. Implement offline caching of the response
4. Add user preferences for notification timing
5. Implement timezone conversion for local display 