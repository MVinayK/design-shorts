import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  hasHealthConnectReadPermissions,
  initializeHealthConnect,
  openHealthSettings,
  readDailyHealthMetrics,
  requestHealthConnectReadPermissions,
} from './healthConnectClient';
import type { DailyHealthMetrics, HealthConnectionStatus, HealthProfile, HealthSession } from './types';

export function useHealthConnection() {
  const [session, setSession] = useState<HealthSession | null>(null);
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [metrics, setMetrics] = useState<DailyHealthMetrics | null>(null);
  const [status, setStatus] = useState<HealthConnectionStatus>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadMetricsForSession = useCallback(async (activeSession: HealthSession) => {
    try {
      setStatus('connecting');
      setErrorMessage(null);
      const nextMetrics = await readDailyHealthMetrics();
      setMetrics(nextMetrics);
      setProfile(activeSession.profile);
      setStatus('connected');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load health metrics.');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function hydrateHealthConnect() {
      const initialized = await initializeHealthConnect();
      if (!isMounted) {
        return;
      }

      if (!initialized) {
        setStatus('unsupported');
        return;
      }

      const hasPermission = await hasHealthConnectReadPermissions();
      if (!isMounted) {
        return;
      }

      if (hasPermission) {
        const nextSession = {
          connectedAt: new Date().toISOString(),
          profile: null,
        };
        setSession(nextSession);
        void loadMetricsForSession(nextSession);
      }
    }

    void hydrateHealthConnect();

    return () => {
      isMounted = false;
    };
  }, [loadMetricsForSession]);

  const connect = useCallback(async () => {
    setStatus('connecting');
    setErrorMessage(null);
    const initialized = await initializeHealthConnect();
    if (!initialized) {
      setStatus('unsupported');
      return;
    }

    const granted = await requestHealthConnectReadPermissions();
    if (!granted) {
      setStatus('disconnected');
      setErrorMessage('Health Connect permissions were not granted.');
      return;
    }

    const nextSession = {
      connectedAt: new Date().toISOString(),
      profile: null,
    };
    setSession(nextSession);
    setProfile(nextSession.profile);
    await loadMetricsForSession(nextSession);
  }, [loadMetricsForSession]);

  const disconnect = useCallback(async () => {
    setSession(null);
    setProfile(null);
    setMetrics(null);
    setErrorMessage(null);
    setStatus('disconnected');
  }, []);

  const refresh = useCallback(() => {
    if (!session) {
      return Promise.resolve();
    }

    return loadMetricsForSession(session);
  }, [loadMetricsForSession, session]);

  return useMemo(
    () => ({
      canConnect: status !== 'connecting',
      connect,
      disconnect,
      errorMessage,
      metrics,
      openSettings: openHealthSettings,
      profile,
      refresh,
      status,
    }),
    [connect, disconnect, errorMessage, metrics, profile, refresh, status],
  );
}
