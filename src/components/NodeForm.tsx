import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '@/src/theme/ThemeContext';
import { NodeType, Category, GoalNode } from '@/src/data/types';
import { CATEGORIES } from '@/src/data/categories';
import { toDateInputValue, fromDateInputValue } from '@/src/utils/date';
import { X, Check, Target, Flag, ListTodo, GitBranch } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: NodeFormData) => void;
  parentId: string | null;
  parentTitle?: string;
  editingNode?: GoalNode;
  allowTypeSelection: boolean;
  defaultType?: NodeType;
}

export interface NodeFormData {
  type: NodeType;
  title: string;
  description: string;
  notes: string;
  category: Category;
  deadline: string | null;
}

const TYPE_OPTIONS: { value: NodeType; label: string; icon: typeof Target }[] = [
  { value: 'goal', label: 'Goal', icon: Target },
  { value: 'milestone', label: 'Milestone', icon: Flag },
  { value: 'task', label: 'Task', icon: ListTodo },
  { value: 'subtask', label: 'Subtask', icon: GitBranch },
];

export function NodeForm({
  visible,
  onClose,
  onSubmit,
  parentId,
  parentTitle,
  editingNode,
  allowTypeSelection,
  defaultType = 'milestone',
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [type, setType] = useState<NodeType>(defaultType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (visible) {
      if (editingNode) {
        setType(editingNode.type);
        setTitle(editingNode.title);
        setDescription(editingNode.description);
        setNotes(editingNode.notes);
        setCategory(editingNode.category);
        setDeadline(toDateInputValue(editingNode.deadline));
      } else {
        setType(defaultType);
        setTitle('');
        setDescription('');
        setNotes('');
        setCategory('other');
        setDeadline('');
      }
    }
  }, [visible, editingNode, defaultType]);

  const canSubmit = title.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      type,
      title: title.trim(),
      description: description.trim(),
      notes: notes.trim(),
      category,
      deadline: fromDateInputValue(deadline),
    });
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.overlay, { backgroundColor: c.bg }]}>
          <View style={[styles.header, { borderBottomColor: c.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color={c.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: c.textPrimary }]}>
              {editingNode ? 'Edit' : 'New'} {type}
            </Text>
            <TouchableOpacity onPress={handleSubmit} disabled={!canSubmit} style={[styles.saveBtn, { backgroundColor: canSubmit ? c.primary : c.surfaceAlt }]}>
              <Check size={18} color={canSubmit ? c.textInverse : c.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            {parentTitle && (
              <View style={[styles.parentInfo, { backgroundColor: c.surfaceAlt }]}>
                <Text style={[styles.parentLabel, { color: c.textMuted }]}>Under</Text>
                <Text style={[styles.parentTitle, { color: c.textSecondary }]} numberOfLines={1}>{parentTitle}</Text>
              </View>
            )}

            {allowTypeSelection && !editingNode && (
              <View style={styles.field}>
                <Text style={[styles.label, { color: c.textSecondary }]}>Type</Text>
                <View style={styles.typeRow}>
                  {TYPE_OPTIONS.map((opt) => {
                    const active = type === opt.value;
                    const Icon = opt.icon;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setType(opt.value)}
                        style={[
                          styles.typeChip,
                          { backgroundColor: active ? c.primary + '20' : c.surfaceAlt, borderColor: active ? c.primary : 'transparent' },
                        ]}
                      >
                        <Icon size={16} color={active ? c.primary : c.textSecondary} />
                        <Text style={[styles.typeChipText, { color: active ? c.primary : c.textSecondary }]}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.field}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="What needs to be done?"
                placeholderTextColor={c.textMuted}
                style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.textPrimary }]}
                autoFocus={!editingNode}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Optional details"
                placeholderTextColor={c.textMuted}
                style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.textPrimary }, styles.textArea]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Notes</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Private notes for this item"
                placeholderTextColor={c.textMuted}
                style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.textPrimary }, styles.textArea]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {parentId === null && (
              <View style={styles.field}>
                <Text style={[styles.label, { color: c.textSecondary }]}>Category</Text>
                <View style={styles.catRow}>
                  {CATEGORIES.map((cat) => {
                    const active = category === cat.value;
                    return (
                      <TouchableOpacity
                        key={cat.value}
                        onPress={() => setCategory(cat.value)}
                        style={[
                          styles.catChip,
                          { backgroundColor: active ? c.primary : c.surfaceAlt, borderColor: active ? c.primary : c.border },
                        ]}
                      >
                        <Text style={[styles.catChipText, { color: active ? c.textInverse : c.textSecondary }]}>{cat.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.field}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Deadline</Text>
              <View style={[styles.dateRow, { backgroundColor: c.surface, borderColor: c.border }]}>
                <TextInput
                  value={deadline}
                  onChangeText={setDeadline}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={c.textMuted}
                  style={[styles.dateInput, { color: c.textPrimary }]}
                  keyboardType="numeric"
                />
                {deadline.length > 0 && (
                  <TouchableOpacity onPress={() => setDeadline('')} style={styles.clearDate}>
                    <X size={16} color={c.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[styles.hint, { color: c.textMuted }]}>Optional. Format: 2025-12-20</Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  saveBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    padding: 16,
  },
  parentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  parentLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  parentTitle: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  catRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  dateInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
  clearDate: {
    padding: 8,
  },
  hint: {
    fontSize: 12,
    marginTop: 6,
  },
});
