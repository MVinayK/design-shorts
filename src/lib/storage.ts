import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ContentSyncMetadata, Preferences, StreakState, Topic, TopicStatus } from '../types';

const PREFERENCES_KEY = 'design-shorts/preferences';
const PROGRESS_KEY = 'design-shorts/progress';
const NEWS_CACHE_KEY = 'design-shorts/news-cache';
const CONTENT_CACHE_PREFIX = 'design-shorts/content/';
const CONTENT_SYNC_METADATA_KEY = 'design-shorts/content-sync-metadata';
const STREAK_STATE_KEY = 'design-shorts/streak-state';

export const DEFAULT_STREAK_STATE: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastReadDate: null,
  totalCompletedTopics: 0,
};

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPreviousDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map((part) => Number.parseInt(part, 10));
  const previous = new Date(year, month - 1, day);
  previous.setDate(previous.getDate() - 1);
  return toLocalDateKey(previous);
}

function getNextStreakState(previous: StreakState, completedTopicCount: number, now = new Date()): StreakState {
  const todayKey = toLocalDateKey(now);

  if (previous.lastReadDate === todayKey) {
    return {
      ...previous,
      totalCompletedTopics: completedTopicCount,
    };
  }

  const nextCurrentStreak =
    previous.lastReadDate === getPreviousDateKey(todayKey) ? previous.currentStreak + 1 : 1;

  return {
    currentStreak: nextCurrentStreak,
    longestStreak: Math.max(previous.longestStreak, nextCurrentStreak),
    lastReadDate: todayKey,
    totalCompletedTopics: completedTopicCount,
  };
}

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
  streakState: StreakState;
}> {
  const [preferencesValue, progressValue, streakValue] = await Promise.all([
    AsyncStorage.getItem(PREFERENCES_KEY),
    AsyncStorage.getItem(PROGRESS_KEY),
    AsyncStorage.getItem(STREAK_STATE_KEY),
  ]);

  return {
    preferences: preferencesValue ? ({ ...DEFAULT_PREFERENCES, ...JSON.parse(preferencesValue) } as Preferences) : DEFAULT_PREFERENCES,
    progressMap: progressValue ? (JSON.parse(progressValue) as Record<string, TopicStatus>) : {},
    streakState: streakValue ? ({ ...DEFAULT_STREAK_STATE, ...JSON.parse(streakValue) } as StreakState) : DEFAULT_STREAK_STATE,
  };
}

export async function savePreferences(preferences: Preferences) {
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export async function saveProgressMap(progressMap: Record<string, TopicStatus>) {
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progressMap));
}

export async function saveStreakState(streakState: StreakState) {
  await AsyncStorage.setItem(STREAK_STATE_KEY, JSON.stringify(streakState));
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
  streakState: StreakState,
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
  const completedTopicCount = Object.values(nextProgressMap).filter((status) => status === 'read').length;
  const nextStreakState = getNextStreakState(streakState, completedTopicCount);

  await Promise.all([saveProgressMap(nextProgressMap), savePreferences(nextPreferences), saveStreakState(nextStreakState)]);

  return {
    progressMap: nextProgressMap,
    preferences: nextPreferences,
    streakState: nextStreakState,
  };
}
