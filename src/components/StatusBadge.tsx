import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeContext';
import { NodeStatus, NodeType } from '@/src/data/types';

interface Props {
  status: NodeStatus;
  isOverdue?: boolean;
  type?: NodeType;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, isOverdue, type, size = 'sm' }: Props) {
  const { theme } = useTheme();
  const palette = theme.colors;

  let bg = palette.surfaceAlt;
  let fg = palette.textSecondary;
  let label = '';

  if (isOverdue && status !== 'completed') {
    bg = palette.error + '20';
    fg = palette.error;
    label = 'Overdue';
  } else if (status === 'completed') {
    bg = palette.success + '20';
    fg = palette.success;
    label = 'Completed';
  } else if (status === 'in_progress') {
    bg = palette.primary + '20';
    fg = palette.primary;
    label = 'In progress';
  } else {
    bg = palette.surfaceAlt;
    fg = palette.textMuted;
    label = 'Not started';
  }

  const fontSize = size === 'md' ? 13 : 11;
  const padH = size === 'md' ? 10 : 8;
  const padV = size === 'md' ? 5 : 3;

  return (
    <View style={[styles.badge, { backgroundColor: bg, paddingHorizontal: padH, paddingVertical: padV }]}>
      {type && <Text style={[styles.typeLabel, { color: palette.textMuted, fontSize: fontSize - 1 }]}>{typeLabel(type)}</Text>}
      <Text style={[styles.label, { color: fg, fontSize }]}>{label}</Text>
    </View>
  );
}

function typeLabel(type: NodeType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
  },
  typeLabel: {
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  label: {
    fontWeight: '600',
  },
});
