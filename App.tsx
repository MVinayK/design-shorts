import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold, useFonts as useInterFonts } from '@expo-google-fonts/inter';
import { PlayfairDisplay_700Bold, useFonts as usePlayfairFonts } from '@expo-google-fonts/playfair-display';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  FlatList,
  LayoutChangeEvent,
  Linking,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  getTopicStatus,
} from './src/lib/feed';
import { formatFeedDate, formatRelativeSyncTime } from './src/lib/format';
import { loadNewsDigest, refreshNewsDigest } from './src/lib/newsRepository';
import { DEFAULT_PREFERENCES, loadStoredState, markTopicRead, savePreferences } from './src/lib/storage';
import type { ContentBook, ContentSyncMetadata, FeedTab, NewsCard, Preferences, Topic, TopicFeed, TopicStatus } from './src/types';

const HEADER_CONTENT_HEIGHT = 56;
const HEADER_BOTTOM_GAP = 12;
const WEB_MOBILE_SAFE_TOP = 44;
const FONT_SERIF = 'PlayfairDisplay_700Bold';
const FONT_SANS = 'Inter_400Regular';
const FONT_SANS_SEMIBOLD = 'Inter_600SemiBold';
const FONT_SANS_BOLD = 'Inter_700Bold';

function getChapterLabel(chapterId: string) {
  const match = chapterId.match(/chapter-(\d+)/i);
  return match ? `Chapter ${Number.parseInt(match[1], 10)}` : chapterId.replace(/-/g, ' ');
}

function getBookLabel(bookId: string) {
  if (bookId === 'ddia') {
    return 'DDIA';
  }

  return bookId.toUpperCase();
}

