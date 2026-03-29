import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
  getBookProgressSummary,
  getChapterProgressSummary,
  getTopicProgressSummary,
} from '../../lib/feed';
import { getChapterLabel } from '../../lib/topicPresentation';
import type { ContentBook, Topic, TopicStatus } from '../../types';
import { styles } from '../appStyles';

type LibraryViewProps = {
  books: ContentBook[];
  topics: Topic[];
  progressMap: Record<string, TopicStatus>;
  selectedBookId: string | null;
  selectedChapterId: string | null;
  focusedTopicId: string | null;
  onSelectAll: () => void;
  onSelectBook: (bookId: string) => void;
  onSelectChapter: (bookId: string, chapterId: string) => void;
};

export function LibraryView({
  books,
  topics,
  progressMap,
  selectedBookId,
  selectedChapterId,
  focusedTopicId,
  onSelectAll,
  onSelectBook,
  onSelectChapter,
}: LibraryViewProps) {
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
                    <View
                      key={chapter.id}
                      style={styles.chapterBlock}
                      onLayout={(event) => rememberChapterOffset(chapter.id, event)}
                    >
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
