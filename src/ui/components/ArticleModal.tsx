import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getBookLabel, getChapterLabel } from '../../lib/topicPresentation';
import type { Topic } from '../../types';
import { styles } from '../appStyles';

type ArticleModalProps = {
  topic: Topic | null;
  visible: boolean;
  onClose: () => void;
};

export function ArticleModal({ topic, visible, onClose }: ArticleModalProps) {
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
