import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { BUNDLED_NEWS_DIGEST } from './src/data/bundledNews';
import { TOPICS } from './src/data/topics';
import { createRandomDeck, getSerialStartIndex, getTopicProgressSummary, getTopicStatus } from './src/lib/feed';
import { formatFeedDate } from './src/lib/format';
import { loadNewsDigest, refreshNewsDigest } from './src/lib/newsRepository';
import { DEFAULT_PREFERENCES, loadStoredState, markTopicRead, savePreferences } from './src/lib/storage';
import type { FeedTab, NewsCard, Preferences, Topic, TopicStatus } from './src/types';

function TopicCard({
  topic,
  status,
  onMarkRead,
  height,
}: {
  topic: Topic;
  status: 'read' | 'unread';
  onMarkRead: () => void;
  height: number;
}) {
  return (
    <View style={[styles.page, { height }]}>
      <View style={styles.card}>
        <View style={styles.topicMetaRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{topic.category}</Text>
          </View>
          <Text style={styles.readTime}>{topic.estimatedReadTime} min read</Text>
        </View>
        <Text style={styles.topicTitle}>{topic.title}</Text>
        <Text style={styles.topicSummary}>{topic.summaryShort}</Text>
        <View style={styles.pointList}>
          {topic.keyPoints.map((point) => (
            <View key={point} style={styles.pointRow}>
              <View style={styles.pointDot} />
              <Text style={styles.pointText}>{point}</Text>
            </View>
          ))}
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.statusText}>{status === 'read' ? 'Read' : 'Unread'}</Text>
          <Pressable onPress={onMarkRead} style={[styles.primaryButton, status === 'read' && styles.secondaryButton]}>
            <Text style={[styles.primaryButtonText, status === 'read' && styles.secondaryButtonText]}>
              {status === 'read' ? 'Read again later' : 'Mark as Read'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function NewsCardView({ story, height }: { story: NewsCard; height: number }) {
  const openStory = useCallback(() => {
    void Linking.openURL(story.sourceUrl);
  }, [story.sourceUrl]);

  return (
    <View style={[styles.page, { height }]}>
      <View style={[styles.card, styles.newsCard]}>
        <View style={styles.topicMetaRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Tech News</Text>
          </View>
          <Text style={styles.readTime}>{formatFeedDate(story.publishedAt)}</Text>
        </View>
        <Text style={styles.topicTitle}>{story.title}</Text>
        <Text style={styles.topicSummary}>{story.summaryShort}</Text>
        <View style={styles.tagsRow}>
          {story.tags.map((tag) => (
            <View key={tag} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <View style={styles.sourcePanel}>
          <Text style={styles.sourceLabel}>Source</Text>
          <Text style={styles.sourceName}>{story.sourceName}</Text>
        </View>
        <Pressable onPress={openStory} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Open source</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SettingsView({
  preferences,
  onChangeMode,
  readCount,
  totalCount,
  onRefreshNews,
  isRefreshingNews,
  newsTimestamp,
}: {
  preferences: Preferences;
  onChangeMode: (mode: Preferences['feedMode']) => void;
  readCount: number;
  totalCount: number;
  onRefreshNews: () => void;
  isRefreshingNews: boolean;
  newsTimestamp: string | null;
}) {
  return (
    <View style={styles.settingsContainer}>
      <Text style={styles.settingsTitle}>Study settings</Text>
      <Text style={styles.settingsBody}>
        Pick how Design Shorts should serve HLD topics. Serial resumes from the next unread topic. Random
        favors unread topics at 75% and revisits read ones at 25%.
      </Text>
      <View style={styles.segmentedControl}>
        {(['serial', 'random'] as const).map((mode) => {
          const selected = preferences.feedMode === mode;

          return (
            <Pressable
              key={mode}
              onPress={() => onChangeMode(mode)}
              style={[styles.segmentButton, selected && styles.segmentButtonActive]}
            >
              <Text style={[styles.segmentButtonText, selected && styles.segmentButtonTextActive]}>
                {mode === 'serial' ? 'Serial' : 'Random'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsCardTitle}>Progress</Text>
        <Text style={styles.settingsCardValue}>
          {readCount} / {totalCount} topics read
        </Text>
        <Text style={styles.settingsHint}>
          Checkpoints are saved locally on this device. Offline reading works by default.
        </Text>
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
    </View>
  );
}

export default function App() {
  const { height } = useWindowDimensions();
  const topicFeedRef = useRef<FlatList<Topic>>(null);
  const [activeTab, setActiveTab] = useState<FeedTab>('learn');
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [progressMap, setProgressMap] = useState<Record<string, TopicStatus>>({});
  const [newsDigest, setNewsDigest] = useState(BUNDLED_NEWS_DIGEST);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      const stored = await loadStoredState();
      const digest = await loadNewsDigest();

      setPreferences(stored.preferences);
      setProgressMap(stored.progressMap);
      setNewsDigest(digest);
      setIsHydrated(true);

      try {
        const latestDigest = await refreshNewsDigest();
        setNewsDigest(latestDigest);
      } catch {
        // Fall back to bundled or cached data when the remote digest is not configured yet.
      }
    }

    void bootstrap();
  }, []);

  const sortedTopics = useMemo(() => [...TOPICS].sort((left, right) => left.orderIndex - right.orderIndex), []);

  const activeTopics = useMemo(() => {
    if (preferences.feedMode === 'serial') {
      return sortedTopics;
    }

    return createRandomDeck(sortedTopics, progressMap, 24, preferences.randomWeightUnread);
  }, [preferences.feedMode, preferences.randomWeightUnread, progressMap, sortedTopics]);

  const serialStartIndex = useMemo(
    () => getSerialStartIndex(sortedTopics, progressMap, preferences.resumeCheckpointTopicId),
    [preferences.resumeCheckpointTopicId, progressMap, sortedTopics],
  );

  const summary = useMemo(() => getTopicProgressSummary(sortedTopics, progressMap), [progressMap, sortedTopics]);

  const persistMode = useCallback(
    async (mode: Preferences['feedMode']) => {
      const nextPreferences = { ...preferences, feedMode: mode };
      setPreferences(nextPreferences);
      await savePreferences(nextPreferences);

      if (mode === 'serial') {
        requestAnimationFrame(() => {
          topicFeedRef.current?.scrollToIndex({
            animated: true,
            index: getSerialStartIndex(sortedTopics, progressMap, nextPreferences.resumeCheckpointTopicId),
          });
        });
      } else {
        requestAnimationFrame(() => {
          topicFeedRef.current?.scrollToOffset({ animated: false, offset: 0 });
        });
      }
    },
    [preferences, progressMap, sortedTopics],
  );

  const handleMarkRead = useCallback(
    async (topicId: string) => {
      const nextState = await markTopicRead(topicId, sortedTopics, progressMap, preferences);
      setProgressMap(nextState.progressMap);
      setPreferences(nextState.preferences);

      if (preferences.feedMode === 'serial') {
        const currentIndex = sortedTopics.findIndex((topic) => topic.id === topicId);
        const nextIndex = Math.min(currentIndex + 1, sortedTopics.length - 1);

        requestAnimationFrame(() => {
          topicFeedRef.current?.scrollToIndex({
            animated: true,
            index: nextIndex,
          });
        });
      }
    },
    [preferences, progressMap, sortedTopics],
  );

  const refreshDigest = useCallback(async () => {
    try {
      setIsRefreshingNews(true);
      setNewsError(null);
      const digest = await refreshNewsDigest();
      setNewsDigest(digest);
    } catch (error) {
      setNewsError(error instanceof Error ? error.message : 'Could not refresh the latest digest.');
    } finally {
      setIsRefreshingNews(false);
    }
  }, []);

  if (!isHydrated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.loadingScreen}>
          <Text style={styles.loadingTitle}>Design Shorts</Text>
          <Text style={styles.loadingText}>Preparing your HLD feed...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.appShell}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Mobile-first HLD prep</Text>
            <Text style={styles.headerTitle}>Design Shorts</Text>
          </View>
          <Text style={styles.headerMeta}>
            {activeTab === 'learn'
              ? `${summary.readCount}/${summary.totalCount} topics done`
              : `${newsDigest.items.length} tech stories`}
          </Text>
        </View>

        <View style={styles.content}>
          {activeTab === 'learn' ? (
            <FlatList
              ref={topicFeedRef}
              data={activeTopics}
              key={preferences.feedMode}
              pagingEnabled
              showsVerticalScrollIndicator={false}
              snapToAlignment="start"
              decelerationRate="fast"
              initialScrollIndex={preferences.feedMode === 'serial' ? serialStartIndex : 0}
              getItemLayout={(_, index) => ({ index, length: height - 184, offset: (height - 184) * index })}
              renderItem={({ item }) => (
                <TopicCard
                  topic={item}
                  status={getTopicStatus(item.id, progressMap)}
                  onMarkRead={() => void handleMarkRead(item.id)}
                  height={height - 184}
                />
              )}
              keyExtractor={(item) => item.id}
            />
          ) : null}

          {activeTab === 'news' ? (
            <View style={styles.feedWrapper}>
              <FlatList
                data={newsDigest.items}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToAlignment="start"
                decelerationRate="fast"
                renderItem={({ item }) => <NewsCardView story={item} height={height - 184} />}
                keyExtractor={(item) => item.id}
              />
              {newsError ? <Text style={styles.errorText}>{newsError}</Text> : null}
            </View>
          ) : null}

          {activeTab === 'settings' ? (
            <View style={styles.feedWrapper}>
              <SettingsView
                preferences={preferences}
                onChangeMode={(mode) => void persistMode(mode)}
                readCount={summary.readCount}
                totalCount={summary.totalCount}
                onRefreshNews={() => void refreshDigest()}
                isRefreshingNews={isRefreshingNews}
                newsTimestamp={newsDigest.generatedAt}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.tabBar}>
          {([
            ['learn', 'Learn'],
            ['news', 'News'],
            ['settings', 'Settings'],
          ] as const).map(([tab, label]) => {
            const selected = activeTab === tab;

            return (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabButton, selected && styles.tabButtonActive]}>
                <Text style={[styles.tabText, selected && styles.tabTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#08111f',
  },
  appShell: {
    flex: 1,
    backgroundColor: '#08111f',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  eyebrow: {
    color: '#7db5ff',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: '#f4f8ff',
    fontSize: 30,
    fontWeight: '700',
    marginTop: 6,
  },
  headerMeta: {
    color: '#9cb3d1',
    fontSize: 13,
  },
  content: {
    flex: 1,
  },
  feedWrapper: {
    flex: 1,
  },
  page: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  card: {
    flex: 1,
    backgroundColor: '#10233b',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: '#183656',
    justifyContent: 'space-between',
  },
  newsCard: {
    backgroundColor: '#0d1d31',
  },
  topicMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#133a63',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: '#a9d1ff',
    fontSize: 12,
    fontWeight: '700',
  },
  readTime: {
    color: '#8da8ca',
    fontSize: 12,
  },
  topicTitle: {
    marginTop: 18,
    color: '#f5f8ff',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },
  topicSummary: {
    marginTop: 14,
    color: '#d2dded',
    fontSize: 17,
    lineHeight: 26,
  },
  pointList: {
    marginTop: 22,
    gap: 12,
  },
  pointRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  pointDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginTop: 7,
    backgroundColor: '#5cc8ff',
  },
  pointText: {
    flex: 1,
    color: '#c0d2e8',
    fontSize: 15,
    lineHeight: 22,
  },
  cardFooter: {
    marginTop: 24,
    gap: 14,
  },
  statusText: {
    color: '#86a0c2',
    fontSize: 14,
  },
  primaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 15,
    backgroundColor: '#f47c48',
    borderRadius: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff7f3',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#173655',
  },
  secondaryButtonText: {
    color: '#b9d2f2',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
  },
  tagPill: {
    backgroundColor: '#133a63',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  tagText: {
    color: '#b8d5fb',
    fontSize: 12,
    fontWeight: '600',
  },
  sourcePanel: {
    marginTop: 22,
    padding: 16,
    backgroundColor: '#13263e',
    borderRadius: 18,
  },
  sourceLabel: {
    color: '#7f9fca',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sourceName: {
    marginTop: 8,
    color: '#eff5ff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsContainer: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 16,
  },
  settingsTitle: {
    color: '#f4f8ff',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 6,
  },
  settingsBody: {
    color: '#c5d5ea',
    fontSize: 16,
    lineHeight: 24,
  },
  segmentedControl: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 18,
    backgroundColor: '#0f1f34',
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#f47c48',
  },
  segmentButtonText: {
    color: '#8da8ca',
    fontWeight: '700',
  },
  segmentButtonTextActive: {
    color: '#fff7f3',
  },
  settingsCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#10233b',
    borderWidth: 1,
    borderColor: '#183656',
    gap: 10,
  },
  settingsCardTitle: {
    color: '#d9e6f7',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingsCardValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  settingsHint: {
    color: '#9fb6d3',
    fontSize: 14,
    lineHeight: 21,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: '#142a45',
    backgroundColor: '#08111f',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#0d1d31',
  },
  tabButtonActive: {
    backgroundColor: '#133a63',
  },
  tabText: {
    color: '#7f9fca',
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#edf5ff',
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#08111f',
  },
  loadingTitle: {
    color: '#f3f8ff',
    fontSize: 28,
    fontWeight: '700',
  },
  loadingText: {
    color: '#a1bad9',
    fontSize: 15,
  },
  errorText: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 18,
    color: '#ffc6b4',
    textAlign: 'center',
  },
});
