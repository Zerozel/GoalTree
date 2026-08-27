import { useState, useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeContext';
import { useStore } from '@/src/data/store';
import { NodeWithChildren } from '@/src/data/types';
import { GoalCard } from '@/src/components/GoalCard';
import { EmptyState } from '@/src/components/EmptyState';
import { NodeForm, NodeFormData } from '@/src/components/NodeForm';
import { Search, Plus, Target, SlidersHorizontal } from 'lucide-react-native';

type Filter = 'all' | 'active' | 'completed' | 'overdue' | 'due_today';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'due_today', label: 'Due today' },
];

export default function GoalsScreen() {
  const { tree, addNode } = useStore();
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [showCreate, setShowCreate] = useState(false);

  const rootGoals = tree;

  const filtered = useMemo(() => {
    let list = rootGoals;
    if (filter === 'active') list = list.filter((g) => g.progress < 100);
    else if (filter === 'completed') list = list.filter((g) => g.progress >= 100);
    else if (filter === 'overdue') list = list.filter((g) => g.isOverdue);
    else if (filter === 'due_today') list = list.filter((g) => g.isDueToday);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.notes.toLowerCase().includes(q),
      );
    }
    return list;
  }, [rootGoals, filter, search]);

  const handleCreate = useCallback(
    (data: NodeFormData) => {
      const id = addNode({
        parentId: null,
        type: data.type,
        title: data.title,
        description: data.description,
        notes: data.notes,
        category: data.category,
        deadline: data.deadline,
      });
      router.push(`/goal/${id}`);
    },
    [addNode, router],
  );

  const openGoal = (id: string) => router.push(`/goal/${id}`);

  return (
    <View style={[styles.container, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.appTitle, { color: c.textPrimary }]}>GoalTree</Text>
        <Text style={[styles.appSubtitle, { color: c.textSecondary }]}>
          {rootGoals.length} {rootGoals.length === 1 ? 'goal' : 'goals'}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
      <View style={[styles.searchBox, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Search size={18} color={c.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search goals, tasks, notes..."
            placeholderTextColor={c.textMuted}
            style={[styles.searchInput, { color: c.textPrimary }]}
          />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        <SlidersHorizontal size={14} color={c.textMuted} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                onPress={() => setFilter(f.value)}
                style={[
                  styles.filterChip,
                  { backgroundColor: active ? c.primary : c.surfaceAlt, borderColor: active ? c.primary : c.border },
                ]}
              >
                <Text style={[styles.filterText, { color: active ? c.textInverse : c.textSecondary }]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      {rootGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          subtitle="Create your first goal and break it down into milestones, tasks, and subtasks."
          action={
            <TouchableOpacity
              onPress={() => setShowCreate(true)}
              style={[styles.createBtn, { backgroundColor: c.primary }]}
            >
              <Plus size={20} color={c.textInverse} />
              <Text style={[styles.createBtnText, { color: c.textInverse }]}>New Goal</Text>
            </TouchableOpacity>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="No matches" subtitle="Try a different search or filter." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <GoalCard goal={item} onPress={() => openGoal(item.id)} />}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      {rootGoals.length > 0 && (
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          activeOpacity={0.85}
          style={[styles.fab, { backgroundColor: c.primary, bottom: insets.bottom + 16 }]}
        >
          <Plus size={24} color={c.textInverse} />
          <Text style={[styles.fabText, { color: c.textInverse }]}>New Goal</Text>
        </TouchableOpacity>
      )}

      <NodeForm
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        parentId={null}
        allowTypeSelection={false}
        defaultType="goal"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
