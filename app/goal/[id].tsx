import { useState, useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeContext';
import { useStore } from '@/src/data/store';
import { findInTree, flattenTree } from '@/src/data/treeLogic';
import { ProgressBar } from '@/src/components/ProgressBar';
import { TreeNode } from '@/src/components/TreeNode';
import { NodeForm, NodeFormData } from '@/src/components/NodeForm';
import { NodeType, NodeWithChildren } from '@/src/data/types';
import { relativeDeadline } from '@/src/utils/date';
import {
  ChevronLeft,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Calendar,
  CircleCheck,
  Circle,
} from 'lucide-react-native';

export default function GoalTreeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tree, addNode, toggleComplete } = useStore();
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showAddChild, setShowAddChild] = useState<string | null>(null);
  const [showAddRoot, setShowAddRoot] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const rootGoal = useMemo(() => findInTree(tree, id), [tree, id]);

  const allNodes = useMemo(() => (rootGoal ? flattenTree([rootGoal]) : []), [rootGoal]);

  // Auto-expand all on first load
  const fullyExpanded = useMemo(() => {
    const ids = new Set<string>();
    for (const n of allNodes) ids.add(n.id);
    return ids;
  }, [allNodes]);

  const effectiveExpanded = expandedIds.size === 0 && allNodes.length > 0 ? fullyExpanded : expandedIds;

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allNodes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.notes.toLowerCase().includes(q),
    );
  }, [search, allNodes]);

  const handleToggle = useCallback((nid: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev.size === 0 ? fullyExpanded : prev);
      if (next.has(nid)) next.delete(nid);
      else next.add(nid);
      return next;
    });
  }, [fullyExpanded]);

  const handleSelect = useCallback((nid: string) => {
    router.push(`/node/${nid}`);
  }, [router]);

  const handleAddChild = useCallback((parentId: string) => {
    setShowAddChild(parentId);
  }, []);

  const handleToggleComplete = useCallback((nid: string) => {
    toggleComplete(nid);
  }, [toggleComplete]);

  const handleAddChildSubmit = useCallback(
    (data: NodeFormData) => {
      if (showAddChild) {
        addNode({
          parentId: showAddChild,
          type: data.type,
          title: data.title,
          description: data.description,
          notes: data.notes,
          deadline: data.deadline,
        });
        setExpandedIds((prev) => {
          const next = new Set(prev.size === 0 ? fullyExpanded : prev);
          next.add(showAddChild);
          return next;
        });
      }
    },
    [showAddChild, addNode, fullyExpanded],
  );

  const handleExpandAll = useCallback(() => setExpandedIds(fullyExpanded), [fullyExpanded]);
  const handleCollapseAll = useCallback(() => setExpandedIds(new Set([id])), [id]);

  if (!rootGoal) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color={c.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.textPrimary }]}>Goal not found</Text>
        </View>
      </View>
    );
  }

  const isComplete = rootGoal.progress >= 100;
  const dlText = relativeDeadline(rootGoal.deadline, isComplete);

  const parentForAdd = showAddChild ? allNodes.find((n) => n.id === showAddChild) : undefined;

  return (
    <View style={[styles.container, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={c.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: c.textPrimary }]} numberOfLines={1}>{rootGoal.title}</Text>
          <Text style={[styles.headerSubtitle, { color: c.textSecondary }]}>{rootGoal.progress}% · {rootGoal.completedCount}/{rootGoal.totalCount} tasks</Text>
        </View>
        <TouchableOpacity onPress={() => setSearchOpen(!searchOpen)} style={styles.backBtn}>
          <Search size={20} color={c.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      {searchOpen && (
        <View style={[styles.searchBar, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
          <Search size={16} color={c.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search in this tree..."
            placeholderTextColor={c.textMuted}
            style={[styles.searchInput, { color: c.textPrimary }]}
            autoFocus
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={[styles.searchClear, { color: c.primary }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Search results overlay */}
      {search.trim() && searchResults.length > 0 ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          <Text style={[styles.searchResultLabel, { color: c.textMuted }]}>{searchResults.length} results</Text>
          {searchResults.map((node) => (
            <SearchResultRow key={node.id} node={node} onSelect={handleSelect} themeColor={c} />
          ))}
        </ScrollView>
      ) : search.trim() && searchResults.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={[{ color: c.textMuted, fontSize: 14 }]}>No matches found</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }}>
          {/* Root summary card */}
          <View style={[styles.rootCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.rootTitle, { color: c.textPrimary }]}>{rootGoal.title}</Text>
            {rootGoal.description ? (
              <Text style={[styles.rootDesc, { color: c.textSecondary }]}>{rootGoal.description}</Text>
            ) : null}
            <View style={styles.rootStats}>
              <View style={styles.rootStatItem}>
                <TrendingUp size={14} color={isComplete ? c.success : c.primary} />
                <Text style={[styles.rootStatText, { color: c.textSecondary }]}>{rootGoal.progress}% complete</Text>
              </View>
              {dlText && (
                <View style={styles.rootStatItem}>
                  <Calendar size={14} color={rootGoal.isOverdue ? c.error : c.textSecondary} />
                  <Text style={[styles.rootStatText, { color: rootGoal.isOverdue ? c.error : c.textSecondary }]}>{dlText}</Text>
                </View>
              )}
            </View>
            <ProgressBar progress={rootGoal.progress} height={8} style={{ marginTop: 10 }} showComplete />
            <View style={[styles.rootStatRow, { borderTopColor: c.border }]}>
              <View style={styles.rootStatCol}>
                <CircleCheck size={14} color={c.success} />
                <Text style={[styles.rootStatSmall, { color: c.textSecondary }]}>{rootGoal.completedCount} done</Text>
              </View>
              <View style={styles.rootStatCol}>
                <Circle size={14} color={c.textMuted} />
                <Text style={[styles.rootStatSmall, { color: c.textSecondary }]}>{rootGoal.totalCount - rootGoal.completedCount} left</Text>
              </View>
              <View style={styles.rootStatCol}>
                <TouchableOpacity onPress={handleExpandAll}>
                  <Text style={[styles.expandLink, { color: c.primary }]}>Expand all</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.rootStatCol}>
                <TouchableOpacity onPress={handleCollapseAll}>
                  <Text style={[styles.expandLink, { color: c.primary }]}>Collapse</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Decomposition prompt if root has no children */}
          {rootGoal.children.length === 0 ? (
            <View style={[styles.promptCard, { backgroundColor: c.primaryLight, borderColor: c.primary }]}>
              <Text style={[styles.promptTitle, { color: c.textPrimary }]}>Break this goal down</Text>
              <Text style={[styles.promptText, { color: c.textSecondary }]}>
                What are the major milestones needed to achieve "{rootGoal.title}"? Add them now to start building your tree.
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddRoot(true)}
                style={[styles.promptBtn, { backgroundColor: c.primary }]}
              >
                <Plus size={18} color={c.textInverse} />
                <Text style={[styles.promptBtnText, { color: c.textInverse }]}>Add milestone</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Tree */}
          {rootGoal.children.length > 0 && (
            <View style={styles.treeContainer}>
              {rootGoal.children.map((child) => (
                <TreeNode
                  key={child.id}
                  node={child}
                  depth={0}
                  expandedIds={effectiveExpanded}
                  onToggle={handleToggle}
                  onSelect={handleSelect}
                  onAddChild={handleAddChild}
                  onToggleComplete={handleToggleComplete}
                />
              ))}
            </View>
          )}

          {/* Add root child button */}
          {rootGoal.children.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowAddRoot(true)}
              style={[styles.addChildBtn, { borderColor: c.border, backgroundColor: c.surface }]}
            >
              <Plus size={18} color={c.textMuted} />
              <Text style={[styles.addChildText, { color: c.textMuted }]}>Add to {rootGoal.title}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Add child modal */}
      <NodeForm
        visible={showAddChild !== null}
        onClose={() => setShowAddChild(null)}
        onSubmit={handleAddChildSubmit}
        parentId={showAddChild}
        parentTitle={parentForAdd?.title}
        allowTypeSelection={true}
        defaultType={suggestChildType(parentForAdd?.type)}
      />

      {/* Add root child modal */}
      <NodeForm
        visible={showAddRoot}
        onClose={() => setShowAddRoot(false)}
        onSubmit={handleAddChildSubmit}
        parentId={id}
        parentTitle={rootGoal.title}
        allowTypeSelection={true}
        defaultType="milestone"
      />
    </View>
  );
}

function suggestChildType(parentType?: NodeType): NodeType {
  switch (parentType) {
    case 'goal':
      return 'milestone';
    case 'milestone':
      return 'task';
    case 'task':
      return 'subtask';
    default:
      return 'task';
  }
}

function SearchResultRow({ node, onSelect, themeColor }: { node: NodeWithChildren; onSelect: (id: string) => void; themeColor: any }) {
  const c = themeColor;
  return (
    <TouchableOpacity
      onPress={() => onSelect(node.id)}
      style={[styles.resultRow, { backgroundColor: c.surface, borderColor: c.border }]}
    >
      <View style={[styles.resultDot, { backgroundColor: node.progress >= 100 ? c.success : c.primary }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.resultTitle, { color: c.textPrimary }]} numberOfLines={1}>{node.title}</Text>
        <Text style={[styles.resultMeta, { color: c.textMuted }]}>{node.type} · {node.progress}%</Text>
      </View>
      <ChevronRight size={16} color={c.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 4,
  },
  searchClear: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchResultLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  resultDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  resultMeta: {
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  rootCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  rootTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  rootDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  rootStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  rootStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rootStatText: {
    fontSize: 13,
    fontWeight: '500',
  },
  rootStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rootStatCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rootStatSmall: {
    fontSize: 12,
    fontWeight: '500',
  },
  expandLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  promptCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  promptText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  promptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  promptBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  treeContainer: {
    paddingBottom: 16,
  },
  addChildBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
  },
  addChildText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
