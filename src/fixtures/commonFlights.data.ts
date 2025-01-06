import { Flight } from '../../types';

// San Francisco (SFO) to Tokyo (NRT)
export const sfoToNrt: Flight = {
  carrier: 'United Airlines',
  flightNumber: 'UA837',
  origin: {
    code: 'SFO',
    name: 'San Francisco International Airport',
    city: 'San Francisco',
    country: 'United States',
    location: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    timezone: {
      name: 'America/Los_Angeles',
      offset: -8
    }
  },
  destination: {
    code: 'NRT',
    name: 'Narita International Airport',
    city: 'Tokyo',
    country: 'Japan',
    location: {
      latitude: 35.7720,
      longitude: 140.3929
    },
    timezone: {
      name: 'Asia/Tokyo',
      offset: 9
    }
  },
  departure: new Date('2024-02-01T11:05:00-08:00'),
  arrival: new Date('2024-02-02T15:35:00+09:00'),
  duration: 39000 // 10 hours 50 minutes
};

// London (LHR) to Dubai (DXB)
export const lhrToDxb: Flight = {
  carrier: 'Emirates',
  flightNumber: 'EK2',
  origin: {
    code: 'LHR',
    name: 'London Heathrow Airport',
    city: 'London',
    country: 'United Kingdom',
    location: {
      latitude: 51.4700,
      longitude: -0.4543
    },
    timezone: {
      name: 'Europe/London',
      offset: 0
    }
  },
  destination: {
    code: 'DXB',
    name: 'Dubai International Airport',
    city: 'Dubai',
    country: 'United Arab Emirates',
    location: {
      latitude: 25.2532,
      longitude: 55.3657
    },
    timezone: {
      name: 'Asia/Dubai',
      offset: 4
    }
  },
  departure: new Date('2024-02-01T22:30:00+00:00'),
  arrival: new Date('2024-02-02T09:20:00+04:00'),
  duration: 24600 // 6 hours 50 minutes
};

// New York (JFK) to Paris (CDG)
export const jfkToCdg: Flight = {
  carrier: 'Air France',
  flightNumber: 'AF23',
  origin: {
    code: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    country: 'United States',
    location: {
      latitude: 40.6413,
      longitude: -73.7781
    },
    timezone: {
      name: 'America/New_York',
      offset: -5
    }
  },
  destination: {
    code: 'CDG',
    name: 'Charles de Gaulle Airport',
    city: 'Paris',
    country: 'France',
    location: {
      latitude: 49.0097,
      longitude: 2.5479
    },
    timezone: {
      name: 'Europe/Paris',
      offset: 1
    }
  },
  departure: new Date('2024-02-01T19:30:00-05:00'),
  arrival: new Date('2024-02-02T08:45:00+01:00'),
  duration: 26100 // 7 hours 15 minutes
};

// Singapore (SIN) to Sydney (SYD)
export const sinToSyd: Flight = {
  carrier: 'Singapore Airlines',
  flightNumber: 'SQ231',
  origin: {
    code: 'SIN',
    name: 'Singapore Changi Airport',
    city: 'Singapore',
    country: 'Singapore',
    location: {
      latitude: 1.3644,
      longitude: 103.9915
    },
    timezone: {
      name: 'Asia/Singapore',
      offset: 8
    }
  },
  destination: {
    code: 'SYD',
    name: 'Sydney Airport',
    city: 'Sydney',
    country: 'Australia',
    location: {
      latitude: -33.9399,
      longitude: 151.1753
    },
    timezone: {
      name: 'Australia/Sydney',
      offset: 11
    }
  },
  departure: new Date('2024-02-01T20:10:00+08:00'),
  arrival: new Date('2024-02-02T07:20:00+11:00'),
  duration: 28200 // 7 hours 50 minutes
};

