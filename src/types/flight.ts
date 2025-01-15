import { ActivityPriority, LightIntensity } from './circadian';
import { Activity } from './circadian';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Timezone {
  offset: number;
  name: string;
}

export interface Airport {
  code: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timezone: {
    name: string;
    offset: number;
  };
}

export interface Layover {
  airport: Airport;
  departureTime: string;
  arrivalTime: string;
  duration: number;
}

export interface FlightLayover {
  airport: Airport;
  arrivalTime: string;
  departureTime: string;
  duration: number;
}

export interface Flight {
  id: string;
  origin: Airport;
  destination: Airport;
  departureTime: string;
  arrivalTime: string;
  timezoneOffset?: number;
  layovers?: FlightLayover[];
}

export interface AdaptationDay {
  day: number;
  activities: Activity[];
}

export interface ActivitySchedule {
  arrivalDayActivities: Activity[];
  adaptationDays: AdaptationDay[];
  recommendations: string[];
} 