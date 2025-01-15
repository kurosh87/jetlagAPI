import {
  validateUtcOffset,
  convertIanaToUtc,
  getAirportTimezone,
  calculateTimezoneDifference,
  normalizeTimezone,
  convertTime,
  TimezoneFormat
} from '../utils/timezone';

describe('Timezone Utilities', () => {
  describe('validateUtcOffset', () => {
    test('validates correct UTC offsets', () => {
      expect(validateUtcOffset('+00:00')).toBe(true);
      expect(validateUtcOffset('+14:00')).toBe(true);
      expect(validateUtcOffset('-12:00')).toBe(true);
      expect(validateUtcOffset('+05:30')).toBe(true);
    });

    test('rejects invalid UTC offsets', () => {
      expect(validateUtcOffset('00:00')).toBe(false);  // Missing sign
      expect(validateUtcOffset('+15:00')).toBe(false); // Hours too large
      expect(validateUtcOffset('+00:60')).toBe(false); // Minutes too large
      expect(validateUtcOffset('-14:00')).toBe(false); // Invalid negative offset
      expect(validateUtcOffset('invalid')).toBe(false);
    });
  });

  describe('convertIanaToUtc', () => {
    test('converts common IANA timezones to UTC offsets', () => {
      const testDate = new Date('2024-01-01T00:00:00Z'); // Winter time
      expect(convertIanaToUtc('America/New_York', testDate)).toBe('-05:00');
      expect(convertIanaToUtc('Asia/Tokyo', testDate)).toBe('+09:00');
      expect(convertIanaToUtc('Europe/London', testDate)).toBe('+00:00');
    });

    test('handles DST correctly', () => {
      const summerDate = new Date('2024-07-01T00:00:00Z');
      expect(convertIanaToUtc('America/New_York', summerDate)).toBe('-04:00');
      expect(convertIanaToUtc('Europe/London', summerDate)).toBe('+01:00');
    });

    test('throws error for invalid IANA names', () => {
      expect(() => convertIanaToUtc('Invalid/Timezone')).toThrow();
    });
  });

  describe('getAirportTimezone', () => {
    test('returns correct timezone for known airports', () => {
      const jfk = getAirportTimezone('JFK');
      expect(jfk.utcOffset).toBe('-05:00');
      expect(jfk.ianaName).toBe('America/New_York');

      const nrt = getAirportTimezone('NRT');
      expect(nrt.utcOffset).toBe('+09:00');
      expect(nrt.ianaName).toBe('Asia/Tokyo');
    });

    test('handles case-insensitive airport codes', () => {
      expect(getAirportTimezone('jfk')).toEqual(getAirportTimezone('JFK'));
    });

    test('throws error for unknown airport codes', () => {
      expect(() => getAirportTimezone('XXX')).toThrow();
    });
  });

  describe('calculateTimezoneDifference', () => {
    test('calculates correct timezone differences', () => {
      expect(calculateTimezoneDifference('+00:00', '+05:00')).toBe(5);
      expect(calculateTimezoneDifference('+09:00', '-05:00')).toBe(-14);
      expect(calculateTimezoneDifference('-08:00', '+00:00')).toBe(8);
    });

    test('handles international date line correctly', () => {
      // Tokyo to Los Angeles (should go westward)
      expect(calculateTimezoneDifference('+09:00', '-08:00')).toBe(-17);
      // Los Angeles to Tokyo (should go eastward)
      expect(calculateTimezoneDifference('-08:00', '+09:00')).toBe(17);
    });

    test('throws error for invalid offsets', () => {
      expect(() => calculateTimezoneDifference('invalid', '+00:00')).toThrow();
      expect(() => calculateTimezoneDifference('+00:00', 'invalid')).toThrow();
    });
  });

  describe('normalizeTimezone', () => {
    test('normalizes UTC offset strings', () => {
      const result = normalizeTimezone('+09:00');
      expect(result.utcOffset).toBe('+09:00');
    });

    test('normalizes IANA timezone names', () => {
      const result = normalizeTimezone('America/New_York');
      expect(result.utcOffset).toBeDefined();
      expect(result.ianaName).toBe('America/New_York');
    });

    test('validates existing TimezoneFormat objects', () => {
      const timezone: TimezoneFormat = {
        utcOffset: '+09:00',
        ianaName: 'Asia/Tokyo',
        displayName: 'Tokyo'
      };
      expect(normalizeTimezone(timezone)).toEqual(timezone);
    });

    test('throws error for invalid inputs', () => {
      expect(() => normalizeTimezone('invalid')).toThrow();
      expect(() => normalizeTimezone({ utcOffset: 'invalid' } as TimezoneFormat)).toThrow();
    });
  });

  describe('convertTime', () => {
    test('converts times between timezones correctly', () => {
      const nycTime = new Date('2024-01-01T12:00:00-05:00');
      const tokyoTz = { utcOffset: '+09:00', ianaName: 'Asia/Tokyo' };
      const nycTz = { utcOffset: '-05:00', ianaName: 'America/New_York' };
      
      const tokyoTime = convertTime(nycTime, nycTz, tokyoTz);
      expect(tokyoTime.getUTCHours()).toBe((12 + 14) % 24); // 14-hour difference
    });

    test('handles date line crossing', () => {
      const laxTime = new Date('2024-01-01T20:00:00-08:00');
      const tokyoTz = { utcOffset: '+09:00' };
      const laxTz = { utcOffset: '-08:00' };
      
      const tokyoTime = convertTime(laxTime, laxTz, tokyoTz);
      expect(tokyoTime.getUTCDate()).toBe(2); // Should be next day in Tokyo
    });
  });
}); 
}); 
}); 
}); 
}); 