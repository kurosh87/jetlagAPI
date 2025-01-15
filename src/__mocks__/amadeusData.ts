export const mockFlightData = {
  'BR10': {
    data: [{
      segments: [{
        carrierCode: 'BR',
        number: '10',
        departure: {
          iataCode: 'TPE',
          scheduledTime: '2025-01-17T23:50:00+08:00'
        },
        arrival: {
          iataCode: 'YVR',
          scheduledTime: '2025-01-17T18:35:00-08:00'
        },
        aircraftEquipment: {
          aircraftType: '789'
        }
      }]
    }]
  },
  'BA286': {
    data: [{
      segments: [{
        carrierCode: 'BA',
        number: '286',
        departure: {
          iataCode: 'SFO',
          scheduledTime: '2025-01-17T16:05:00-08:00'
        },
        arrival: {
          iataCode: 'LHR',
          scheduledTime: '2025-01-18T10:25:00+00:00'
        },
        aircraftEquipment: {
          aircraftType: '789'
        }
      }]
    }]
  },
  'JL7': {
    data: [{
      segments: [{
        carrierCode: 'JL',
        number: '7',
        departure: {
          iataCode: 'JFK',
          scheduledTime: '2025-01-17T13:15:00-05:00'
        },
        arrival: {
          iataCode: 'NRT',
          scheduledTime: '2025-01-18T17:15:00+09:00'
        },
        aircraftEquipment: {
          aircraftType: '789'
        }
      }]
    }]
  },
  'QF8': {
    data: [{
      segments: [{
        carrierCode: 'QF',
        number: '8',
        departure: {
          iataCode: 'DXB',
          scheduledTime: '2025-01-17T21:55:00+04:00'
        },
        arrival: {
          iataCode: 'SYD',
          scheduledTime: '2025-01-18T18:50:00+11:00'
        },
        aircraftEquipment: {
          aircraftType: '789'
        }
      }]
    }]
  },
  'AC90': {
    data: [{
      segments: [{
        carrierCode: 'AC',
        number: '90',
        departure: {
          iataCode: 'YYZ',
          scheduledTime: '2025-01-17T22:50:00-05:00'
        },
        arrival: {
          iataCode: 'GRU',
          scheduledTime: '2025-01-18T10:50:00-03:00'
        },
        aircraftEquipment: {
          aircraftType: '789'
        }
      }, {
        carrierCode: 'AC',
        number: '90',
        departure: {
          iataCode: 'GRU',
          scheduledTime: '2025-01-18T12:30:00-03:00'
        },
        arrival: {
          iataCode: 'EZE',
          scheduledTime: '2025-01-18T15:25:00-03:00'
        },
        aircraftEquipment: {
          aircraftType: '789'
        }
      }]
    }]
  }
}; 