// Los Angeles (LAX) to London (LHR) with layover
export const laxToLhrWithLayover: Flight = {
  carrier: 'American Airlines',
  flightNumber: 'AA136',
  origin: {
    code: 'LAX',
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    country: 'United States',
    location: {
      latitude: 33.9416,
      longitude: -118.4085
    },
    timezone: {
      name: 'America/Los_Angeles',
      offset: -8
    }
  },
  destination: {
    code: 'LHR',
    name: 'London Heathrow Airport',
    city: 'London',
    country: 'United Kingdom',
    location: {
      latitude: 51.4700,
      longitude: -0.4543
    },
    timezone: {
      name: 'Europe/London',
      offset: 0
    }
  },
  departure: new Date('2024-02-01T15:55:00-08:00'),
  arrival: new Date('2024-02-02T18:30:00+00:00'),
  duration: 51600, // 14 hours 20 minutes
  layovers: [
    {
      airport: {
        code: 'JFK',
        name: 'John F. Kennedy International Airport',
        city: 'New York',
        country: 'United States',
        location: {
          latitude: 40.6413,
          longitude: -73.7781
        },
        timezone: {
          name: 'America/New_York',
          offset: -5
        }
      },
      duration: 7200, // 2 hours
      arrival: new Date('2024-02-01T23:55:00-05:00'),
      departure: new Date('2024-02-02T01:55:00-05:00')
    }
  ]
};

// Cape Town (CPT) to London (LHR)
export const cptToLhr: Flight = {
  carrier: 'British Airways',
  flightNumber: 'BA058',
  origin: {
    code: 'CPT',
    name: 'Cape Town International Airport',
    city: 'Cape Town',
    country: 'South Africa',
    location: {
      latitude: -33.9715,
      longitude: 18.6021
    },
    timezone: {
      name: 'Africa/Johannesburg',
      offset: 2
    }
  },
  destination: {
    code: 'LHR',
    name: 'London Heathrow Airport',
    city: 'London',
    country: 'United Kingdom',
    location: {
      latitude: 51.4700,
      longitude: -0.4543
    },
    timezone: {
      name: 'Europe/London',
      offset: 0
    }
  },
  departure: new Date('2024-02-01T18:45:00+02:00'),
  arrival: new Date('2024-02-02T05:30:00+00:00'),
  duration: 41400 // 11 hours 30 minutes
};

// New York (JFK) to São Paulo (GRU)
export const jfkToGru: Flight = {
  carrier: 'LATAM Airlines',
  flightNumber: 'LA8181',
  origin: {
    code: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    country: 'United States',
    location: {
      latitude: 40.6413,
      longitude: -73.7781
    },
    timezone: {
      name: 'America/New_York',
      offset: -5
    }
  },
  destination: {
    code: 'GRU',
    name: 'São Paulo/Guarulhos International Airport',
    city: 'São Paulo',
    country: 'Brazil',
    location: {
      latitude: -23.4356,
      longitude: -46.4731
    },
    timezone: {
      name: 'America/Sao_Paulo',
      offset: -3
    }
  },
  departure: new Date('2024-02-01T21:45:00-05:00'),
  arrival: new Date('2024-02-02T10:30:00-03:00'),
  duration: 35100 // 9 hours 45 minutes
};

// Buenos Aires (EZE) to Ushuaia (USH)
export const ezeToUsh: Flight = {
  carrier: 'Aerolíneas Argentinas',
  flightNumber: 'AR1880',
  origin: {
    code: 'EZE',
    name: 'Ministro Pistarini International Airport',
    city: 'Buenos Aires',
    country: 'Argentina',
    location: {
      latitude: -34.8222,
      longitude: -58.5358
    },
    timezone: {
      name: 'America/Argentina/Buenos_Aires',
      offset: -3
    }
  },
  destination: {
    code: 'USH',
    name: 'Ushuaia International Airport',
    city: 'Ushuaia',
    country: 'Argentina',
    location: {
      latitude: -54.8430,
      longitude: -68.2956
    },
    timezone: {
      name: 'America/Argentina/Ushuaia',
      offset: -3
    }
  },
  departure: new Date('2024-02-01T09:30:00-03:00'),
  arrival: new Date('2024-02-01T13:00:00-03:00'),
  duration: 12600 // 3 hours 30 minutes
};

