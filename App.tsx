import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
  height,
  width,
  currentIndex,
  total,
}: {
  topic: Topic;
  height: number;
  width: number;
  currentIndex: number;
  total: number;
}) {
  return (
    <View style={[styles.page, { height, width }]}>
      <View style={styles.card}>
        <View style={styles.topicMetaRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{topic.category}</Text>
          </View>
          <Text style={styles.readTime}>{topic.estimatedReadTime} min read</Text>
        </View>
        <View style={styles.pageCountRow}>
          <Text style={styles.pageCountText}>
            {currentIndex + 1} / {total}
          </Text>
          <Text style={styles.swipeHint}>Swipe left or right</Text>
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
          <Text style={styles.statusText}>Swipe ahead to move through the track.</Text>
        </View>
      </View>
    </View>
  );
}

function NewsCardView({
  story,
  height,
  width,
  currentIndex,
  total,
}: {
  story: NewsCard;
  height: number;
  width: number;
  currentIndex: number;
  total: number;
}) {
  const openStory = useCallback(() => {
    void Linking.openURL(story.sourceUrl);
  }, [story.sourceUrl]);

  return (
    <View style={[styles.page, { height, width }]}>
      <View style={[styles.card, styles.newsCard]}>
        <View style={styles.topicMetaRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Tech News</Text>
          </View>
          <Text style={styles.readTime}>{formatFeedDate(story.publishedAt)}</Text>
        </View>
        <View style={styles.pageCountRow}>
          <Text style={styles.pageCountText}>
            {currentIndex + 1} / {total}
          </Text>
          <Text style={styles.swipeHint}>Swipe left or right</Text>
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
  const { height, width } = useWindowDimensions();
  const topicFeedRef = useRef<FlatList<Topic>>(null);
  const newsFeedRef = useRef<FlatList<NewsCard>>(null);
  const [activeTab, setActiveTab] = useState<FeedTab>('learn');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [progressMap, setProgressMap] = useState<Record<string, TopicStatus>>({});
  const [newsDigest, setNewsDigest] = useState(BUNDLED_NEWS_DIGEST);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

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

  const markTopicReadIfNeeded = useCallback(
    async (topicId: string) => {
      if (progressMap[topicId] === 'read') {
        return;
      }

      const nextState = await markTopicRead(topicId, sortedTopics, progressMap, preferences);
      setProgressMap(nextState.progressMap);
      setPreferences(nextState.preferences);
    },
    [preferences, progressMap, sortedTopics],
  );

  const handleTopicSwipeEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);

      if (nextIndex === currentTopicIndex) {
        return;
      }

      const previousTopic = activeTopics[currentTopicIndex];
      setCurrentTopicIndex(nextIndex);

      if (nextIndex > currentTopicIndex && previousTopic) {
        void markTopicReadIfNeeded(previousTopic.id);
      }
    },
    [activeTopics, currentTopicIndex, markTopicReadIfNeeded, width],
  );

  const handleNewsSwipeEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
      setCurrentNewsIndex(nextIndex);
    },
    [width],
  );

  const switchTab = useCallback((tab: FeedTab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
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
          <View style={styles.headerActions}>
            <Text style={styles.headerMeta}>
              {activeTab === 'learn'
                ? `${summary.readCount}/${summary.totalCount} topics done`
                : activeTab === 'news'
                  ? `${newsDigest.items.length} tech stories`
                  : 'Preferences'}
            </Text>
            <Pressable onPress={() => setIsMenuOpen((value) => !value)} style={styles.menuButton}>
              <Text style={styles.menuButtonText}>Menu</Text>
            </Pressable>
            {isMenuOpen ? (
              <View style={styles.menuPanel}>
                {([
                  ['learn', 'Learn'],
                  ['news', 'News'],
                  ['settings', 'Settings'],
                ] as const).map(([tab, label]) => (
                  <Pressable key={tab} onPress={() => switchTab(tab)} style={styles.menuItem}>
                    <Text style={[styles.menuItemText, activeTab === tab && styles.menuItemTextActive]}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.content}>
          {activeTab === 'learn' ? (
            <FlatList
              ref={topicFeedRef}
              data={activeTopics}
              key={preferences.feedMode}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToAlignment="start"
              decelerationRate="fast"
              initialScrollIndex={preferences.feedMode === 'serial' ? serialStartIndex : 0}
              onMomentumScrollEnd={handleTopicSwipeEnd}
              getItemLayout={(_, index) => ({ index, length: width, offset: width * index })}
              renderItem={({ item }) => (
                <TopicCard
                  topic={item}
                  height={height - 136}
                  width={width}
                  currentIndex={activeTopics.findIndex((topic) => topic.id === item.id)}
                  total={activeTopics.length}
                />
              )}
              keyExtractor={(item) => item.id}
            />
          ) : null}

          {activeTab === 'news' ? (
            <View style={styles.feedWrapper}>
              <FlatList
                ref={newsFeedRef}
                data={newsDigest.items}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToAlignment="start"
                decelerationRate="fast"
                onMomentumScrollEnd={handleNewsSwipeEnd}
                renderItem={({ item }) => (
                  <NewsCardView
                    story={item}
                    height={height - 136}
                    width={width}
                    currentIndex={newsDigest.items.findIndex((story) => story.id === item.id)}
                    total={newsDigest.items.length}
                  />
                )}
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

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  appShell: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    position: 'relative',
    zIndex: 50,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    color: '#2867c6',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: '#13428f',
    fontSize: 30,
    fontWeight: '700',
    marginTop: 6,
  },
  headerMeta: {
    color: '#cc4c3b',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  headerActions: {
    alignItems: 'flex-end',
    position: 'relative',
    gap: 10,
  },
  menuButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#255fbe',
  },
  menuButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  menuPanel: {
    position: 'absolute',
    top: 58,
    right: 0,
    minWidth: 148,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d6e6fb',
    shadowColor: '#2b5fad',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 5,
    zIndex: 200,
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  menuItemText: {
    color: '#255fbe',
    fontWeight: '600',
  },
  menuItemTextActive: {
    color: '#ea5445',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  feedWrapper: {
    flex: 1,
  },
  page: {
    paddingHorizontal: 0,
    paddingBottom: 0,
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 0,
    paddingHorizontal: 24,
    paddingVertical: 22,
    borderTopWidth: 1,
    borderTopColor: '#e1ebfb',
    justifyContent: 'space-between',
  },
  newsCard: {
    backgroundColor: '#ffffff',
  },
  topicMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#dfeeff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: '#1f5db8',
    fontSize: 12,
    fontWeight: '700',
  },
  readTime: {
    color: '#5377a8',
    fontSize: 12,
  },
  pageCountRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageCountText: {
    color: '#5d7cab',
    fontSize: 12,
    fontWeight: '600',
  },
  swipeHint: {
    color: '#e24f42',
    fontSize: 12,
    fontWeight: '700',
  },
  topicTitle: {
    marginTop: 18,
    color: '#163b72',
    fontSize: 31,
    lineHeight: 38,
    fontWeight: '700',
  },
  topicSummary: {
    marginTop: 14,
    color: '#3f5d87',
    fontSize: 18,
    lineHeight: 28,
  },
  pointList: {
    marginTop: 22,
    gap: 12,
    flex: 1,
    justifyContent: 'center',
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
    backgroundColor: '#ea5445',
  },
  pointText: {
    flex: 1,
    color: '#47678e',
    fontSize: 16,
    lineHeight: 24,
  },
  cardFooter: {
    marginTop: 20,
  },
  statusText: {
    color: '#5377a8',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 15,
    backgroundColor: '#255fbe',
    borderRadius: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#f5d7d3',
  },
  secondaryButtonText: {
    color: '#c94b3f',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
  },
  tagPill: {
    backgroundColor: '#eef4ff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  tagText: {
    color: '#2a61b8',
    fontSize: 12,
    fontWeight: '600',
  },
  sourcePanel: {
    marginTop: 22,
    padding: 16,
    backgroundColor: '#f4f8ff',
    borderRadius: 0,
    borderLeftWidth: 3,
    borderLeftColor: '#255fbe',
  },
  sourceLabel: {
    color: '#5377a8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sourceName: {
    marginTop: 8,
    color: '#163b72',
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
    color: '#163b72',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 6,
  },
  settingsBody: {
    color: '#456487',
    fontSize: 16,
    lineHeight: 24,
  },
  segmentedControl: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#f3f7ff',
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#255fbe',
  },
  segmentButtonText: {
    color: '#5377a8',
    fontWeight: '700',
  },
  segmentButtonTextActive: {
    color: '#ffffff',
  },
  settingsCard: {
    padding: 18,
    borderRadius: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d6e6fb',
    gap: 10,
  },
  settingsCardTitle: {
    color: '#5377a8',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingsCardValue: {
    color: '#163b72',
    fontSize: 22,
    fontWeight: '700',
  },
  settingsHint: {
    color: '#53708f',
    fontSize: 14,
    lineHeight: 21,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f7fbff',
  },
  loadingTitle: {
    color: '#163b72',
    fontSize: 28,
    fontWeight: '700',
  },
  loadingText: {
    color: '#5377a8',
    fontSize: 15,
  },
  errorText: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 18,
    color: '#cf4339',
    textAlign: 'center',
  },
});
