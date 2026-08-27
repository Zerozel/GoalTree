import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useTheme, ThemeMode } from '@/src/theme/ThemeContext';
import { useStore } from '@/src/data/store';
import { createSampleData } from '@/src/data/sampleData';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  Sun,
  Moon,
  Monitor,
  FlaskConical,
  Info,
  FileJson,
  ChevronRight,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const { theme, mode, setMode } = useTheme();
  const { nodes, exportData, importData, deleteAllData } = useStore();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  const handleExport = useCallback(async () => {
    if (nodes.length === 0) {
      Alert.alert('Nothing to export', 'You have no goals to export yet.');
      return;
    }
    try {
      setBusy(true);
      const json = exportData();
      const filename = `goaltree-export-${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export GoalTree Data',
        });
      } else {
        Alert.alert('Export ready', `File saved to: ${fileUri}`);
      }
    } catch (e: any) {
      Alert.alert('Export failed', e?.message ?? 'Could not export data.');
    } finally {
      setBusy(false);
    }
  }, [nodes, exportData]);

  const handleImport = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const file = result.assets[0];
      setBusy(true);
      const content = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.UTF8 });
      try {
        const parsed = JSON.parse(content);
        if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
          throw new Error('Invalid file format');
        }
        Alert.alert(
          'Import data?',
          `This will replace your current ${nodes.length} goals with ${parsed.nodes.length} items from the file.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Import',
              onPress: () => {
                importData(content);
                Alert.alert('Import complete', 'Your data has been restored.');
              },
            },
          ],
        );
      } catch {
        Alert.alert('Invalid file', 'The selected file is not a valid GoalTree export.');
      }
    } catch (e: any) {
      Alert.alert('Import failed', e?.message ?? 'Could not import data.');
    } finally {
      setBusy(false);
    }
  }, [nodes.length, importData]);

  const handleDeleteAll = useCallback(() => {
    Alert.alert(
      'Delete all data?',
      'This will permanently delete all your goals, milestones, tasks, and subtasks. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: () => {
            deleteAllData();
            Alert.alert('Data deleted', 'All your data has been removed.');
          },
        },
      ],
    );
  }, [deleteAllData]);

  const handleLoadSample = useCallback(() => {
    Alert.alert(
      'Load sample data?',
      nodes.length > 0
        ? `This will replace your current ${nodes.length} goals with a sample goal tree for testing.`
        : 'This will create a sample goal tree so you can explore the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load sample',
          onPress: () => {
            const sample = createSampleData();
            importData(JSON.stringify({ version: 1, nodes: sample }));
            Alert.alert('Sample loaded', 'A sample goal tree has been created.');
          },
        },
      ],
    );
  }, [nodes.length, importData]);

  const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <View style={[styles.container, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.headerTitle, { color: c.textPrimary }]}>Settings</Text>
        <Text style={[styles.headerSubtitle, { color: c.textSecondary }]}>Preferences and data management</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Appearance */}
        <Text style={[styles.groupTitle, { color: c.textMuted }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.themeRow}>
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const active = mode === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setMode(opt.value)}
                  style={[
                    styles.themeChip,
                    {
                      backgroundColor: active ? c.primary : c.surfaceAlt,
                      borderColor: active ? c.primary : c.border,
                    },
                  ]}
                >
                  <Icon size={18} color={active ? c.textInverse : c.textSecondary} />
                  <Text style={[styles.themeChipText, { color: active ? c.textInverse : c.textSecondary }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Data Management */}
        <Text style={[styles.groupTitle, { color: c.textMuted }]}>Data Management</Text>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <SettingRow icon={Download} label="Export data" subtitle="Save goals to a JSON file" onPress={handleExport} themeColor={c} />
          <Divider themeColor={c} />
          <SettingRow icon={Upload} label="Import data" subtitle="Restore from a JSON file" onPress={handleImport} themeColor={c} />
          <Divider themeColor={c} />
          <SettingRow icon={FlaskConical} label="Load sample data" subtitle="Create a test goal tree" onPress={handleLoadSample} themeColor={c} />
          <Divider themeColor={c} />
          <SettingRow
            icon={Trash2}
            label="Delete all data"
            subtitle="Permanently remove everything"
            onPress={handleDeleteAll}
            themeColor={c}
            danger
          />
        </View>

        {/* Stats */}
        <Text style={[styles.groupTitle, { color: c.textMuted }]}>Storage</Text>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.infoRow}>
            <FileJson size={18} color={c.textMuted} />
            <Text style={[styles.infoLabel, { color: c.textSecondary }]}>Total items stored</Text>
            <Text style={[styles.infoValue, { color: c.textPrimary }]}>{nodes.length}</Text>
          </View>
        </View>

        {/* About */}
        <Text style={[styles.groupTitle, { color: c.textMuted }]}>About</Text>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.infoRow}>
            <Info size={18} color={c.textMuted} />
            <Text style={[styles.infoLabel, { color: c.textSecondary }]}>Version</Text>
            <Text style={[styles.infoValue, { color: c.textPrimary }]}>1.0.0</Text>
          </View>
          <Divider themeColor={c} />
          <View style={styles.aboutText}>
            <Text style={[styles.aboutTextContent, { color: c.textSecondary }]}>
              GoalTree helps you break big goals into milestones, tasks, and subtasks — then tracks progress automatically as you complete each piece.
            </Text>
            <Text style={[styles.aboutTextContent, { color: c.textMuted, marginTop: 8, fontSize: 12 }]}>
              All data is stored locally on your device. No account, no cloud, no tracking.
            </Text>
          </View>
        </View>

        {busy && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={c.primary} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SettingRow({
  icon: Icon,
  label,
  subtitle,
  onPress,
  themeColor,
  danger,
}: {
  icon: any;
  label: string;
  subtitle: string;
  onPress: () => void;
  themeColor: any;
  danger?: boolean;
}) {
  const c = themeColor;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.6} style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: danger ? c.error + '20' : c.surfaceAlt }]}>
        <Icon size={18} color={danger ? c.error : c.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingLabel, { color: danger ? c.error : c.textPrimary }]}>{label}</Text>
        <Text style={[styles.settingSubtitle, { color: c.textMuted }]}>{subtitle}</Text>
      </View>
      <ChevronRight size={18} color={c.textMuted} />
    </TouchableOpacity>
  );
}

function Divider({ themeColor }: { themeColor: any }) {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: themeColor.border, marginVertical: 0 }} />;
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
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 20,
    paddingHorizontal: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  themeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  themeChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  infoLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  aboutText: {
    padding: 16,
  },
  aboutTextContent: {
    fontSize: 13,
    lineHeight: 19,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
