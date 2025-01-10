# Jetlag API Documentation

## Overview

The Jetlag API provides endpoints for calculating personalized jet lag adaptation schedules based on flight details, user chronotype, and sleep preferences. Built on Vercel's serverless infrastructure, it offers high availability and automatic scaling.

## Base URL

```
https://jetlag-cxqrhjtmy-intrepid-app.vercel.app/api
```

## Available Endpoints

### Core Endpoints

- `POST /calculate` - Calculate jetlag adaptation schedule
- `GET /chronotype` - Get chronotype assessment questions
- `POST /chronotype` - Create/update user chronotype profile
- `GET /flights/search` - Search for flights
- `GET /airports/search` - Search for airports

For detailed endpoint documentation, see [ENDPOINTS.md](./ENDPOINTS.md).

## Authentication

Currently, the API is open for testing. Authentication will be added in future updates.

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per hour per IP

## Response Format

All responses follow a consistent format:

### Success Response
```json
{
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Common Error Codes

- `400` - Bad Request (invalid input)
- `404` - Not Found
- `405` - Method Not Allowed
- `429` - Too Many Requests
- `500` - Internal Server Error

## Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for implementation examples and common use cases.

## Data Formats

### Times
- All timestamps should be in ISO 8601 format with UTC timezone
- Time strings for bed/wake times should be in 24-hour format (HH:MM)

### Timezones
- Timezone offsets are in hours
- Positive values indicate eastward travel
- Negative values indicate westward travel

### IATA Codes
- Airport codes should be uppercase
- Carrier codes should be uppercase

## Current Status

- ✅ Core calculation endpoints
- ✅ Flight and airport search (mock data)
- ✅ Chronotype assessment
- ⏳ External API integration (in progress)
- ⏳ Authentication (planned)
- ⏳ Caching (planned)

## Resources

- [Quick Start Guide](./QUICKSTART.md)
- [Detailed Endpoints](./ENDPOINTS.md)
- [Common Issues](./TROUBLESHOOTING.md)
- [Integration Examples](./EXAMPLES.md)

## Support

For issues and feature requests, please use the GitHub issue tracker. 