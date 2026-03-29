import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold, useFonts as useInterFonts } from '@expo-google-fonts/inter';
import { PlayfairDisplay_700Bold, useFonts as usePlayfairFonts } from '@expo-google-fonts/playfair-display';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BUNDLED_NEWS_DIGEST } from './src/data/bundledNews';
import {
  getBundledTopicFeed,
  loadTopicFeed,
  loadTopicFeedSyncMetadata,
  syncTopicFeedIfNeeded,
} from './src/lib/contentRepository';
import {
  createRandomDeck,
  getBookProgressSummary,
  getChapterProgressSummary,
  getSerialStartIndex,
  getTopicProgressSummary,
} from './src/lib/feed';
import { loadNewsDigest, refreshNewsDigest } from './src/lib/newsRepository';
import { syncReadingReminderSchedule } from './src/lib/reminders';
import {
  CelebrationState,
  getCelebrationState,
} from './src/lib/topicPresentation';
import { DEFAULT_PREFERENCES, DEFAULT_STREAK_STATE, loadStoredState, markTopicRead, savePreferences } from './src/lib/storage';
import type { ContentSyncMetadata, FeedTab, NewsCard, Preferences, StreakState, Topic, TopicFeed, TopicStatus } from './src/types';
import {
  FONT_SERIF,
  HEADER_BOTTOM_GAP,
  HEADER_CONTENT_HEIGHT,
  styles,
  WEB_MOBILE_SAFE_TOP,
} from './src/ui/appStyles';
import { ArticleModal } from './src/ui/components/ArticleModal';
import { CelebrationToast } from './src/ui/components/CelebrationToast';
import { LibraryView } from './src/ui/components/LibraryView';
import { NewsCardView } from './src/ui/components/NewsCardView';
import { SettingsView } from './src/ui/components/SettingsView';
import { TopicCard } from './src/ui/components/TopicCard';

const COMPLETION_SOUND = require('./assets/sounds/complete.wav');

