import axios from 'axios';

const OPENWEATHER_API_KEY = 'e63e892adc5187ece40b5f5e775c2347';
const BASE_URL = 'https://api.openweathermap.org/data/3.0';

export const openWeatherClient = axios.create({
  baseURL: BASE_URL,
  params: {
    appid: OPENWEATHER_API_KEY,
    units: 'metric'
  }
});

export interface WeatherData {
  dt: number;              // Time of data forecasted, unix UTC
  sunrise: number;         // Sunrise time, unix UTC
  sunset: number;          // Sunset time, unix UTC
  temp: number;           // Temperature in Celsius
  clouds: number;         // Cloudiness percentage
  uvi: number;           // UV index
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
}

export interface LocationWeather {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current: WeatherData;
  daily: WeatherData[];
} 