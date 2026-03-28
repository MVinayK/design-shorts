import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ContentSyncMetadata, Preferences, Topic, TopicStatus } from '../types';

const PREFERENCES_KEY = 'design-shorts/preferences';
const PROGRESS_KEY = 'design-shorts/progress';
const NEWS_CACHE_KEY = 'design-shorts/news-cache';
const CONTENT_CACHE_PREFIX = 'design-shorts/content/';
const CONTENT_SYNC_METADATA_KEY = 'design-shorts/content-sync-metadata';

export const DEFAULT_PREFERENCES: Preferences = {
  feedMode: 'serial',
  randomWeightRead: 0.25,
  randomWeightUnread: 0.75,
  resumeCheckpointTopicId: null,
  readingReminderCadence: 'off',
  celebrationSoundEnabled: true,
};

export async function loadStoredState(): Promise<{
  preferences: Preferences;
  progressMap: Record<string, TopicStatus>;
}> {
  const [preferencesValue, progressValue] = await Promise.all([
    AsyncStorage.getItem(PREFERENCES_KEY),
    AsyncStorage.getItem(PROGRESS_KEY),
  ]);

  return {
    preferences: preferencesValue ? ({ ...DEFAULT_PREFERENCES, ...JSON.parse(preferencesValue) } as Preferences) : DEFAULT_PREFERENCES,
    progressMap: progressValue ? (JSON.parse(progressValue) as Record<string, TopicStatus>) : {},
  };
}

export async function savePreferences(preferences: Preferences) {
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export async function saveProgressMap(progressMap: Record<string, TopicStatus>) {
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progressMap));
}

export async function getCachedNewsDigest() {
  return AsyncStorage.getItem(NEWS_CACHE_KEY);
}

export async function saveCachedNewsDigest(value: string) {
  await AsyncStorage.setItem(NEWS_CACHE_KEY, value);
}

export async function getCachedContentDocument(path: string) {
  return AsyncStorage.getItem(`${CONTENT_CACHE_PREFIX}${path}`);
}

export async function saveCachedContentDocument(path: string, value: string) {
  await AsyncStorage.setItem(`${CONTENT_CACHE_PREFIX}${path}`, value);
}

export async function getContentSyncMetadata() {
  const value = await AsyncStorage.getItem(CONTENT_SYNC_METADATA_KEY);

  if (!value) {
    return null;
  }

  return JSON.parse(value) as ContentSyncMetadata;
}

export async function saveContentSyncMetadata(metadata: ContentSyncMetadata) {
  await AsyncStorage.setItem(CONTENT_SYNC_METADATA_KEY, JSON.stringify(metadata));
}

export async function markTopicRead(
  topicId: string,
  topics: Topic[],
  progressMap: Record<string, TopicStatus>,
  preferences: Preferences,
) {
  const nextProgressMap: Record<string, TopicStatus> = {
    ...progressMap,
    [topicId]: 'read',
  };
  const currentIndex = topics.findIndex((topic) => topic.id === topicId);
  const nextUnreadTopic = topics.slice(currentIndex + 1).find((topic) => nextProgressMap[topic.id] !== 'read');
  const nextPreferences = {
    ...preferences,
    resumeCheckpointTopicId: nextUnreadTopic?.id ?? topics[0]?.id ?? null,
  };

  await Promise.all([saveProgressMap(nextProgressMap), savePreferences(nextPreferences)]);

  return {
    progressMap: nextProgressMap,
    preferences: nextPreferences,
  };
}