function TopicCard({
  topic,
  height,
  width,
  onExpand,
  onOpenLibrary,
}: {
  topic: Topic;
  height: number;
  width: number;
  onExpand: () => void;
  onOpenLibrary: () => void;
}) {
  return (
    <View style={[styles.page, { height, width }]}>
      <View style={styles.card}>
        <ScrollView
          style={styles.cardScroll}
          contentContainerStyle={styles.cardScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topicMetaRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{topic.category}</Text>
            </View>
            <View style={styles.topicActionRow}>
              <Pressable onPress={onOpenLibrary} style={styles.scopeIconButton}>
                <View style={styles.scopeIconGlyph}>
                  <View style={styles.scopeIconLineShort} />
                  <View style={styles.scopeIconLineLong} />
                  <View style={styles.scopeIconLineShort} />
                </View>
              </Pressable>
              <Pressable onPress={onExpand} style={styles.iconButton}>
                <Text style={styles.iconButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.pageCountRow}>
            <Text style={styles.kickerText}>
              {getBookLabel(topic.bookId)} · {getChapterLabel(topic.chapterId)}
            </Text>
          </View>
          <Text style={styles.topicTitle}>{topic.title}</Text>
          <Text style={styles.topicSummary}>{topic.summaryShort}</Text>
          <View style={styles.pointList}>
            {topic.keyPoints.slice(0, 3).map((point) => (
              <View key={point} style={styles.pointRow}>
                <View style={styles.pointDot} />
                <Text style={styles.pointText}>{point}</Text>
              </View>
            ))}
          </View>
          <View style={styles.takeawayPreview}>
            <Text style={styles.takeawayPreviewLabel}>Why it matters</Text>
            <Text style={styles.takeawayPreviewText}>{topic.interviewTakeaway}</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function NewsCardView({
  story,
  height,
  width,
}: {
  story: NewsCard;
  height: number;
  width: number;
}) {
  const openStory = useCallback(() => {
    void Linking.openURL(story.sourceUrl);
  }, [story.sourceUrl]);

  return (
    <View style={[styles.page, { height, width }]}>
      <View style={[styles.card, styles.newsCard]}>
        <ScrollView
          style={styles.cardScroll}
          contentContainerStyle={styles.cardScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topicMetaRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Tech News</Text>
            </View>
            <Text style={styles.readTime}>{formatFeedDate(story.publishedAt)}</Text>
          </View>
          <View style={styles.pageCountRow}>
            <Text style={styles.kickerText}>Signal scan</Text>
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
        </ScrollView>
      </View>
    </View>
  );
}

function ArticleModal({
  topic,
  visible,
  onClose,
}: {
  topic: Topic | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!topic) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.articleSafeArea}>
        <View style={styles.articleHeader}>
          <View>
            <View style={styles.articleHeaderRule} />
            <Text style={styles.articleEyebrow}>
              {topic.category} · {getBookLabel(topic.bookId)} · {getChapterLabel(topic.chapterId)}
            </Text>
            <Text style={styles.articleTitle}>{topic.title}</Text>
          </View>
          <Pressable onPress={onClose} style={styles.iconButton}>
            <Text style={styles.iconButtonText}>×</Text>
          </Pressable>
        </View>
        <ScrollView
          style={styles.articleScroll}
          contentContainerStyle={styles.articleContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.articleLead}>{topic.summaryShort}</Text>
          {topic.articleSections.map((section) => (
            <Text key={section} style={styles.articleParagraph}>
              {section}
            </Text>
          ))}
          <View style={styles.articleCallout}>
            <Text style={styles.articleCalloutLabel}>Example</Text>
            <Text style={styles.articleCalloutText}>{topic.example}</Text>
          </View>
          <View style={styles.articleCallout}>
            <Text style={styles.articleCalloutLabel}>Interview takeaway</Text>
            <Text style={styles.articleCalloutText}>{topic.interviewTakeaway}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
  contentSyncMetadata,
  onRefreshContent,
  isRefreshingContent,
}: {
  preferences: Preferences;
  onChangeMode: (mode: Preferences['feedMode']) => void;
  readCount: number;
  totalCount: number;
  onRefreshNews: () => void;
  isRefreshingNews: boolean;
  newsTimestamp: string | null;
  contentSyncMetadata: ContentSyncMetadata;
  onRefreshContent: () => void;
  isRefreshingContent: boolean;
}) {
  return (
    <View style={styles.settingsContainer}>
      <Text style={styles.settingsTitle}>Study settings</Text>
      <Text style={styles.settingsBody}>
        Serial keeps chapter order. Random favors unread topics and occasionally revisits completed ones.
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
          {readCount} of {totalCount} topics read
        </Text>
        <Text style={styles.settingsHint}>Saved locally. Offline reading works by default.</Text>
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
    </View>
  );
}

function LibraryView({
  books,
  topics,
  progressMap,
  selectedBookId,
  selectedChapterId,
  focusedTopicId,
  onSelectAll,
  onSelectBook,
  onSelectChapter,
}: {
  books: ContentBook[];
  topics: Topic[];
  progressMap: Record<string, TopicStatus>;
  selectedBookId: string | null;
  selectedChapterId: string | null;
  focusedTopicId: string | null;
  onSelectAll: () => void;
  onSelectBook: (bookId: string) => void;
  onSelectChapter: (bookId: string, chapterId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const libraryScrollRef = useRef<ScrollView>(null);
  const topicOffsetsRef = useRef<Record<string, number>>({});
  const chapterOffsetsRef = useRef<Record<string, number>>({});

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredBooks = useMemo(() => {
    if (!normalizedQuery) {
      return books;
    }

    return books
      .map((book) => {
        const searchableBookText = `${book.title} ${book.author} ${book.description}`.toLowerCase();
        const matchingChapters = book.chapters.filter((chapter) => {
          const chapterLabel = getChapterLabel(chapter.id).toLowerCase();
          const searchableChapterText = `${chapter.title} ${chapterLabel}`.toLowerCase();
          return searchableChapterText.includes(normalizedQuery);
        });

        if (searchableBookText.includes(normalizedQuery)) {
          return book;
        }

        if (matchingChapters.length === 0) {
          return null;
        }

        return {
          ...book,
          chapters: matchingChapters,
        };
      })
      .filter((book): book is ContentBook => book !== null);
  }, [books, normalizedQuery]);

  const scrollToFocusedTopic = useCallback(() => {
    if (!focusedTopicId) {
      return;
    }

    const targetOffset = topicOffsetsRef.current[focusedTopicId];
    if (typeof targetOffset === 'number') {
      libraryScrollRef.current?.scrollTo({
        y: Math.max(targetOffset - 140, 0),
        animated: true,
      });
    }
  }, [focusedTopicId]);

  useEffect(() => {
    const timer = setTimeout(scrollToFocusedTopic, 60);
    return () => clearTimeout(timer);
  }, [scrollToFocusedTopic, selectedBookId, selectedChapterId]);

  const rememberChapterOffset = useCallback((chapterId: string, event: LayoutChangeEvent) => {
    chapterOffsetsRef.current[chapterId] = event.nativeEvent.layout.y;
  }, []);

  const rememberTopicOffset = useCallback(
    (topicId: string, chapterId: string, event: LayoutChangeEvent) => {
      const chapterOffset = chapterOffsetsRef.current[chapterId] ?? 0;
      topicOffsetsRef.current[topicId] = chapterOffset + event.nativeEvent.layout.y;

      if (focusedTopicId === topicId) {
        scrollToFocusedTopic();
      }
    },
    [focusedTopicId, scrollToFocusedTopic],
  );

  return (
    <ScrollView
      ref={libraryScrollRef}
      style={styles.feedWrapper}
      contentContainerStyle={styles.libraryContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.settingsTitle}>Library</Text>
      <Text style={styles.settingsBody}>
        Move through DDIA by chapter when you want deliberate study, then jump back into the swipe feed from that scope.
      </Text>
      <View style={styles.librarySearchShell}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Find a book or chapter"
          placeholderTextColor="#88a0bf"
          style={styles.librarySearchInput}
        />
      </View>
      <Pressable
        onPress={onSelectAll}
        style={[styles.libraryOverviewCard, !selectedBookId && styles.libraryOverviewCardActive]}
      >
        <Text style={styles.settingsCardTitle}>All books</Text>
        <Text style={styles.settingsCardValue}>
          {getTopicProgressSummary(topics, progressMap).readCount} of {topics.length} topics read
        </Text>
        <Text style={styles.settingsHint}>Use the complete feed when you want broad repetition across the whole library.</Text>
      </Pressable>

      {filteredBooks.map((book) => {
        const bookProgress = getBookProgressSummary(book, topics, progressMap);
        const isBookSelected = selectedBookId === book.id && selectedChapterId === null;

        return (
          <View key={book.id} style={styles.libraryBookCard}>
            <View style={styles.libraryBookHeader}>
              <View style={styles.libraryBookText}>
                <Text style={styles.libraryBookTitle}>{book.title}</Text>
                <Text style={styles.libraryBookMeta}>
                  {book.author} · {bookProgress.readCount}/{bookProgress.totalCount} topics
                </Text>
              </View>
              <Pressable
                onPress={() => onSelectBook(book.id)}
                style={[styles.librarySelectButton, isBookSelected && styles.librarySelectButtonActive]}
              >
                <Text style={[styles.librarySelectButtonText, isBookSelected && styles.librarySelectButtonTextActive]}>
                  Continue
                </Text>
              </Pressable>
            </View>

            <Text style={styles.libraryBookBody}>{book.description}</Text>

            <View style={styles.chapterList}>
              {book.chapters
                .slice()
                .sort((left, right) => left.orderIndex - right.orderIndex)
                .map((chapter) => {
                  const chapterProgress = getChapterProgressSummary(chapter, topics, progressMap);
                  const isSelected = selectedBookId === book.id && selectedChapterId === chapter.id;
                  const chapterTopics = topics
                    .filter((topic) => topic.bookId === book.id && topic.chapterId === chapter.id)
                    .sort((left, right) => left.orderIndex - right.orderIndex);

                  return (
                    <View key={chapter.id} style={styles.chapterBlock} onLayout={(event) => rememberChapterOffset(chapter.id, event)}>
                      <Pressable
                        onPress={() => onSelectChapter(book.id, chapter.id)}
                        style={[styles.chapterRow, isSelected && styles.chapterRowActive]}
                      >
                        <View style={styles.chapterNumber}>
                          <Text style={styles.chapterNumberText}>{chapter.orderIndex}</Text>
                        </View>
                        <View style={styles.chapterText}>
                          <Text style={styles.chapterTitle}>{chapter.title}</Text>
                          <Text style={styles.chapterMeta}>
                            {chapterProgress.readCount}/{chapterProgress.totalCount} topics read
                          </Text>
                        </View>
                        <Text style={styles.chapterJumpText}>Open</Text>
                      </Pressable>
                      {isSelected ? (
                        <View style={styles.chapterTopicList}>
                          {chapterTopics.map((topic) => {
                            const isFocusedTopic = focusedTopicId === topic.id;
                            return (
                              <View
                                key={topic.id}
                                onLayout={(event) => rememberTopicOffset(topic.id, chapter.id, event)}
                                style={[styles.chapterTopicRow, isFocusedTopic && styles.chapterTopicRowFocused]}
                              >
                                <Text
                                  style={[
                                    styles.chapterTopicTitle,
                                    isFocusedTopic && styles.chapterTopicTitleFocused,
                                  ]}
                                >
                                  {topic.title}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
            </View>
          </View>
        );
      })}
      {filteredBooks.length === 0 ? (
        <View style={styles.libraryEmptyState}>
          <Text style={styles.settingsCardTitle}>No matches</Text>
          <Text style={styles.settingsHint}>Try a chapter number, a title word, or the book name.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const topSafeInset = insets.top > 0 ? insets.top : Platform.OS === 'web' && width <= 430 ? WEB_MOBILE_SAFE_TOP : 0;
  const headerTopPadding = topSafeInset + 12;
  const feedHeight = Math.max(height - headerTopPadding - HEADER_CONTENT_HEIGHT - HEADER_BOTTOM_GAP, 320);
  const topicFeedRef = useRef<FlatList<Topic>>(null);
  const newsFeedRef = useRef<FlatList<NewsCard>>(null);
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
  const [contentSyncMetadata, setContentSyncMetadata] = useState<ContentSyncMetadata>({
    catalogVersion: getBundledTopicFeed().catalog.version,
    lastAttemptedSyncAt: null,
    lastSuccessfulSyncAt: null,
    source: getBundledTopicFeed().source,
  });

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
              extraData={`${selectedBookId ?? 'all'}-${selectedChapterId ?? 'all'}`}
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
                  height={feedHeight}
                  width={width}
                  onExpand={() => setExpandedTopic(item)}
                  onOpenLibrary={() => openLibraryForTopic(item)}
                />
              )}
              keyExtractor={(item) => item.id}
            />
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
                renderItem={({ item }) => (
                  <NewsCardView
                    story={item}
                    height={feedHeight}
                    width={width}
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
                contentSyncMetadata={contentSyncMetadata}
                onRefreshContent={() => void refreshContent(true)}
                isRefreshingContent={isRefreshingContent}
              />
            </View>
          ) : null}
        </View>

      </View>
      <ArticleModal topic={expandedTopic} visible={expandedTopic !== null} onClose={() => setExpandedTopic(null)} />
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
            <Text style={styles.loadingTitle}>Design Shorts</Text>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fffdf9',
  },
  appShell: {
    flex: 1,
    backgroundColor: '#fffdf9',
  },
  header: {
    position: 'relative',
    zIndex: 50,
    paddingHorizontal: 20,
    paddingBottom: HEADER_BOTTOM_GAP,
    minHeight: HEADER_CONTENT_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#163f86',
    fontSize: 28,
    fontFamily: FONT_SERIF,
    letterSpacing: -0.4,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoMark: {
    width: 38,
    height: 34,
    position: 'relative',
  },
  logoSheet: {
    position: 'absolute',
    width: 24,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#1f55ab',
    backgroundColor: '#fffefc',
  },
  logoSheetBack: {
    left: 1,
    top: 4,
    opacity: 0.45,
    transform: [{ rotate: '-8deg' }],
  },
  logoSheetMiddle: {
    left: 8,
    top: 2,
    opacity: 0.72,
    transform: [{ rotate: '-2deg' }],
  },
  logoSheetFront: {
    left: 13,
    top: 0,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  logoRule: {
    width: 10,
    height: 2.5,
    borderRadius: 999,
    backgroundColor: '#1f55ab',
  },
  logoLineShort: {
    marginTop: 4,
    width: 8,
    height: 2,
    borderRadius: 999,
    backgroundColor: '#86a8dd',
  },
  logoLineLong: {
    marginTop: 3,
    width: 12,
    height: 2,
    borderRadius: 999,
    backgroundColor: '#86a8dd',
  },
  logoSignal: {
    position: 'absolute',
    right: -3,
    top: -3,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#e85b4f',
    borderWidth: 1.5,
    borderColor: '#fffdf9',
  },
  headerActions: {
    alignItems: 'flex-end',
    position: 'relative',
  },
  menuButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#f4f8ff',
    borderWidth: 1,
    borderColor: '#dce8fb',
  },
  menuButtonText: {
    color: '#2158b1',
    fontFamily: FONT_SANS_BOLD,
    fontSize: 13,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbfdff',
    borderWidth: 1,
    borderColor: '#dbe7fb',
  },
  iconButtonText: {
    color: '#2158b1',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '600',
  },
  topicActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scopeIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbfdff',
    borderWidth: 1,
    borderColor: '#dbe7fb',
  },
  scopeIconGlyph: {
    width: 14,
    gap: 3,
  },
  scopeIconLineShort: {
    width: 9,
    height: 2,
    borderRadius: 999,
    backgroundColor: '#2b61b7',
  },
  scopeIconLineLong: {
    width: 14,
    height: 2,
    borderRadius: 999,
    backgroundColor: '#e85b4f',
  },
  menuPanel: {
    position: 'absolute',
    top: 58,
    right: 0,
    minWidth: 148,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#fffefc',
    borderWidth: 1,
    borderColor: '#e2eaf8',
    shadowColor: '#2b5fad',
    shadowOpacity: 0.08,
    shadowRadius: 18,
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
  },
  cardScroll: {
    flex: 1,
  },
  cardScrollContent: {
    paddingBottom: 10,
  },
  newsCard: {
    backgroundColor: '#fffdf9',
  },
  topicMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#eef5ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: '#2b61b7',
    fontSize: 11,
    fontFamily: FONT_SANS_BOLD,
  },
  readTime: {
    color: '#6b86ad',
    fontSize: 12,
    fontFamily: FONT_SANS,
  },
  pageCountRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kickerText: {
    color: '#cf5a47',
    fontSize: 11,
    fontFamily: FONT_SANS_BOLD,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  topicTitle: {
    marginTop: 8,
    color: '#173f7b',
    fontSize: 20,
    lineHeight: 26,
    fontFamily: FONT_SERIF,
    letterSpacing: -0.3,
  },
  topicSummary: {
    marginTop: 10,
    color: '#476486',
    fontSize: 16,
    lineHeight: 25,
    fontFamily: FONT_SANS,
  },
  pointList: {
    marginTop: 16,
    gap: 10,
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
    backgroundColor: '#e85b4f',
  },
  pointText: {
    flex: 1,
    color: '#58718f',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FONT_SANS,
  },
  takeawayPreview: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#e8eef8',
    gap: 8,
  },
  takeawayPreviewLabel: {
    color: '#cf5a47',
    fontSize: 11,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    fontFamily: FONT_SANS_BOLD,
  },
  takeawayPreviewText: {
    color: '#516d8f',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FONT_SANS,
  },
  primaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 15,
    backgroundColor: '#2b61b7',
    borderRadius: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: FONT_SANS_BOLD,
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
    backgroundColor: '#f3f7ff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  tagText: {
    color: '#2c60b1',
    fontSize: 12,
    fontFamily: FONT_SANS_SEMIBOLD,
  },
  sourcePanel: {
    marginTop: 22,
    padding: 16,
    backgroundColor: '#f7faff',
    borderRadius: 0,
    borderLeftWidth: 3,
    borderLeftColor: '#2d66c2',
  },
  sourceLabel: {
    color: '#6883a8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: FONT_SANS_BOLD,
  },
  sourceName: {
    marginTop: 8,
    color: '#193f79',
    fontSize: 16,
    fontFamily: FONT_SANS_SEMIBOLD,
  },
  settingsContainer: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 16,
  },
  libraryContainer: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 16,
  },
  librarySearchShell: {
    borderWidth: 1,
    borderColor: '#e1eaf8',
    backgroundColor: '#fffefc',
    paddingHorizontal: 14,
  },
  librarySearchInput: {
    height: 48,
    color: '#173f7b',
    fontSize: 15,
    fontFamily: FONT_SANS,
  },
  libraryOverviewCard: {
    padding: 18,
    borderRadius: 0,
    backgroundColor: '#fffefc',
    borderWidth: 1,
    borderColor: '#e1eaf8',
    gap: 10,
  },
  libraryOverviewCardActive: {
    borderColor: '#2d66c2',
    backgroundColor: '#f8fbff',
  },
  libraryBookCard: {
    padding: 18,
    borderRadius: 0,
    backgroundColor: '#fffefc',
    borderWidth: 1,
    borderColor: '#e1eaf8',
    gap: 14,
  },
  libraryBookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  libraryBookText: {
    flex: 1,
    gap: 6,
  },
  libraryBookTitle: {
    color: '#173f7b',
    fontSize: 22,
    lineHeight: 28,
    fontFamily: FONT_SERIF,
  },
  libraryBookMeta: {
    color: '#6a809f',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FONT_SANS,
  },
  libraryBookBody: {
    color: '#58718f',
    fontSize: 15,
    lineHeight: 23,
    fontFamily: FONT_SANS,
  },
  librarySelectButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#f4f8ff',
    borderWidth: 1,
    borderColor: '#dce8fb',
  },
  librarySelectButtonActive: {
    backgroundColor: '#2d66c2',
    borderColor: '#2d66c2',
  },
  librarySelectButtonText: {
    color: '#2158b1',
    fontSize: 13,
    fontFamily: FONT_SANS_BOLD,
  },
  librarySelectButtonTextActive: {
    color: '#ffffff',
  },
  chapterList: {
    gap: 10,
  },
  chapterBlock: {
    gap: 8,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e6edf8',
    backgroundColor: '#fffdf9',
  },
  chapterRowActive: {
    borderColor: '#2d66c2',
    backgroundColor: '#f7faff',
  },
  chapterNumber: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#eef5ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterNumberText: {
    color: '#2b61b7',
    fontSize: 13,
    fontFamily: FONT_SANS_BOLD,
  },
  chapterText: {
    flex: 1,
    gap: 4,
  },
  chapterJumpText: {
    color: '#2158b1',
    fontSize: 13,
    fontFamily: FONT_SANS_BOLD,
  },
  chapterTopicList: {
    marginLeft: 40,
    gap: 8,
  },
  chapterTopicRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#e3eaf7',
    backgroundColor: '#fffdf9',
  },
  chapterTopicRowFocused: {
    borderLeftColor: '#e85b4f',
    backgroundColor: '#fff7f4',
  },
  chapterTopicTitle: {
    color: '#58718f',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONT_SANS,
  },
  chapterTopicTitleFocused: {
    color: '#173f7b',
    fontFamily: FONT_SANS_SEMIBOLD,
  },
  chapterTitle: {
    color: '#173f7b',
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FONT_SANS_SEMIBOLD,
  },
  chapterMeta: {
    color: '#6a809f',
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FONT_SANS,
  },
  libraryEmptyState: {
    padding: 18,
    borderWidth: 1,
    borderColor: '#e1eaf8',
    backgroundColor: '#fffefc',
    gap: 8,
  },
  settingsTitle: {
    color: '#173f7b',
    fontSize: 28,
    fontFamily: FONT_SERIF,
    marginTop: 6,
  },
  settingsBody: {
    color: '#58718f',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONT_SANS,
  },
  segmentedControl: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#f7faff',
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#2d66c2',
  },
  segmentButtonText: {
    color: '#6883a8',
    fontFamily: FONT_SANS_BOLD,
  },
  segmentButtonTextActive: {
    color: '#ffffff',
  },
  settingsCard: {
    padding: 18,
    borderRadius: 0,
    backgroundColor: '#fffefc',
    borderWidth: 1,
    borderColor: '#e1eaf8',
    gap: 10,
  },
  settingsCardTitle: {
    color: '#6b86ad',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: FONT_SANS_BOLD,
  },
  settingsCardValue: {
    color: '#173f7b',
    fontSize: 22,
    fontFamily: FONT_SANS_SEMIBOLD,
  },
  settingsHint: {
    color: '#6a809f',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: FONT_SANS,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fffdf9',
  },
  loadingTitle: {
    color: '#173f7b',
    fontSize: 28,
    fontFamily: FONT_SERIF,
  },
  loadingText: {
    color: '#6a809f',
    fontSize: 15,
    fontFamily: FONT_SANS,
  },
  errorText: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 18,
    color: '#cf4339',
    textAlign: 'center',
  },
  articleSafeArea: {
    flex: 1,
    backgroundColor: '#fffdf9',
  },
  articleHeader: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e7edf8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  articleHeaderRule: {
    width: 54,
    height: 3,
    backgroundColor: '#2d66c2',
    marginBottom: 14,
  },
  articleEyebrow: {
    color: '#cf5a47',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: FONT_SANS_BOLD,
  },
  articleTitle: {
    marginTop: 6,
    color: '#173f7b',
    fontSize: 31,
    lineHeight: 37,
    maxWidth: 280,
    fontFamily: FONT_SERIF,
    letterSpacing: -0.5,
  },
  articleScroll: {
    flex: 1,
  },
  articleContent: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 36,
    gap: 18,
  },
  articleLead: {
    color: '#2a4f84',
    fontSize: 20,
    lineHeight: 31,
    fontFamily: FONT_SERIF,
  },
  articleParagraph: {
    color: '#586f8c',
    fontSize: 17,
    lineHeight: 30,
    fontFamily: FONT_SANS,
  },
  articleCallout: {
    padding: 18,
    backgroundColor: '#fbfcfe',
    borderLeftWidth: 4,
    borderLeftColor: '#e85b4f',
  },
  articleCalloutLabel: {
    color: '#cf5a47',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  articleCalloutText: {
    marginTop: 10,
    color: '#54708f',
    fontSize: 16,
    lineHeight: 26,
    fontFamily: FONT_SANS,
  },
});
