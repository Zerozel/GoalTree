import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeContext';
import { NodeWithChildren } from '@/src/data/types';
import { ProgressBar } from './ProgressBar';
import { categoryLabel } from '@/src/data/categories';
import { relativeDeadline } from '@/src/utils/date';
import { ChevronRight, Calendar, CircleCheck, Circle } from 'lucide-react-native';

interface Props {
  goal: NodeWithChildren;
  onPress: () => void;
}

export function GoalCard({ goal, onPress }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const remaining = goal.totalCount - goal.completedCount;
  const deadlineText = relativeDeadline(goal.deadline, goal.status === 'completed');
  const isOverdue = goal.isOverdue;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
    >
      <View style={styles.header}>
        <View style={[styles.categoryTag, { backgroundColor: c.primaryLight }]}>
          <Text style={[styles.categoryText, { color: c.primaryDark ?? c.primary }]}>{categoryLabel(goal.category)}</Text>
        </View>
        {deadlineText && (
          <View style={[styles.deadline, { backgroundColor: isOverdue ? c.error + '20' : c.surfaceAlt }]}>
            <Calendar size={12} color={isOverdue ? c.error : c.textSecondary} />
            <Text style={[styles.deadlineText, { color: isOverdue ? c.error : c.textSecondary }]}>{deadlineText}</Text>
          </View>
        )}
      </View>

      <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={2}>{goal.title}</Text>
      {goal.description ? (
        <Text style={[styles.desc, { color: c.textSecondary }]} numberOfLines={2}>{goal.description}</Text>
      ) : null}

      <View style={styles.progressRow}>
        <Text style={[styles.percent, { color: goal.progress >= 100 ? c.success : c.textPrimary }]}>
          {goal.progress}%
        </Text>
        <ProgressBar progress={goal.progress} style={styles.bar} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <CircleCheck size={14} color={c.success} />
          <Text style={[styles.statText, { color: c.textSecondary }]}>{goal.completedCount} done</Text>
        </View>
        <View style={styles.stat}>
          <Circle size={14} color={c.textMuted} />
          <Text style={[styles.statText, { color: c.textSecondary }]}>{remaining} left</Text>
        </View>
        <View style={[styles.chevron, { borderLeftColor: c.border }]}>
          <ChevronRight size={18} color={c.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deadline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  deadlineText: {
    fontSize: 11,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 24,
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  percent: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 42,
  },
  bar: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.2)',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 'auto',
  },
});