// Oslo (OSL) to Cape Town (CPT) with layover
export const oslToCpt: Flight = {
  carrier: 'Ethiopian Airlines',
  flightNumber: 'ET715',
  origin: {
    code: 'OSL',
    name: 'Oslo Airport, Gardermoen',
    city: 'Oslo',
    country: 'Norway',
    location: {
      latitude: 60.1975,
      longitude: 11.1004
    },
    timezone: {
      name: 'Europe/Oslo',
      offset: 1
    }
  },
  destination: {
    code: 'CPT',
    name: 'Cape Town International Airport',
    city: 'Cape Town',
    country: 'South Africa',
    location: {
      latitude: -33.9715,
      longitude: 18.6021
    },
    timezone: {
      name: 'Africa/Johannesburg',
      offset: 2
    }
  },
  departure: new Date('2024-02-01T12:20:00+01:00'),
  arrival: new Date('2024-02-02T04:45:00+02:00'),
  duration: 59100, // 16 hours 25 minutes
  layovers: [
    {
      airport: {
        code: 'ADD',
        name: 'Addis Ababa Bole International Airport',
        city: 'Addis Ababa',
        country: 'Ethiopia',
        location: {
          latitude: 8.9778,
          longitude: 38.7989
        },
        timezone: {
          name: 'Africa/Addis_Ababa',
          offset: 3
        }
      },
      duration: 7200, // 2 hours
      arrival: new Date('2024-02-01T21:30:00+03:00'),
      departure: new Date('2024-02-01T23:30:00+03:00')
    }
  ]
};

// Reykjavik (KEF) to Buenos Aires (EZE) with layover
export const kefToEze: Flight = {
  carrier: 'Icelandair',
  flightNumber: 'FI991',
  origin: {
    code: 'KEF',
    name: 'Keflavík International Airport',
    city: 'Reykjavik',
    country: 'Iceland',
    location: {
      latitude: 63.9850,
      longitude: -22.6056
    },
    timezone: {
      name: 'Atlantic/Reykjavik',
      offset: 0
    }
  },
  destination: {
    code: 'EZE',
    name: 'Ministro Pistarini International Airport',
    city: 'Buenos Aires',
    country: 'Argentina',
    location: {
      latitude: -34.8222,
      longitude: -58.5358
    },
    timezone: {
      name: 'America/Argentina/Buenos_Aires',
      offset: -3
    }
  },
  departure: new Date('2024-02-01T15:40:00+00:00'),
  arrival: new Date('2024-02-02T08:30:00-03:00'),
  duration: 60600, // 16 hours 50 minutes
  layovers: [
    {
      airport: {
        code: 'MAD',
        name: 'Adolfo Suárez Madrid–Barajas Airport',
        city: 'Madrid',
        country: 'Spain',
        location: {
          latitude: 40.4983,
          longitude: -3.5676
        },
        timezone: {
          name: 'Europe/Madrid',
          offset: 1
        }
      },
      duration: 7200, // 2 hours
      arrival: new Date('2024-02-01T21:20:00+01:00'),
      departure: new Date('2024-02-01T23:20:00+01:00')
    }
  ]
};

// Short-haul flights for minimal effect testing

// London (LHR) to Paris (CDG)
export const lhrToCdg: Flight = {
  carrier: 'British Airways',
  flightNumber: 'BA306',
  origin: {
    code: 'LHR',
    name: 'London Heathrow Airport',
    city: 'London',
    country: 'United Kingdom',
    location: {
      latitude: 51.4700,
      longitude: -0.4543
    },
    timezone: {
      name: 'Europe/London',
      offset: 0
    }
  },
  destination: {
    code: 'CDG',
    name: 'Charles de Gaulle Airport',
    city: 'Paris',
    country: 'France',
    location: {
      latitude: 49.0097,
      longitude: 2.5479
    },
    timezone: {
      name: 'Europe/Paris',
      offset: 1
    }
  },
  departure: new Date('2024-02-01T08:30:00+00:00'),
  arrival: new Date('2024-02-01T10:45:00+01:00'),
  duration: 4500 // 1 hour 15 minutes
};