function AppContent() {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const topSafeInset = insets.top > 0 ? insets.top : Platform.OS === 'web' && width <= 430 ? WEB_MOBILE_SAFE_TOP : 0;
  const headerTopPadding = topSafeInset + 12;
  const feedHeight = Math.max(height - headerTopPadding - HEADER_CONTENT_HEIGHT - HEADER_BOTTOM_GAP, 320);

  const topicFeedRef = useRef<FlatList<Topic>>(null);
  const newsFeedRef = useRef<FlatList<NewsCard>>(null);
  const celebrationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebrationSoundRef = useRef<Audio.Sound | null>(null);

  const [activeTab, setActiveTab] = useState<FeedTab>('learn');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [progressMap, setProgressMap] = useState<Record<string, TopicStatus>>({});
  const [topicFeed, setTopicFeed] = useState<TopicFeed>(getBundledTopicFeed());
  const [newsDigest, setNewsDigest] = useState(BUNDLED_NEWS_DIGEST);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);
  const [isRefreshingContent, setIsRefreshingContent] = useState(false);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [, setCurrentNewsIndex] = useState(0);
  const [expandedTopic, setExpandedTopic] = useState<Topic | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [focusedLibraryTopicId, setFocusedLibraryTopicId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
  const [streakState, setStreakState] = useState<StreakState>(DEFAULT_STREAK_STATE);
  const [contentSyncMetadata, setContentSyncMetadata] = useState<ContentSyncMetadata>({
    catalogVersion: getBundledTopicFeed().catalog.version,
    lastAttemptedSyncAt: null,
    lastSuccessfulSyncAt: null,
    source: getBundledTopicFeed().source,
  });

  const sortedTopics = useMemo(
    () => [...topicFeed.topics].sort((left, right) => left.orderIndex - right.orderIndex),
    [topicFeed.topics],
  );

  const scopedTopics = useMemo(() => {
    if (selectedChapterId) {
      return sortedTopics.filter((topic) => topic.bookId === selectedBookId && topic.chapterId === selectedChapterId);
    }

    if (selectedBookId) {
      return sortedTopics.filter((topic) => topic.bookId === selectedBookId);
    }

    return sortedTopics;
  }, [selectedBookId, selectedChapterId, sortedTopics]);

  const activeTopics = useMemo(() => {
    if (preferences.feedMode === 'serial') {
      return scopedTopics;
    }

    return createRandomDeck(scopedTopics, progressMap, 24, preferences.randomWeightUnread);
  }, [preferences.feedMode, preferences.randomWeightUnread, progressMap, scopedTopics]);

  const serialStartIndex = useMemo(
    () => getSerialStartIndex(scopedTopics, progressMap, preferences.resumeCheckpointTopicId),
    [preferences.resumeCheckpointTopicId, progressMap, scopedTopics],
  );

  const summary = useMemo(() => getTopicProgressSummary(sortedTopics, progressMap), [progressMap, sortedTopics]);
  const chapterProgressSummary = useMemo(() => {
    const totalChapters = topicFeed.books.reduce((sum, book) => sum + book.chapters.length, 0);
    const completedChapters = topicFeed.books.reduce(
      (count, book) =>
        count +
        book.chapters.filter((chapter) => {
          const chapterSummary = getChapterProgressSummary(chapter, sortedTopics, progressMap);
          return chapterSummary.totalCount > 0 && chapterSummary.readCount === chapterSummary.totalCount;
        }).length,
      0,
    );

    return { completedChapters, totalChapters };
  }, [progressMap, sortedTopics, topicFeed.books]);
  const bookProgressSummary = useMemo(() => {
    const completedBooks = topicFeed.books.filter((book) => {
      const bookSummary = getBookProgressSummary(book, sortedTopics, progressMap);
      return bookSummary.totalCount > 0 && bookSummary.readCount === bookSummary.totalCount;
    }).length;

    return { completedBooks, totalBooks: topicFeed.books.length };
  }, [progressMap, sortedTopics, topicFeed.books]);

  const learnFeedKey = useMemo(
    () => `${preferences.feedMode}-${selectedBookId ?? 'all'}-${selectedChapterId ?? 'all'}`,
    [preferences.feedMode, selectedBookId, selectedChapterId],
  );

  const menuActiveTab = useMemo<FeedTab>(
    () => (activeTab === 'learn' && (selectedBookId !== null || selectedChapterId !== null) ? 'library' : activeTab),
    [activeTab, selectedBookId, selectedChapterId],
  );
  const progressHeadline = useMemo(
    () => `${summary.readCount}/${summary.totalCount} topics · ${streakState.currentStreak}-day streak`,
    [streakState.currentStreak, summary.readCount, summary.totalCount],
  );

  const refreshContent = useCallback(
    async (force = false) => {
      try {
        setIsRefreshingContent(true);
        const result = await syncTopicFeedIfNeeded(topicFeed, force);
        setTopicFeed(result.feed);
        setContentSyncMetadata(result.metadata);
      } catch {
        // Keep bundled or cached content when remote refresh is unavailable.
      } finally {
        setIsRefreshingContent(false);
      }
    },
    [topicFeed],
  );

  useEffect(() => {
    async function bootstrap() {
      const [stored, digest, contentFeed] = await Promise.all([loadStoredState(), loadNewsDigest(), loadTopicFeed()]);
      const syncMetadata = await loadTopicFeedSyncMetadata(contentFeed);

      setPreferences(stored.preferences);
      setProgressMap(stored.progressMap);
      setStreakState(stored.streakState);
      setNewsDigest(digest);
      setTopicFeed(contentFeed);
      setContentSyncMetadata(syncMetadata);
      setIsHydrated(true);

      try {
        const [latestDigest, contentResult] = await Promise.all([refreshNewsDigest(), syncTopicFeedIfNeeded(contentFeed)]);
        setNewsDigest(latestDigest);
        setTopicFeed(contentResult.feed);
        setContentSyncMetadata(contentResult.metadata);
      } catch {
        // Fall back to bundled or cached data when remote content is not configured yet.
      }
    }

    void bootstrap();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void syncReadingReminderSchedule(preferences.readingReminderCadence, streakState);
  }, [isHydrated, preferences.readingReminderCadence, streakState]);

  useEffect(() => {
    setCurrentTopicIndex((currentIndex) => Math.min(currentIndex, Math.max(activeTopics.length - 1, 0)));
  }, [activeTopics.length]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void refreshContent();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshContent]);

  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
      }

      if (celebrationSoundRef.current) {
        void celebrationSoundRef.current.unloadAsync();
      }
    };
  }, []);

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

  const persistReminderCadence = useCallback(
    async (cadence: Preferences['readingReminderCadence']) => {
      const nextPreferences = { ...preferences, readingReminderCadence: cadence };
      setPreferences(nextPreferences);
      await savePreferences(nextPreferences);

      const result = await syncReadingReminderSchedule(cadence, streakState);
      if (cadence !== 'off' && !result.granted) {
        const fallbackPreferences = { ...nextPreferences, readingReminderCadence: 'off' as const };
        setPreferences(fallbackPreferences);
        await savePreferences(fallbackPreferences);
      }
    },
    [preferences, streakState],
  );

  const persistCelebrationSoundEnabled = useCallback(
    async (enabled: boolean) => {
      const nextPreferences = { ...preferences, celebrationSoundEnabled: enabled };
      setPreferences(nextPreferences);
      await savePreferences(nextPreferences);
    },
    [preferences],
  );

  const playCelebrationFeedback = useCallback(
    async (nextCelebration: CelebrationState) => {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Haptics are best effort.
      }

      if (!preferences.celebrationSoundEnabled) {
        return;
      }

      try {
        if (!celebrationSoundRef.current) {
          const { sound } = await Audio.Sound.createAsync(COMPLETION_SOUND, {
            shouldPlay: false,
            volume: nextCelebration.tone === 'chapter' ? 1 : 0.82,
          });
          celebrationSoundRef.current = sound;
        } else {
          await celebrationSoundRef.current.setVolumeAsync(nextCelebration.tone === 'chapter' ? 1 : 0.82);
        }

        await celebrationSoundRef.current.setPositionAsync(0);
        await celebrationSoundRef.current.playAsync();
      } catch {
        // Sound is best effort.
      }
    },
    [preferences.celebrationSoundEnabled],
  );

  const triggerCelebration = useCallback(
    (topic: Topic, nextProgressMap: Record<string, TopicStatus>) => {
      const nextCelebration = getCelebrationState(topic, sortedTopics, nextProgressMap);
      setCelebration(nextCelebration);

      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
      }

      celebrationTimeoutRef.current = setTimeout(() => {
        setCelebration(null);
      }, nextCelebration.tone === 'chapter' ? 1900 : 1300);

      void playCelebrationFeedback(nextCelebration);
    },
    [playCelebrationFeedback, sortedTopics],
  );

  const markTopicReadIfNeeded = useCallback(
    async (topicId: string) => {
      if (progressMap[topicId] === 'read') {
        return;
      }

      const nextState = await markTopicRead(topicId, sortedTopics, progressMap, preferences, streakState);
      setProgressMap(nextState.progressMap);
      setPreferences(nextState.preferences);
      setStreakState(nextState.streakState);
      const topic = sortedTopics.find((candidate) => candidate.id === topicId);

      if (topic) {
        triggerCelebration(topic, nextState.progressMap);
      }
    },
    [preferences, progressMap, sortedTopics, streakState, triggerCelebration],
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

  const openLearnScope = useCallback((bookId: string | null, chapterId: string | null) => {
    setSelectedBookId(bookId);
    setSelectedChapterId(chapterId);
    setFocusedLibraryTopicId(null);
    setCurrentTopicIndex(0);
    setActiveTab('learn');
    setIsMenuOpen(false);
    requestAnimationFrame(() => {
      topicFeedRef.current?.scrollToOffset({ animated: false, offset: 0 });
    });
  }, []);

  const openLibraryForTopic = useCallback((topic: Topic) => {
    setSelectedBookId(topic.bookId);
    setSelectedChapterId(topic.chapterId);
    setFocusedLibraryTopicId(topic.id);
    setActiveTab('library');
    setIsMenuOpen(false);
  }, []);

  const closeExpandedTopic = useCallback(() => {
    if (expandedTopic) {
      void markTopicReadIfNeeded(expandedTopic.id);
    }

    setExpandedTopic(null);
  }, [expandedTopic, markTopicReadIfNeeded]);

  const switchTab = useCallback(
    (tab: FeedTab) => {
      if (tab === 'learn') {
        openLearnScope(null, null);
        return;
      }

      setActiveTab(tab);
      setIsMenuOpen(false);
    },
    [openLearnScope],
  );

  if (!isHydrated) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />
        <View style={styles.loadingScreen}>
          <Text style={styles.loadingTitle}>Design Shorts</Text>
          <Text style={styles.loadingText}>Preparing your HLD feed...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.appShell}>
        {isMenuOpen ? <Pressable style={styles.menuBackdrop} onPress={() => setIsMenuOpen(false)} /> : null}
        <View style={[styles.header, { paddingTop: headerTopPadding }]}>
          <View style={styles.headerBrand}>
            <View style={styles.logoMark}>
              <View style={[styles.logoSheet, styles.logoSheetBack]} />
              <View style={[styles.logoSheet, styles.logoSheetMiddle]} />
              <View style={[styles.logoSheet, styles.logoSheetFront]}>
                <View style={styles.logoRule} />
                <View style={styles.logoLineShort} />
                <View style={styles.logoLineLong} />
                <View style={styles.logoSignal} />
              </View>
            </View>
            <Text style={styles.headerTitle}>Design Shorts</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={() => setIsMenuOpen((value) => !value)} style={styles.menuButton}>
              <Text style={styles.menuButtonText}>Menu</Text>
            </Pressable>
            {isMenuOpen ? (
              <View style={styles.menuPanel}>
                {([
                  ['learn', 'Learn'],
                  ['library', 'Library'],
                  ['news', 'News'],
                  ['settings', 'Settings'],
                ] as const).map(([tab, label]) => (
                  <Pressable key={tab} onPress={() => switchTab(tab)} style={styles.menuItem}>
                    <Text style={[styles.menuItemText, menuActiveTab === tab && styles.menuItemTextActive]}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.content}>
          {activeTab === 'learn' ? (
            <View style={styles.feedWrapper}>
              <View style={styles.learnProgressInline}>
                <Text numberOfLines={1} style={styles.learnProgressInlineText}>
                  {progressHeadline}
                </Text>
              </View>
              <FlatList
                ref={topicFeedRef}
                data={activeTopics}
                key={learnFeedKey}
                extraData={learnFeedKey}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToAlignment="start"
                decelerationRate="fast"
                initialScrollIndex={preferences.feedMode === 'serial' && activeTopics.length > 0 ? serialStartIndex : 0}
                onMomentumScrollEnd={handleTopicSwipeEnd}
                getItemLayout={(_, index) => ({ index, length: width, offset: width * index })}
                renderItem={({ item }) => (
                  <TopicCard
                    topic={item}
                    height={feedHeight}
                    width={width}
                    onExpand={() => setExpandedTopic(item)}
                    onOpenLibrary={() => openLibraryForTopic(item)}
                  />
                )}
                keyExtractor={(item) => item.id}
              />
            </View>
          ) : null}

          {activeTab === 'library' ? (
            <LibraryView
              books={topicFeed.books}
              topics={sortedTopics}
              progressMap={progressMap}
              selectedBookId={selectedBookId}
              selectedChapterId={selectedChapterId}
              focusedTopicId={focusedLibraryTopicId}
              onSelectAll={() => openLearnScope(null, null)}
              onSelectBook={(bookId) => openLearnScope(bookId, null)}
              onSelectChapter={(bookId, chapterId) => openLearnScope(bookId, chapterId)}
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
                renderItem={({ item }) => <NewsCardView story={item} height={feedHeight} width={width} />}
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
                onChangeReminderCadence={(cadence) => void persistReminderCadence(cadence)}
                onChangeCelebrationSound={(enabled) => void persistCelebrationSoundEnabled(enabled)}
                readCount={summary.readCount}
                totalCount={summary.totalCount}
                currentStreak={streakState.currentStreak}
                longestStreak={streakState.longestStreak}
                completedChapters={chapterProgressSummary.completedChapters}
                totalChapters={chapterProgressSummary.totalChapters}
                completedBooks={bookProgressSummary.completedBooks}
                totalBooks={bookProgressSummary.totalBooks}
                onRefreshNews={() => void refreshDigest()}
                isRefreshingNews={isRefreshingNews}
                newsTimestamp={newsDigest.generatedAt}
                contentSyncMetadata={contentSyncMetadata}
                onRefreshContent={() => void refreshContent(true)}
                isRefreshingContent={isRefreshingContent}
              />
            </View>
          ) : null}
        </View>
      </View>
      <CelebrationToast celebration={celebration} />
      <ArticleModal topic={expandedTopic} visible={expandedTopic !== null} onClose={closeExpandedTopic} />
    </SafeAreaView>
  );
}

function RootApp() {
  const [interFontsLoaded] = useInterFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [playfairFontsLoaded] = usePlayfairFonts({
    PlayfairDisplay_700Bold,
  });

  if (!interFontsLoaded || !playfairFontsLoaded) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <StatusBar style="light" />
          <View style={styles.loadingScreen}>
            <Text style={[styles.loadingTitle, { fontFamily: FONT_SERIF }]}>Design Shorts</Text>
            <Text style={styles.loadingText}>Loading typography...</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

export default RootApp;
