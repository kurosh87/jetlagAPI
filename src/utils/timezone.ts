import { IANAZone } from 'luxon';

export interface TimezoneFormat {
  utcOffset: string;
  ianaName: string;
  displayName: string;
}

// Common timezone mappings for major airports
export const COMMON_TIMEZONE_MAPPINGS: Record<string, TimezoneFormat> = {
  'SFO': { utcOffset: '-08:00', ianaName: 'America/Los_Angeles', displayName: 'Pacific Time' },
  'LHR': { utcOffset: '+00:00', ianaName: 'Europe/London', displayName: 'British Time' },
  'JFK': { utcOffset: '-05:00', ianaName: 'America/New_York', displayName: 'Eastern Time' },
  'NRT': { utcOffset: '+09:00', ianaName: 'Asia/Tokyo', displayName: 'Japan Time' },
  'DXB': { utcOffset: '+04:00', ianaName: 'Asia/Dubai', displayName: 'Gulf Time' },
  'SYD': { utcOffset: '+11:00', ianaName: 'Australia/Sydney', displayName: 'Australian Eastern Time' },
  'TPE': { utcOffset: '+08:00', ianaName: 'Asia/Taipei', displayName: 'Taipei Time' },
  'YVR': { utcOffset: '-08:00', ianaName: 'America/Vancouver', displayName: 'Pacific Time' },
  'YYZ': { utcOffset: '-05:00', ianaName: 'America/Toronto', displayName: 'Eastern Time' },
  'GRU': { utcOffset: '-03:00', ianaName: 'America/Sao_Paulo', displayName: 'Brasilia Time' },
  'EZE': { utcOffset: '-03:00', ianaName: 'America/Argentina/Buenos_Aires', displayName: 'Argentina Time' }
};

/**
 * Validates a UTC offset string
 */
export function validateUtcOffset(offset: string): boolean {
  const utcOffsetRegex = /^[+-]([01]\d|2[0-3]):[0-5]\d$/;
  if (!utcOffsetRegex.test(offset)) {
    return false;
  }

  const [hours, minutes] = offset.substring(1).split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

/**
 * Converts an IANA timezone name to UTC offset
 */
export function convertIanaToUtc(ianaName: string): string {
  try {
    const zone = new IANAZone(ianaName);
    const offset = zone.formatOffset(Date.now(), 'short');
    return offset;
  } catch (error) {
    throw new Error(`Invalid IANA timezone: ${ianaName}`);
  }
}

/**
 * Gets timezone information for an airport
 */
export function getAirportTimezone(airportCode: string): TimezoneFormat {
  const timezone = COMMON_TIMEZONE_MAPPINGS[airportCode];
  if (!timezone) {
    throw new Error(`Unknown airport code: ${airportCode}`);
  }
  return timezone;
}

/**
 * Calculates timezone difference in hours between two UTC offsets
 */
export function calculateTimezoneDifference(originOffset: string, destinationOffset: string): number {
  const originHours = parseInt(originOffset.substring(1, 3)) * (originOffset[0] === '-' ? -1 : 1);
  const destHours = parseInt(destinationOffset.substring(1, 3)) * (destinationOffset[0] === '-' ? -1 : 1);
  
  let difference = destHours - originHours;
  
  // Handle international date line crossing
  if (Math.abs(difference) > 12) {
    difference = difference > 0 ? difference - 24 : difference + 24;
  }
  
  return difference;
}

/**
 * Normalizes a timezone input to TimezoneFormat
 */
export function normalizeTimezone(input: string | TimezoneFormat): TimezoneFormat {
  if (typeof input === 'string') {
    // If it's a UTC offset
    if (validateUtcOffset(input)) {
      return {
        utcOffset: input,
        ianaName: 'Etc/GMT' + (input.startsWith('-') ? input.substring(1) : input),
        displayName: `UTC${input}`
      };
    }
    
    // If it's an IANA name
    try {
      const zone = new IANAZone(input);
      const offset = zone.formatOffset(Date.now(), 'short');
      return {
        utcOffset: offset,
        ianaName: input,
        displayName: zone.name
      };
    } catch {
      throw new Error(`Invalid timezone format: ${input}`);
    }
  }
  
  return input;
}

/**
 * Converts a local time from one timezone to another
 */
export function convertTime(time: string, fromTimezone: TimezoneFormat, toTimezone: TimezoneFormat): string {
  const fromOffset = parseInt(fromTimezone.utcOffset.replace(':', ''));
  const toOffset = parseInt(toTimezone.utcOffset.replace(':', ''));
  
  const date = new Date(time);
  const utc = date.getTime() + (fromOffset * 3600000);
  const newTime = new Date(utc + (toOffset * 3600000));
  
  return newTime.toISOString();
} 