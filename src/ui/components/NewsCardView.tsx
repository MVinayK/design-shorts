import { useCallback } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { formatFeedDate } from '../../lib/format';
import type { NewsCard } from '../../types';
import { styles } from '../appStyles';

type NewsCardViewProps = {
  story: NewsCard;
  height: number;
  width: number;
};

export function NewsCardView({ story, height, width }: NewsCardViewProps) {
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
