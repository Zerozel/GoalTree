import { useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeContext';
import { useStore } from '@/src/data/store';
import { flattenTree, findInTree } from '@/src/data/treeLogic';
import { NodeWithChildren } from '@/src/data/types';
import { relativeDeadline } from '@/src/utils/date';
import { EmptyState } from '@/src/components/EmptyState';
import { CircleCheck, Circle, CalendarCheck, ChevronRight, AlertCircle, Clock, Zap } from 'lucide-react-native';

interface TaskItem {
  node: NodeWithChildren;
  rootGoalId: string;
  rootGoalTitle: string;
}

export default function TodayScreen() {
  const { tree, toggleComplete } = useStore();
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { overdue, dueToday, inProgress } = useMemo(() => {
    const allTasks: TaskItem[] = [];
    for (const root of tree) {
      const flat = flattenTree([root]);
      for (const n of flat) {
        if (n.type === 'goal') continue;
        // Only leaf nodes or nodes with deadlines that need attention
        if (n.status === 'completed') continue;
        const needsAttention = n.isOverdue || n.isDueToday || (n.status === 'in_progress' && n.children.length === 0);
        if (needsAttention) {
          allTasks.push({ node: n, rootGoalId: root.id, rootGoalTitle: root.title });
        }
      }
    }
    return {
      overdue: allTasks.filter((t) => t.node.isOverdue),
      dueToday: allTasks.filter((t) => t.node.isDueToday && !t.node.isOverdue),
      inProgress: allTasks.filter((t) => t.node.status === 'in_progress' && !t.node.isOverdue && !t.node.isDueToday),
    };
  }, [tree]);

  const total = overdue.length + dueToday.length + inProgress.length;

  const handleToggle = useCallback((id: string) => toggleComplete(id), [toggleComplete]);
  const handleOpen = useCallback((id: string) => router.push(`/node/${id}`), [router]);

  const renderTask = (item: TaskItem) => {
    const n = item.node;
    const isOverdue = n.isOverdue;
    const isDueToday = n.isDueToday;
    const isComplete = n.status === 'completed';
    const dlText = relativeDeadline(n.deadline, isComplete);

    return (
      <TouchableOpacity
        onPress={() => handleOpen(n.id)}
        activeOpacity={0.7}
        style={[styles.taskCard, { backgroundColor: c.surface, borderColor: isOverdue ? c.error + '40' : c.border }]}
      >
        <TouchableOpacity
          onPress={() => handleToggle(n.id)}
          style={styles.taskCheck}
        >
          {isComplete ? (
            <CircleCheck size={24} color={c.success} />
          ) : (
            <Circle size={24} color={isOverdue ? c.error : c.textMuted} />
          )}
        </TouchableOpacity>
        <View style={styles.taskContent}>
          <Text
            style={[
              styles.taskTitle,
              { color: isComplete ? c.textMuted : c.textPrimary },
              isComplete && styles.taskComplete,
            ]}
            numberOfLines={2}
          >
            {n.title}
          </Text>
          <View style={styles.taskMeta}>
            <Text style={[styles.taskRoot, { color: c.textMuted }]} numberOfLines={1}>
              {item.rootGoalTitle}
            </Text>
            {dlText && (
              <View style={[styles.taskBadge, { backgroundColor: isOverdue ? c.error + '20' : isDueToday ? c.warning + '20' : c.surfaceAlt }]}>
                <Text style={[styles.taskBadgeText, { color: isOverdue ? c.error : isDueToday ? c.warning : c.textSecondary }]}>
                  {dlText}
                </Text>
              </View>
            )}
          </View>
        </View>
        <ChevronRight size={16} color={c.textMuted} />
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, icon: any, iconColor: string, items: TaskItem[], emptyMsg: string) => {
    const Icon = icon;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon size={18} color={iconColor} />
          <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>{title}</Text>
          <View style={[styles.sectionCount, { backgroundColor: c.surfaceAlt }]}>
            <Text style={[styles.sectionCountText, { color: c.textSecondary }]}>{items.length}</Text>
          </View>
        </View>
        {items.length === 0 ? (
          <Text style={[styles.sectionEmpty, { color: c.textMuted }]}>{emptyMsg}</Text>
        ) : (
          items.map((item) => (
            <View key={item.node.id}>{renderTask(item)}</View>
          ))
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.headerTitle, { color: c.textPrimary }]}>Today</Text>
        <Text style={[styles.headerSubtitle, { color: c.textSecondary }]}>
          {total > 0 ? `${total} task${total === 1 ? '' : 's'} need attention` : 'Everything is on track'}
        </Text>
      </View>

      {total === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Nothing to do today"
          subtitle="No tasks are overdue, due today, or in progress. Enjoy your day or start a new goal."
        />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
          {renderSection('Overdue', AlertCircle, c.error, overdue, 'Nothing overdue. Great job staying on schedule.')}
          {renderSection('Due today', Clock, c.warning, dueToday, 'Nothing due today.')}
          {renderSection('In progress', Zap, c.primary, inProgress, 'No tasks in progress right now.')}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  sectionCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionEmpty: {
    fontSize: 13,
    lineHeight: 19,
    paddingVertical: 4,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  taskCheck: {
    padding: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  taskComplete: {
    textDecorationLine: 'line-through',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  taskRoot: {
    fontSize: 12,
    flex: 1,
  },
  taskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  taskBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
