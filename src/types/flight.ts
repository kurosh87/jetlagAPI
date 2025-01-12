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
  airport: {
    code: string;
    name: string;
    city: string;
    country: string;
    timezone: string;
    coordinates: {
      latitude: number;
      longitude: number;
    }
  };
  arrival: string | Date;
  departure: string | Date;
  duration: number;
}

export interface Flight {
  id: string;
  carrier: string;
  flightNumber: string;
  origin: {
    code: string;
    name: string;
    city: string;
    country: string;
    timezone: string;
    coordinates: {
      latitude: number;
      longitude: number;
    }
  };
  destination: {
    code: string;
    name: string;
    city: string;
    country: string;
    timezone: string;
    coordinates: {
      latitude: number;
      longitude: number;
    }
  };
  departureTime: string | Date;
  arrivalTime: string | Date;
  duration: number;
  equipment: string;
  partnership?: {
    operatingCarrier: string;
    operatingFlightNumber: string;
  };
  isSegment: boolean;
  segmentIndex: number;
  totalSegments: number;
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