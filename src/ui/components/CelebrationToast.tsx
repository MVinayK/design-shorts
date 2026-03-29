import { Text, View } from 'react-native';
import type { CelebrationState } from '../../lib/topicPresentation';
import { styles } from '../appStyles';

export function CelebrationToast({ celebration }: { celebration: CelebrationState | null }) {
  if (!celebration) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.celebrationOverlay}>
      <View style={[styles.celebrationCard, celebration.tone === 'chapter' && styles.celebrationCardChapter]}>
        <View style={[styles.celebrationIcon, celebration.tone === 'chapter' && styles.celebrationIconChapter]}>
          <Text style={styles.celebrationIconText}>{celebration.tone === 'chapter' ? '⚡' : '👍'}</Text>
        </View>
        <View style={styles.celebrationText}>
          <Text style={styles.celebrationTitle}>{celebration.title}</Text>
          <Text style={styles.celebrationBody}>{celebration.body}</Text>
        </View>
      </View>
    </View>
  );
}
