import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/src/theme/ThemeContext';

interface Props {
  progress: number;
  height?: number;
  style?: ViewStyle;
  showComplete?: boolean;
}

export function ProgressBar({ progress, height = 6, style, showComplete }: Props) {
  const { theme } = useTheme();
  const clamped = Math.max(0, Math.min(100, progress));
  const isComplete = clamped >= 100;
  const color = isComplete ? theme.colors.success : theme.colors.primary;

  return (
    <View
      style={[
        styles.track,
        { height, backgroundColor: theme.colors.surfaceAlt, borderRadius: height / 2 },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            backgroundColor: color,
            borderRadius: height / 2,
          },
        ]}
      />
      {showComplete && isComplete && <View style={styles.shimmer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 4,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});
