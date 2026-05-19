import { Platform } from 'react-native';
import {
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
  type Permission,
} from 'react-native-health-connect';
import type { DailyHealthMetrics } from './types';

const HEALTH_CONNECT_READ_PERMISSIONS: Permission[] = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'Distance' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'TotalCaloriesBurned' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'RestingHeartRate' },
  { accessType: 'read', recordType: 'SleepSession' },
];

function getTodayRange(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);

  return {
    endTime: end.toISOString(),
    startTime: start.toISOString(),
  };
}

function getDurationMinutes(startTime: string, endTime: string) {
  return Math.max(Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000), 0);
}

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function isHealthConnectAvailable() {
  if (Platform.OS !== 'android') {
    return false;
  }

  const status = await getSdkStatus();
  return status === SdkAvailabilityStatus.SDK_AVAILABLE;
}

export async function initializeHealthConnect() {
  if (!(await isHealthConnectAvailable())) {
    return false;
  }

  return initialize();
}

export async function requestHealthConnectReadPermissions() {
  const grantedPermissions = await requestPermission(HEALTH_CONNECT_READ_PERMISSIONS);
  return grantedPermissions.some((permission) => permission.accessType === 'read');
}

export async function hasHealthConnectReadPermissions() {
  const grantedPermissions = await getGrantedPermissions();

  return HEALTH_CONNECT_READ_PERMISSIONS.every((permission) =>
    grantedPermissions.some(
      (grantedPermission) =>
        grantedPermission.accessType === permission.accessType && grantedPermission.recordType === permission.recordType,
    ),
  );
}

export function openHealthSettings() {
  openHealthConnectSettings();
}

export async function readDailyHealthMetrics(now = new Date()): Promise<DailyHealthMetrics> {
  const range = getTodayRange(now);
  const timeRangeFilter = {
    operator: 'between' as const,
    startTime: range.startTime,
    endTime: range.endTime,
  };
  const [steps, distance, activeCalories, totalCalories, heartRate, restingHeartRate, sleep] = await Promise.all([
    readRecords('Steps', { timeRangeFilter }),
    readRecords('Distance', { timeRangeFilter }),
    readRecords('ActiveCaloriesBurned', { timeRangeFilter }),
    readRecords('TotalCaloriesBurned', { timeRangeFilter }),
    readRecords('HeartRate', { timeRangeFilter }),
    readRecords('RestingHeartRate', { timeRangeFilter }),
    readRecords('SleepSession', { timeRangeFilter }),
  ]);
  const stepsTotal = steps.records.reduce((sum, record) => sum + record.count, 0);
  const distanceKm = distance.records.reduce((sum, record) => sum + record.distance.inKilometers, 0);
  const activeCaloriesTotal = activeCalories.records.reduce((sum, record) => sum + record.energy.inKilocalories, 0);
  const totalCaloriesTotal = totalCalories.records.reduce((sum, record) => sum + record.energy.inKilocalories, 0);
  const activeMinutes = activeCalories.records.reduce(
    (sum, record) => sum + getDurationMinutes(record.startTime, record.endTime),
    0,
  );
  const heartRateSamples = heartRate.records.flatMap((record) => record.samples.map((sample) => sample.beatsPerMinute));
  const restingHeartRateSamples = restingHeartRate.records.map((record) => record.beatsPerMinute);
  const averageHeartRate =
    heartRateSamples.length > 0
      ? Math.round(heartRateSamples.reduce((sum, value) => sum + value, 0) / heartRateSamples.length)
      : null;
  const sleepMinutes = sleep.records.reduce((sum, record) => sum + getDurationMinutes(record.startTime, record.endTime), 0);

  return {
    activeMinutes: activeMinutes || null,
    caloriesOut: Math.round(activeCaloriesTotal || totalCaloriesTotal) || null,
    date: getDateKey(now),
    distanceKm: distanceKm || null,
    fetchedAt: new Date().toISOString(),
    restingHeartRate: restingHeartRateSamples[restingHeartRateSamples.length - 1] ?? averageHeartRate,
    sleepEfficiency: null,
    sleepMinutes: sleepMinutes || null,
    steps: stepsTotal || null,
  };
}
