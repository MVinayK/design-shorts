import { Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { formatFeedDate, formatRelativeSyncTime } from '../../lib/format';
import type { ContentSyncMetadata, Preferences } from '../../types';
import { styles } from '../appStyles';

type SettingsViewProps = {
  preferences: Preferences;
  onChangeMode: (mode: Preferences['feedMode']) => void;
  onChangeReminderCadence: (cadence: Preferences['readingReminderCadence']) => void;
  onChangeCelebrationSound: (enabled: boolean) => void;
  readCount: number;
  totalCount: number;
  currentStreak: number;
  longestStreak: number;
  completedChapters: number;
  totalChapters: number;
  completedBooks: number;
  totalBooks: number;
  onRefreshNews: () => void;
  isRefreshingNews: boolean;
  newsTimestamp: string | null;
  contentSyncMetadata: ContentSyncMetadata;
  onRefreshContent: () => void;
  isRefreshingContent: boolean;
};

export function SettingsView({
  preferences,
  onChangeMode,
  onChangeReminderCadence,
  onChangeCelebrationSound,
  readCount,
  totalCount,
  currentStreak,
  longestStreak,
  completedChapters,
  totalChapters,
  completedBooks,
  totalBooks,
  onRefreshNews,
  isRefreshingNews,
  newsTimestamp,
  contentSyncMetadata,
  onRefreshContent,
  isRefreshingContent,
}: SettingsViewProps) {
  return (
    <ScrollView style={styles.feedWrapper} contentContainerStyle={styles.settingsContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.settingsTitle}>Study settings</Text>
      <Text style={styles.settingsBody}>
        Serial keeps chapter order. Random favors unread topics and occasionally revisits completed ones.
      </Text>
      <View style={styles.segmentedControl}>
        {(['serial', 'random'] as const).map((mode) => {
          const selected = preferences.feedMode === mode;

          return (
            <TouchableOpacity
              key={mode}
              onPress={() => onChangeMode(mode)}
              activeOpacity={0.82}
              accessibilityRole="button"
              style={[styles.segmentButton, selected && styles.segmentButtonActive]}
            >
              <Text style={[styles.segmentButtonText, selected && styles.segmentButtonTextActive]}>
                {mode === 'serial' ? 'Serial' : 'Random'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsCardTitle}>Progress</Text>
        <Text style={styles.settingsCardValue}>
          {readCount} of {totalCount} topics read
        </Text>
        <Text style={styles.settingsHint}>
          {completedChapters}/{totalChapters} chapters complete · {completedBooks}/{totalBooks} books complete
        </Text>
        <Text style={styles.settingsHint}>
          Current streak {currentStreak} day{currentStreak === 1 ? '' : 's'} · Best streak {longestStreak} day
          {longestStreak === 1 ? '' : 's'}
        </Text>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsCardTitle}>Reading rhythm</Text>
        <Text style={styles.settingsHint}>
          Gentle local reminders. `Once` is morning only. `Twice` adds an evening nudge and can mention your streak.
          Device builds only.
        </Text>
        <View style={styles.segmentedControl}>
          {(['off', 'once', 'twice'] as const).map((cadence) => {
            const selected = preferences.readingReminderCadence === cadence;

            return (
              <TouchableOpacity
                key={cadence}
                onPress={() => onChangeReminderCadence(cadence)}
                activeOpacity={0.82}
                accessibilityRole="button"
                style={[styles.segmentButton, selected && styles.segmentButtonActive]}
              >
                <Text style={[styles.segmentButtonText, selected && styles.segmentButtonTextActive]}>
                  {cadence === 'off' ? 'Off' : cadence === 'once' ? 'Once' : 'Twice'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsCardTitle}>Completion energy</Text>
        <Text style={styles.settingsHint}>
          Adds a quick sound and tactile feedback when a topic is completed. Chapter clears get a stronger moment.
        </Text>
        <View style={styles.segmentedControl}>
          {([true, false] as const).map((enabled) => {
            const selected = preferences.celebrationSoundEnabled === enabled;

            return (
              <TouchableOpacity
                key={enabled ? 'on' : 'off'}
                onPress={() => onChangeCelebrationSound(enabled)}
                activeOpacity={0.82}
                accessibilityRole="button"
                style={[styles.segmentButton, selected && styles.segmentButtonActive]}
              >
                <Text style={[styles.segmentButtonText, selected && styles.segmentButtonTextActive]}>
                  {enabled ? 'Sound on' : 'Sound off'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsCardTitle}>Knowledge library</Text>
        <Text style={styles.settingsCardValue}>Catalog v{contentSyncMetadata.catalogVersion ?? '1'}</Text>
        <Text style={styles.settingsHint}>
          Last synced {formatRelativeSyncTime(contentSyncMetadata.lastSuccessfulSyncAt)}. Checks for fresh content when the
          app becomes active after an hour.
        </Text>
        <Pressable onPress={onRefreshContent} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{isRefreshingContent ? 'Refreshing...' : 'Refresh library'}</Text>
        </Pressable>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsCardTitle}>Tech news digest</Text>
        <Text style={styles.settingsCardValue}>
          {newsTimestamp ? `Last updated ${formatFeedDate(newsTimestamp)}` : 'Using bundled starter digest'}
        </Text>
        <Text style={styles.settingsHint}>
          The app fetches a static JSON digest. If refresh fails, the latest cached digest remains available.
        </Text>
        <Pressable onPress={onRefreshNews} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{isRefreshingNews ? 'Refreshing...' : 'Refresh digest'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
