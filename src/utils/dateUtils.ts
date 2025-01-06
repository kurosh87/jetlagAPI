export function addMinutes(time: string, minutesToAdd: number): string {
  const totalMinutes = timeToMinutes(time) + minutesToAdd;
  return minutesToTime(totalMinutes);
}

export function addHours(time: string, hours: number): string {
  return addMinutes(time, hours * 60);
}

export function subtractHours(time: string, hours: number): string {
  return addHours(time, -hours);
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  // Handle negative minutes
  let adjustedMinutes = totalMinutes;
  while (adjustedMinutes < 0) {
    adjustedMinutes += 24 * 60;
  }
  
  // Handle day wrapping
  adjustedMinutes = adjustedMinutes % (24 * 60);
  
  const hours = Math.floor(adjustedMinutes / 60);
  const minutes = Math.floor(adjustedMinutes % 60);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function isTimeInRange(time: string, start: string, end: string): boolean {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(start);
  let endMinutes = timeToMinutes(end);
  
  // Handle ranges that cross midnight
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }
  
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
}

export function calculateTimeDifference(time1: string, time2: string): number {
  let minutes1 = timeToMinutes(time1);
  let minutes2 = timeToMinutes(time2);
  
  // Handle day wrapping
  if (minutes2 < minutes1) {
    minutes2 += 24 * 60; // Add 24 hours if time2 is earlier
  }
  
  return minutes2 - minutes1;
}

export function subtractMinutes(time: string, minutesToSubtract: number): string {
  const totalMinutes = timeToMinutes(time) - minutesToSubtract;
  return minutesToTime(totalMinutes);
}

export function roundToNearestThirtyMinutes(time: string): string {
  const minutes = timeToMinutes(time);
  const roundedMinutes = Math.round(minutes / 30) * 30;
  return minutesToTime(roundedMinutes);
} 