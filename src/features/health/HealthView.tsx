import { Pressable, ScrollView, Text, View } from 'react-native';
import { formatRelativeSyncTime } from '../../lib/format';
import { styles } from '../../ui/appStyles';
import { useHealthConnection } from './useHealthConnection';

function formatOptionalNumber(value: number | null, suffix = '') {
  if (value === null) {
    return 'Not available';
  }

  return `${value.toLocaleString()}${suffix}`;
}

function formatSleep(minutes: number | null) {
  if (minutes === null) {
    return 'Not available';
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function HealthView() {
  const health = useHealthConnection();
  const isBusy = health.status === 'connecting';

  return (
    <ScrollView style={styles.feedWrapper} contentContainerStyle={styles.settingsContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.settingsTitle}>Health rhythm</Text>
      <Text style={styles.settingsBody}>
        Health Connect reads private signals from this Pixel: movement, sleep, and recovery. Later it can drive walking
        nudges and office/WFH routines.
      </Text>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsCardTitle}>Health Connect</Text>
        <Text style={styles.settingsCardValue}>
          {health.status === 'connected'
            ? 'Connected'
            : health.status === 'unsupported'
              ? 'Unavailable'
              : 'Not connected'}
        </Text>
        <Text style={styles.settingsHint}>
          Fitbit should sync into Health Connect on this phone. Grant read permissions here, then refresh today’s metrics.
        </Text>
        {health.errorMessage ? <Text style={styles.healthErrorText}>{health.errorMessage}</Text> : null}
        <View style={styles.healthActionRow}>
          <Pressable
            disabled={!health.canConnect || isBusy}
            onPress={() => void health.connect()}
            style={[styles.primaryButton, (!health.canConnect || isBusy) && styles.disabledButton]}
          >
            <Text style={styles.primaryButtonText}>
              {health.status === 'connected' ? 'Refresh permissions' : isBusy ? 'Connecting...' : 'Connect Health Connect'}
            </Text>
          </Pressable>
          <Pressable onPress={health.openSettings} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Open settings</Text>
          </Pressable>
          {health.status === 'connected' ? (
            <Pressable onPress={() => void health.disconnect()} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Disconnect</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsCardTitle}>Today</Text>
        <Text style={styles.settingsHint}>
          {health.metrics ? `Fetched ${formatRelativeSyncTime(health.metrics.fetchedAt)}` : 'Connect Health Connect to load today.'}
        </Text>
        <View style={styles.healthMetricGrid}>
          <View style={styles.healthMetricTile}>
            <Text style={styles.healthMetricLabel}>Steps</Text>
            <Text style={styles.healthMetricValue}>{formatOptionalNumber(health.metrics?.steps ?? null)}</Text>
          </View>
          <View style={styles.healthMetricTile}>
            <Text style={styles.healthMetricLabel}>Active minutes</Text>
            <Text style={styles.healthMetricValue}>{formatOptionalNumber(health.metrics?.activeMinutes ?? null)}</Text>
          </View>
          <View style={styles.healthMetricTile}>
            <Text style={styles.healthMetricLabel}>Distance</Text>
            <Text style={styles.healthMetricValue}>
              {health.metrics?.distanceKm === null || health.metrics?.distanceKm === undefined
                ? 'Not available'
                : `${health.metrics.distanceKm.toFixed(1)} km`}
            </Text>
          </View>
          <View style={styles.healthMetricTile}>
            <Text style={styles.healthMetricLabel}>Calories</Text>
            <Text style={styles.healthMetricValue}>{formatOptionalNumber(health.metrics?.caloriesOut ?? null)}</Text>
          </View>
          <View style={styles.healthMetricTile}>
            <Text style={styles.healthMetricLabel}>Resting HR</Text>
            <Text style={styles.healthMetricValue}>{formatOptionalNumber(health.metrics?.restingHeartRate ?? null, ' bpm')}</Text>
          </View>
          <View style={styles.healthMetricTile}>
            <Text style={styles.healthMetricLabel}>Sleep</Text>
            <Text style={styles.healthMetricValue}>{formatSleep(health.metrics?.sleepMinutes ?? null)}</Text>
          </View>
        </View>
        {health.status === 'connected' ? (
          <Pressable onPress={() => void health.refresh()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{isBusy ? 'Refreshing...' : 'Refresh metrics'}</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}
