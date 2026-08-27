import { useState, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeContext';
import { NodeWithChildren } from '@/src/data/types';
import { ProgressBar } from './ProgressBar';
import { relativeDeadline } from '@/src/utils/date';
import {
  ChevronRight,
  ChevronDown,
  CircleCheck,
  Circle,
  Target,
  Flag,
  ListTodo,
  GitBranch,
  Plus,
} from 'lucide-react-native';

interface Props {
  node: NodeWithChildren;
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onToggleComplete: (id: string) => void;
}

const TYPE_ICONS = {
  goal: Target,
  milestone: Flag,
  task: ListTodo,
  subtask: GitBranch,
};

export function TreeNode({ node, depth, expandedIds, onToggle, onSelect, onAddChild, onToggleComplete }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [hover, setHover] = useState(false);

  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isComplete = node.status === 'completed' || node.progress >= 100;
  const isOverdue = node.isOverdue;
  const dlText = relativeDeadline(node.deadline, isComplete);
  const Icon = TYPE_ICONS[node.type];

  const handleToggle = useCallback(
    (e: any) => {
      e?.stopPropagation?.();
      onToggle(node.id);
    },
    [node.id, onToggle],
  );

  const handleAdd = useCallback(
    (e: any) => {
      e?.stopPropagation?.();
      onAddChild(node.id);
    },
    [node.id, onAddChild],
  );

  const handleComplete = useCallback(
    (e: any) => {
      e?.stopPropagation?.();
      onToggleComplete(node.id);
    },
    [node.id, onToggleComplete],
  );

  const accentColor = isComplete ? c.success : isOverdue ? c.error : node.type === 'goal' ? c.primary : c.secondary;

  return (
    <View style={{ paddingLeft: depth > 0 ? 18 : 0 }}>
      {/* connector line for children */}
      {depth > 0 && (
        <View
          style={{
            position: 'absolute',
            left: -10,
            top: 0,
            bottom: 0,
            width: 1.5,
            backgroundColor: c.border,
          }}
        />
      )}

      <TouchableOpacity
        onPress={() => onSelect(node.id)}
        onPressIn={() => setHover(true)}
        onPressOut={() => setHover(false)}
        activeOpacity={0.7}
        style={[
          styles.node,
          { backgroundColor: hover ? c.surfaceAlt : c.surface, borderColor: isComplete ? c.success + '40' : c.border },
        ]}
      >
        <View style={[styles.leftAccent, { backgroundColor: accentColor }]} />

        {/* expand/collapse toggle */}
        <View style={styles.toggleArea}>
          {hasChildren ? (
            <TouchableOpacity onPress={handleToggle} style={styles.toggleBtn}>
              {isExpanded ? (
                <ChevronDown size={18} color={c.textSecondary} />
              ) : (
                <ChevronRight size={18} color={c.textSecondary} />
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.togglePlaceholder} />
          )}
        </View>

        {/* main content */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Icon size={16} color={accentColor} />
            <Text
              style={[
                styles.title,
                { color: isComplete ? c.textMuted : c.textPrimary },
                isComplete && styles.titleComplete,
              ]}
              numberOfLines={1}
            >
              {node.title}
            </Text>
          </View>

          {hasChildren && (
            <View style={styles.progressSection}>
              <ProgressBar progress={node.progress} height={5} style={styles.bar} />
              <Text style={[styles.progressText, { color: isComplete ? c.success : c.textSecondary }]}>
                {node.completedCount}/{node.totalCount}
              </Text>
            </View>
          )}

          {dlText && (
            <View style={styles.deadlineRow}>
              <Text style={[styles.deadlineText, { color: isOverdue ? c.error : c.textMuted }]}>
                {dlText}
              </Text>
            </View>
          )}
        </View>

        {/* actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleAdd} style={styles.actionBtn}>
            <Plus size={18} color={c.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleComplete} style={styles.actionBtn}>
            {isComplete ? (
              <CircleCheck size={22} color={c.success} />
            ) : (
              <Circle size={22} color={c.textMuted} />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* children */}
      {hasChildren && isExpanded && (
        <View style={styles.childrenContainer}>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  node: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    minHeight: 56,
  },
  leftAccent: {
    width: 4,
    alignSelf: 'stretch',
  },
  toggleArea: {
    paddingVertical: 8,
    paddingLeft: 6,
  },
  toggleBtn: {
    padding: 4,
  },
  togglePlaceholder: {
    width: 26,
  },
  content: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  titleComplete: {
    textDecorationLine: 'line-through',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  bar: {
    flex: 1,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'right',
  },
  deadlineRow: {
    marginTop: 4,
  },
  deadlineText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 8,
  },
  actionBtn: {
    padding: 6,
  },
  childrenContainer: {
    marginTop: 2,
  },
});
