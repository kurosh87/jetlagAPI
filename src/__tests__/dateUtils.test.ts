import {
  timeToMinutes,
  minutesToTime,
  addMinutes,
  subtractMinutes,
  calculateTimeDifference
} from '../utils/dateUtils';

describe('Date Utilities', () => {
  describe('timeToMinutes', () => {
    test('converts standard times correctly', () => {
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('01:30')).toBe(90);
      expect(timeToMinutes('23:59')).toBe(1439);
    });

    test('handles edge cases', () => {
      expect(timeToMinutes('24:00')).toBe(1440);
      expect(timeToMinutes('00:01')).toBe(1);
    });
  });

  describe('minutesToTime', () => {
    test('converts minutes to time format', () => {
      expect(minutesToTime(0)).toBe('00:00');
      expect(minutesToTime(90)).toBe('01:30');
      expect(minutesToTime(1439)).toBe('23:59');
    });

    test('handles wrapping around 24 hours', () => {
      expect(minutesToTime(1440)).toBe('00:00');
      expect(minutesToTime(1441)).toBe('00:01');
      expect(minutesToTime(1500)).toBe('01:00');
    });

    test('handles negative minutes', () => {
      expect(minutesToTime(-60)).toBe('23:00');
      expect(minutesToTime(-90)).toBe('22:30');
    });
  });

  describe('addMinutes', () => {
    test('adds minutes correctly', () => {
      expect(addMinutes('12:00', 60)).toBe('13:00');
      expect(addMinutes('23:30', 60)).toBe('00:30');
      expect(addMinutes('00:00', 90)).toBe('01:30');
    });

    test('handles day wrapping', () => {
      expect(addMinutes('23:00', 120)).toBe('01:00');
      expect(addMinutes('23:45', 30)).toBe('00:15');
    });
  });

  describe('subtractMinutes', () => {
    test('subtracts minutes correctly', () => {
      expect(subtractMinutes('12:00', 60)).toBe('11:00');
      expect(subtractMinutes('01:30', 60)).toBe('00:30');
      expect(subtractMinutes('00:00', 90)).toBe('22:30');
    });

    test('handles day wrapping', () => {
      expect(subtractMinutes('01:00', 120)).toBe('23:00');
      expect(subtractMinutes('00:15', 30)).toBe('23:45');
    });
  });

  describe('calculateTimeDifference', () => {
    test('calculates positive differences', () => {
      expect(calculateTimeDifference('00:00', '01:00')).toBe(60);
      expect(calculateTimeDifference('23:00', '00:00')).toBe(60);
      expect(calculateTimeDifference('22:30', '23:30')).toBe(60);
    });

    test('handles day wrapping', () => {
      expect(calculateTimeDifference('23:00', '01:00')).toBe(120);
      expect(calculateTimeDifference('22:00', '02:00')).toBe(240);
    });

    test('handles same times', () => {
      expect(calculateTimeDifference('00:00', '00:00')).toBe(0);
      expect(calculateTimeDifference('12:00', '12:00')).toBe(0);
    });
  });
}); 