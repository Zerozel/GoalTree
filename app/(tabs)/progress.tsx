import { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { useTheme } from '@/src/theme/ThemeContext';
import { useStore } from '@/src/data/store';
import { flattenTree } from '@/src/data/treeLogic';
import { ProgressBar } from '@/src/components/ProgressBar';
import { EmptyState } from '@/src/components/EmptyState';
import { categoryLabel } from '@/src/data/categories';
import { NodeWithChildren } from '@/src/data/types';
import {
  Target,
  CircleCheck,
  Flame,
  TrendingUp,
  FolderTree,
  Trophy,
  BarChart3,
  LucideIcon,
} from 'lucide-react-native';

export default function ProgressScreen() {
  const { tree, nodes } = useStore();
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();

  const stats = useMemo(() => {
    const all = flattenTree(tree);
    const leafNodes = all.filter((n) => n.children.length === 0);
    const activeGoals = tree.filter((g) => g.progress < 100);
    const completedGoals = tree.filter((g) => g.progress >= 100);
    const totalTasks = leafNodes.length;
    const totalCompleted = leafNodes.filter((n) => n.status === 'completed').length;
    const overallPct = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

    const completionDays = new Set<string>();
    for (const n of nodes) {
      if (n.status === 'completed' && n.completedAt) {
        completionDays.add(n.completedAt.split('T')[0]);
      }
    }
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cursor = new Date(today);
    while (completionDays.has(cursor.toISOString().split('T')[0])) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    const catMap = new Map<string, { total: number; completed: number }>();
    for (const root of tree) {
      const cat = root.category;
      const flat = flattenTree([root]);
      const leaves = flat.filter((n) => n.children.length === 0);
      const completed = leaves.filter((n) => n.status === 'completed').length;
      const prev = catMap.get(cat) ?? { total: 0, completed: 0 };
      catMap.set(cat, { total: prev.total + leaves.length, completed: prev.completed + completed });
    }
    const catStats = Array.from(catMap.entries())
      .map(([cat, data]) => ({
        category: cat as any,
        ...data,
        pct: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.pct - a.pct);

    return {
      totalGoals: tree.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      totalTasks,
      totalCompleted,
      overallPct,
      streak,
      catStats,
    };
  }, [tree, nodes]);

  return (
    <View style={[styles.container, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.headerTitle, { color: c.textPrimary }]}>Progress</Text>
        <Text style={[styles.headerSubtitle, { color: c.textSecondary }]}>Your journey at a glance</Text>
      </View>

      {tree.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No data yet"
          subtitle="Create goals and complete tasks to see your progress here."
        />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.heroCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <ProgressRing percent={stats.overallPct} color={c.primary} trackColor={c.surfaceAlt} />
            <View style={styles.heroInfo}>
              <Text style={[styles.heroLabel, { color: c.textSecondary }]}>Overall completion</Text>
              <Text style={[styles.heroPercent, { color: c.textPrimary }]}>{stats.overallPct}%</Text>
              <Text style={[styles.heroSub, { color: c.textMuted }]}>
                {stats.totalCompleted} of {stats.totalTasks} tasks done
              </Text>
            </View>
          </View>

          <View style={[styles.streakCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Flame size={24} color={stats.streak > 0 ? c.warning : c.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.streakNum, { color: c.textPrimary }]}>
                {stats.streak} day{stats.streak === 1 ? '' : 's'}
              </Text>
              <Text style={[styles.streakLabel, { color: c.textSecondary }]}>Current streak</Text>
            </View>
            <Text style={[styles.streakHint, { color: c.textMuted }]}>Complete a task daily to keep it going</Text>
          </View>

          <View style={styles.statGrid}>
            <StatBox icon={Target} label="Goals" value={stats.totalGoals} color={c.primary} themeColor={c} />
            <StatBox icon={FolderTree} label="Active" value={stats.activeGoals} color={c.secondary} themeColor={c} />
            <StatBox icon={Trophy} label="Completed" value={stats.completedGoals} color={c.success} themeColor={c} />
            <StatBox icon={CircleCheck} label="Tasks done" value={stats.totalCompleted} color={c.accent} themeColor={c} />
          </View>

          <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={16} color={c.textSecondary} />
              <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Goal Trees</Text>
            </View>
            {tree.map((goal) => (
              <View key={goal.id} style={[styles.treeVizRow, { borderBottomColor: c.border }]}>
                <View style={styles.treeVizHeader}>
                  <Text style={[styles.treeVizTitle, { color: c.textPrimary }]} numberOfLines={1}>
                    {goal.title}
                  </Text>
                  <Text style={[styles.treeVizPct, { color: goal.progress >= 100 ? c.success : c.textSecondary }]}>
                    {goal.progress}%
                  </Text>
                </View>
                <ProgressBar progress={goal.progress} height={8} showComplete style={{ marginTop: 8 }} />
                <View style={styles.treeVizLeaves}>{renderLeaves(goal, c)}</View>
              </View>
            ))}
          </View>

          {stats.catStats.length > 0 && (
            <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={styles.sectionHeader}>
                <BarChart3 size={16} color={c.textSecondary} />
                <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>By Category</Text>
              </View>
              {stats.catStats.map((cs) => (
                <View key={cs.category} style={styles.catRow}>
                  <Text style={[styles.catLabel, { color: c.textPrimary }]}>{categoryLabel(cs.category)}</Text>
                  <ProgressBar progress={cs.pct} height={6} style={{ flex: 1, marginHorizontal: 12 }} />
                  <Text style={[styles.catPct, { color: c.textSecondary }]}>{cs.pct}%</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function renderLeaves(node: NodeWithChildren, c: any, depth = 0): React.ReactNode {
  if (node.children.length === 0) {
    return (
      <View
        key={node.id}
        style={[
          styles.leafDot,
          {
            backgroundColor: node.status === 'completed' ? c.success : c.primary,
            marginLeft: depth * 10,
          },
        ]}
      />
    );
  }
  return (
    <View key={node.id} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginLeft: depth > 0 ? 10 : 0 }}>
      {node.children.map((child) => renderLeaves(child, c, depth + 1))}
    </View>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  color,
  themeColor,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
  themeColor: any;
}) {
  const c = themeColor;
  return (
    <View style={[styles.statBox, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Icon size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color: c.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.textMuted }]}>{label}</Text>
    </View>
  );
}

function ProgressRing({ percent, color, trackColor }: { percent: number; color: string; trackColor: string }) {
  const size = 110;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <SvgCircle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <SvgCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.ringInner}>
        <Text style={{ fontSize: 26, fontWeight: '800', color }}>{percent}%</Text>
      </View>
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
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  heroInfo: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  heroPercent: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 4,
  },
  heroSub: {
    fontSize: 13,
    marginTop: 4,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  streakNum: {
    fontSize: 20,
    fontWeight: '800',
  },
  streakLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  streakHint: {
    fontSize: 11,
    flex: 1,
    textAlign: 'right',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '47%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'flex-start',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  section: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  treeVizRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  treeVizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  treeVizTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  treeVizPct: {
    fontSize: 15,
    fontWeight: '700',
  },
  treeVizLeaves: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 10,
  },
  leafDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  catLabel: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 90,
  },
  catPct: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  ringInner: {
    position: 'absolute',
  },
});
