import { Pressable, ScrollView, Text, View } from 'react-native';
import type { Topic } from '../../types';
import { getBookLabel, getChapterLabel } from '../../lib/topicPresentation';
import { styles } from '../appStyles';

type TopicCardProps = {
  topic: Topic;
  height: number;
  width: number;
  onExpand: () => void;
  onOpenLibrary: () => void;
};

export function TopicCard({ topic, height, width, onExpand, onOpenLibrary }: TopicCardProps) {
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
