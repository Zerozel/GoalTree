import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, GoalNode } from './types';
import { generateId } from './treeLogic';

const STORAGE_KEY = 'goaltree:data:v1';
const DATA_VERSION = 1;

export async function loadData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: DATA_VERSION, nodes: [] };
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed.nodes) return { version: DATA_VERSION, nodes: [] };
    return parsed;
  } catch {
    return { version: DATA_VERSION, nodes: [] };
  }
}

export async function saveData(nodes: GoalNode[]): Promise<void> {
  const data: AppData = { version: DATA_VERSION, nodes };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function clearData(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function serializeForExport(nodes: GoalNode[]): string {
  return JSON.stringify({ version: DATA_VERSION, nodes }, null, 2);
}

export function parseImport(json: string): GoalNode[] {
  const parsed = JSON.parse(json);
  if (!parsed || !Array.isArray(parsed.nodes)) {
    throw new Error('Invalid import file: missing nodes array.');
  }
  // Re-id to avoid collisions while preserving parent structure
  const idMap = new Map<string, string>();
  for (const n of parsed.nodes) {
    idMap.set(n.id, generateId());
  }
  return parsed.nodes.map((n: GoalNode) => ({
    ...n,
    id: idMap.get(n.id) ?? generateId(),
    parentId: n.parentId ? (idMap.get(n.parentId) ?? null) : null,
  }));
}