// San Francisco (SFO) to Los Angeles (LAX)
export const sfoToLax: Flight = {
  carrier: 'United Airlines',
  flightNumber: 'UA1234',
  origin: {
    code: 'SFO',
    name: 'San Francisco International Airport',
    city: 'San Francisco',
    country: 'United States',
    location: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    timezone: {
      name: 'America/Los_Angeles',
      offset: -8
    }
  },
  destination: {
    code: 'LAX',
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    country: 'United States',
    location: {
      latitude: 33.9416,
      longitude: -118.4085
    },
    timezone: {
      name: 'America/Los_Angeles',
      offset: -8
    }
  },
  departure: new Date('2024-02-01T10:00:00-08:00'),
  arrival: new Date('2024-02-01T11:25:00-08:00'),
  duration: 5100 // 1 hour 25 minutes
};

// Tokyo (HND) to Osaka (ITM)
export const hndToItm: Flight = {
  carrier: 'All Nippon Airways',
  flightNumber: 'NH22',
  origin: {
    code: 'HND',
    name: 'Tokyo Haneda Airport',
    city: 'Tokyo',
    country: 'Japan',
    location: {
      latitude: 35.5494,
      longitude: 139.7798
    },
    timezone: {
      name: 'Asia/Tokyo',
      offset: 9
    }
  },
  destination: {
    code: 'ITM',
    name: 'Osaka International Airport',
    city: 'Osaka',
    country: 'Japan',
    location: {
      latitude: 34.7854,
      longitude: 135.4385
    },
    timezone: {
      name: 'Asia/Tokyo',
      offset: 9
    }
  },
  departure: new Date('2024-02-01T09:00:00+09:00'),
  arrival: new Date('2024-02-01T10:05:00+09:00'),
  duration: 3900 // 1 hour 5 minutes
};

// Dubai (DXB) to Muscat (MCT)
export const dxbToMct: Flight = {
  carrier: 'Emirates',
  flightNumber: 'EK866',
  origin: {
    code: 'DXB',
    name: 'Dubai International Airport',
    city: 'Dubai',
    country: 'United Arab Emirates',
    location: {
      latitude: 25.2532,
      longitude: 55.3657
    },
    timezone: {
      name: 'Asia/Dubai',
      offset: 4
    }
  },
  destination: {
    code: 'MCT',
    name: 'Muscat International Airport',
    city: 'Muscat',
    country: 'Oman',
    location: {
      latitude: 23.5931,
      longitude: 58.2844
    },
    timezone: {
      name: 'Asia/Muscat',
      offset: 4
    }
  },
  departure: new Date('2024-02-01T14:30:00+04:00'),
  arrival: new Date('2024-02-01T15:45:00+04:00'),
  duration: 4500 // 1 hour 15 minutes
};

// Sydney (SYD) to Melbourne (MEL)
export const sydToMel: Flight = {
  carrier: 'Qantas',
  flightNumber: 'QF487',
  origin: {
    code: 'SYD',
    name: 'Sydney Airport',
    city: 'Sydney',
    country: 'Australia',
    location: {
      latitude: -33.9399,
      longitude: 151.1753
    },
    timezone: {
      name: 'Australia/Sydney',
      offset: 11
    }
  },
  destination: {
    code: 'MEL',
    name: 'Melbourne Airport',
    city: 'Melbourne',
    country: 'Australia',
    location: {
      latitude: -37.6690,
      longitude: 144.8410
    },
    timezone: {
      name: 'Australia/Melbourne',
      offset: 11
    }
  },
  departure: new Date('2024-02-01T07:00:00+11:00'),
  arrival: new Date('2024-02-01T08:25:00+11:00'),
  duration: 5100 // 1 hour 25 minutes
}; 