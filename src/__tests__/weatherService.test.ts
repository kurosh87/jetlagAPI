import { WeatherService } from '../services/weatherService';

describe('WeatherService', () => {
  let weatherService: WeatherService;

  beforeEach(() => {
    weatherService = new WeatherService();
  });

  describe('getLocationWeather', () => {
    it('should return light conditions for given coordinates', async () => {
      const latitude = 37.7749;
      const longitude = -122.4194;

      const result = await weatherService.getLocationWeather(latitude, longitude);

      expect(result).toEqual({
        latitude: latitude,
        longitude: longitude,
        sunriseTime: '06:00',
        sunsetTime: '18:00',
        dayLength: 12
      });
    });

    it('should maintain consistent day length', async () => {
      const result = await weatherService.getLocationWeather(0, 0);
      expect(result.dayLength).toBe(12);
    });

    it('should return valid time formats', async () => {
      const result = await weatherService.getLocationWeather(0, 0);
      expect(result.sunriseTime).toMatch(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/);
      expect(result.sunsetTime).toMatch(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/);
    });
  });
}); 