import { Text, View } from 'react-native';
import type { CelebrationState } from '../../lib/topicPresentation';
import { styles } from '../appStyles';

export function CelebrationToast({ celebration }: { celebration: CelebrationState | null }) {
  if (!celebration) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.celebrationOverlay}>
      <View style={[styles.celebrationToast, celebration.tone === 'chapter' && styles.celebrationToastChapter]}>
        <View style={[styles.celebrationToastIcon, celebration.tone === 'chapter' && styles.celebrationToastIconChapter]}>
          <Text style={styles.celebrationToastIconText}>👍</Text>
        </View>
        <View style={styles.celebrationText}>
          <Text style={styles.celebrationTitle}>{celebration.title}</Text>
          <Text numberOfLines={2} style={styles.celebrationBody}>
            {celebration.body}
          </Text>
        </View>
      </View>
    </View>
  );
}
