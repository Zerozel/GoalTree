import { useState, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeContext';
import { useStore } from '@/src/data/store';
import { NodeForm, NodeFormData } from '@/src/components/NodeForm';
import { ProgressBar } from '@/src/components/ProgressBar';
import { StatusBadge } from '@/src/components/StatusBadge';
import { categoryLabel } from '@/src/data/categories';
import { formatDate, relativeDeadline } from '@/src/utils/date';
import { getStatusLabel, deadlineState } from '@/src/data/treeLogic';
import { NodeType } from '@/src/data/types';
import {
  ChevronLeft,
  Pencil,
  Trash2,
  CircleCheck,
  Circle,
  Plus,
  ChevronRight,
  Calendar,
  FileText,
  Clock,
  Link2,
  AlertTriangle,
} from 'lucide-react-native';

export default function NodeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getNode, getParent, getChildren, updateNode, deleteNode, toggleComplete, addNode, nodes } = useStore();
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [showEdit, setShowEdit] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);

  const node = useMemo(() => getNode(id), [getNode, id, nodes]);
  const parent = useMemo(() => (node ? getParent(node.id) : undefined), [getParent, node, nodes]);
  const children = useMemo(() => (node ? getChildren(node.id) : []), [getChildren, node, nodes]);

  if (!node) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color={c.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.textPrimary }]}>Not found</Text>
        </View>
      </View>
    );
  }

  const isComplete = node.status === 'completed';
  const dlText = relativeDeadline(node.deadline, isComplete);
  const isOverdue = deadlineState(node.deadline, node.status).isOverdue;

  function handleEdit(data: NodeFormData) {
    updateNode(id, {
      type: data.type,
      title: data.title,
      description: data.description,
      notes: data.notes,
      category: data.category,
      deadline: data.deadline,
    });
  }

  function handleDelete() {
    Alert.alert(
      'Delete this ' + node!.type + '?',
      'This will permanently delete this item and all of its children. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteNode(id);
            router.back();
          },
        },
      ],
    );
  }

  function handleAddChild(data: NodeFormData) {
    addNode({
      parentId: id,
      type: data.type,
      title: data.title,
      description: data.description,
      notes: data.notes,
      deadline: data.deadline,
    });
  }

  function suggestChildType(parentType?: NodeType): NodeType {
    switch (parentType) {
      case 'goal': return 'milestone';
      case 'milestone': return 'task';
      case 'task': return 'subtask';
      default: return 'task';
    }
  }

  const childCount = children.length;

  return (
    <View style={[styles.container, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={c.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowEdit(true)} style={styles.backBtn}>
            <Pencil size={20} color={c.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.backBtn}>
            <Trash2 size={20} color={c.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Title + status */}
        <View style={[styles.titleCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.typeLabel, { color: c.textMuted }]}>{node.type}</Text>
            <StatusBadge status={node.status} isOverdue={isOverdue} size="md" />
          </View>
          <Text style={[styles.title, { color: c.textPrimary }]}>{node.title}</Text>
          {node.description ? (
            <Text style={[styles.description, { color: c.textSecondary }]}>{node.description}</Text>
          ) : null}

          <View style={[styles.completeRow, { borderTopColor: c.border }]}>
            <TouchableOpacity
              onPress={() => toggleComplete(id)}
              style={[
                styles.completeBtn,
                { backgroundColor: isComplete ? c.success + '20' : c.primary + '20' },
              ]}
            >
              {isComplete ? (
                <CircleCheck size={20} color={c.success} />
              ) : (
                <Circle size={20} color={c.primary} />
              )}
              <Text style={[styles.completeText, { color: isComplete ? c.success : c.primary }]}>
                {isComplete ? 'Completed' : 'Mark complete'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress */}
        {childCount > 0 && (
          <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Progress</Text>
            <View style={styles.progressRow}>
              <ProgressBar progress={computeProgressFromChildren(children, nodes)} height={10} showComplete />
            </View>
            <View style={styles.progressStats}>
              <Text style={[styles.progressStatText, { color: c.textSecondary }]}>
                {children.filter((ch) => ch.status === 'completed').length} of {childCount} children complete
              </Text>
            </View>
          </View>
        )}

        {/* Details grid */}
        <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
          {parent && (
            <DetailRow icon={Link2} label="Parent" themeColor={c}>
              <TouchableOpacity
                onPress={() => router.replace(`/node/${parent.id}`)}
                style={styles.linkRow}
              >
                <Text style={[styles.linkText, { color: c.primary }]} numberOfLines={1}>{parent.title}</Text>
                <ChevronRight size={14} color={c.primary} />
              </TouchableOpacity>
            </DetailRow>
          )}
          {node.deadline && (
            <DetailRow icon={Calendar} label="Deadline" themeColor={c}>
              <Text style={[styles.detailValue, { color: isOverdue ? c.error : c.textPrimary }]}>
                {formatDate(node.deadline)}
                {dlText ? `  ·  ${dlText}` : ''}
              </Text>
            </DetailRow>
          )}
          {node.type === 'goal' && (
            <DetailRow icon={FileText} label="Category" themeColor={c}>
              <Text style={[styles.detailValue, { color: c.textPrimary }]}>{categoryLabel(node.category)}</Text>
            </DetailRow>
          )}
          <DetailRow icon={Clock} label="Created" themeColor={c}>
            <Text style={[styles.detailValue, { color: c.textSecondary }]}>{formatDate(node.createdAt)}</Text>
          </DetailRow>
          {node.completedAt && (
            <DetailRow icon={CircleCheck} label="Completed" themeColor={c}>
              <Text style={[styles.detailValue, { color: c.success }]}>{formatDate(node.completedAt)}</Text>
            </DetailRow>
          )}
          <DetailRow icon={AlertTriangle} label="Status" themeColor={c}>
            <Text style={[styles.detailValue, { color: c.textPrimary }]}>{getStatusLabel(node.status)}</Text>
          </DetailRow>
        </View>

        {/* Notes */}
        {node.notes ? (
          <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Notes</Text>
            <Text style={[styles.notesText, { color: c.textPrimary }]}>{node.notes}</Text>
          </View>
        ) : null}

        {/* Children */}
        <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.childrenHeader}>
            <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>
              Children ({childCount})
            </Text>
            <TouchableOpacity onPress={() => setShowAddChild(true)} style={[styles.addChildMini, { backgroundColor: c.primary + '20' }]}>
              <Plus size={14} color={c.primary} />
              <Text style={[styles.addChildMiniText, { color: c.primary }]}>Add</Text>
            </TouchableOpacity>
          </View>
          {childCount === 0 ? (
            <Text style={[styles.emptyChildren, { color: c.textMuted }]}>
              No children yet. Break this down into smaller steps.
            </Text>
          ) : (
            children.map((child) => (
              <TouchableOpacity
                key={child.id}
                onPress={() => router.push(`/node/${child.id}`)}
                style={[styles.childRow, { borderBottomColor: c.border }]}
              >
                <View style={[styles.childDot, { backgroundColor: child.status === 'completed' ? c.success : c.primary }]} />
                <Text
                  style={[
                    styles.childTitle,
                    { color: child.status === 'completed' ? c.textMuted : c.textPrimary },
                    child.status === 'completed' && styles.childTitleComplete,
                  ]}
                  numberOfLines={1}
                >
                  {child.title}
                </Text>
                <Text style={[styles.childType, { color: c.textMuted }]}>{child.type}</Text>
                <ChevronRight size={16} color={c.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit modal */}
      <NodeForm
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        onSubmit={handleEdit}
        parentId={node.parentId}
        parentTitle={parent?.title}
        editingNode={node}
        allowTypeSelection={false}
        defaultType={node.type}
      />

      {/* Add child modal */}
      <NodeForm
        visible={showAddChild}
        onClose={() => setShowAddChild(false)}
        onSubmit={handleAddChild}
        parentId={id}
        parentTitle={node.title}
        allowTypeSelection={true}
        defaultType={suggestChildType(node.type)}
      />
    </View>
  );
}

function computeProgressFromChildren(children: any[], allNodes: any[]): number {
  if (children.length === 0) return 0;
  let total = 0;
  let completed = 0;
  function countLeaves(nodeId: string): { total: number; completed: number } {
    const kids = allNodes.filter((n) => n.parentId === nodeId);
    if (kids.length === 0) return { total: 1, completed: allNodes.find((n) => n.id === nodeId)?.status === 'completed' ? 1 : 0 };
    let t = 0, c = 0;
    for (const k of kids) {
      const r = countLeaves(k.id);
      t += r.total;
      c += r.completed;
    }
    return { total: t, completed: c };
  }
  for (const child of children) {
    const r = countLeaves(child.id);
    total += r.total;
    completed += r.completed;
  }
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

function DetailRow({ icon: Icon, label, children, themeColor }: { icon: any; label: string; children: React.ReactNode; themeColor: any }) {
  const c = themeColor;
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLabelRow}>
        <Icon size={14} color={c.textMuted} />
        <Text style={[styles.detailLabel, { color: c.textMuted }]}>{label}</Text>
      </View>
      <View style={styles.detailValueWrap}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 6 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  titleCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  completeRow: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  completeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  progressRow: {
    marginBottom: 8,
  },
  progressStats: {
    marginTop: 4,
  },
  progressStatText: {
    fontSize: 13,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.15)',
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValueWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: 180,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 21,
  },
  childrenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addChildMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  addChildMiniText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyChildren: {
    fontSize: 13,
    lineHeight: 19,
    paddingVertical: 4,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  childDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  childTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  childTitleComplete: {
    textDecorationLine: 'line-through',
  },
  childType: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
});
