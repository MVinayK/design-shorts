export type HealthConnectionStatus = 'unsupported' | 'disconnected' | 'connecting' | 'connected' | 'error';

export type HealthProfile = {
  displayName: string | null;
  email: string | null;
};

export type DailyHealthMetrics = {
  date: string;
  steps: number | null;
  distanceKm: number | null;
  activeMinutes: number | null;
  caloriesOut: number | null;
  restingHeartRate: number | null;
  sleepMinutes: number | null;
  sleepEfficiency: number | null;
  fetchedAt: string;
};

export type HealthSession = {
  connectedAt: string;
  profile: HealthProfile | null;
};
