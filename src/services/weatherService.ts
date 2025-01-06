import { LightConditions } from '../types/circadian';

export class WeatherService {
  async getLocationWeather(latitude: number, longitude: number): Promise<LightConditions> {
    // This would normally call an external weather API
    // For now, return mock data
    return {
      latitude,
      longitude,
      sunriseTime: '06:00',
      sunsetTime: '18:00',
      dayLength: 12
    };
  }
} 