import { openWeatherClient } from '../config/openweather';
import { LightConditions, WeatherData } from '../types/weather';
import { formatISO } from 'date-fns';

export class WeatherService {
  async getLocationWeather(latitude: number, longitude: number): Promise<LightConditions> {
    try {
      const response = await openWeatherClient.get('/onecall', {
        params: {
          lat: latitude,
          lon: longitude,
          exclude: 'minutely,hourly,alerts'
        }
      });

      const data = response.data;
      const current = data.current;
      
      // Convert Unix timestamps to ISO string time
      const sunriseTime = formatISO(current.sunrise * 1000);
      const sunsetTime = formatISO(current.sunset * 1000);
      
      // Calculate day length in hours
      const dayLength = (current.sunset - current.sunrise) / 3600;

      return {
        latitude,
        longitude,
        sunriseTime,
        sunsetTime,
        dayLength,
        cloudCover: current.clouds,
        temperature: current.temp,
        conditions: current.weather[0].main,
        uvIndex: current.uvi
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }

  async getAirportWeather(iataCode: string, coordinates: { latitude: number; longitude: number }): Promise<WeatherData> {
    try {
      const response = await openWeatherClient.get('/onecall', {
        params: {
          lat: coordinates.latitude,
          lon: coordinates.longitude,
          exclude: 'minutely,hourly,alerts'
        }
      });

      const data = response.data;
      const current = data.current;

      return {
        sunriseTime: formatISO(current.sunrise * 1000),
        sunsetTime: formatISO(current.sunset * 1000),
        cloudCover: current.clouds,
        temperature: current.temp,
        conditions: current.weather[0].main,
        dayLength: (current.sunset - current.sunrise) / 3600
      };
    } catch (error) {
      console.error('Error fetching airport weather:', error);
      throw error;
    }
  }
} 