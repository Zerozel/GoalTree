import { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode } from 'react';
import { GoalNode, NodeWithChildren, NodeType, Category } from './types';
import { loadData, saveData, clearData, serializeForExport, parseImport } from './storage';
import { buildTree, generateId, getDescendantIds } from './treeLogic';

interface StoreContextValue {
  nodes: GoalNode[];
  tree: NodeWithChildren[];
  loaded: boolean;
  addNode: (input: NewNodeInput) => string;
  updateNode: (id: string, patch: Partial<Omit<GoalNode, 'id' | 'parentId' | 'createdAt'>>) => void;
  deleteNode: (id: string) => void;
  toggleComplete: (id: string) => void;
  getNode: (id: string) => GoalNode | undefined;
  getParent: (id: string) => GoalNode | undefined;
  getChildren: (id: string) => GoalNode[];
  exportData: () => string;
  importData: (json: string) => void;
  deleteAllData: () => void;
}

export interface NewNodeInput {
  parentId: string | null;
  type: NodeType;
  title: string;
  description?: string;
  notes?: string;
  category?: Category;
  deadline?: string | null;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<GoalNode[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadData().then((data) => {
      if (!mounted) return;
      setNodes(data.nodes);
      setLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback((next: GoalNode[]) => {
    setNodes(next);
    saveData(next);
  }, []);

  const addNode = useCallback(
    (input: NewNodeInput): string => {
      const id = generateId();
      const now = new Date().toISOString();
      const node: GoalNode = {
        id,
        parentId: input.parentId,
        type: input.type,
        title: input.title.trim(),
        description: input.description ?? '',
        notes: input.notes ?? '',
        category: input.category ?? 'other',
        deadline: input.deadline ?? null,
        status: 'not_started',
        createdAt: now,
        completedAt: null,
      };
      persist([...nodes, node]);
      return id;
    },
    [nodes, persist],
  );

  const updateNode = useCallback(
    (id: string, patch: Partial<Omit<GoalNode, 'id' | 'parentId' | 'createdAt'>>) => {
      persist(nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    },
    [nodes, persist],
  );

  const deleteNode = useCallback(
    (id: string) => {
      const toRemove = new Set([id, ...getDescendantIds(nodes, id)]);
      persist(nodes.filter((n) => !toRemove.has(n.id)));
    },
    [nodes, persist],
  );

  const toggleComplete = useCallback(
    (id: string) => {
      persist(
        nodes.map((n) => {
          if (n.id !== id) return n;
          const completed = n.status === 'completed';
          return {
            ...n,
            status: completed ? 'in_progress' : 'completed',
            completedAt: completed ? null : new Date().toISOString(),
          };
        }),
      );
    },
    [nodes, persist],
  );

  const getNode = useCallback((id: string) => nodes.find((n) => n.id === id), [nodes]);
  const getParent = useCallback(
    (id: string) => {
      const n = nodes.find((x) => x.id === id);
      return n?.parentId ? nodes.find((x) => x.id === n.parentId) : undefined;
    },
    [nodes],
  );
  const getChildren = useCallback(
    (id: string) => nodes.filter((n) => n.parentId === id),
    [nodes],
  );

  const exportData = useCallback(() => serializeForExport(nodes), [nodes]);

  const importData = useCallback(
    (json: string) => {
      const imported = parseImport(json);
      persist(imported);
    },
    [persist],
  );

  const deleteAllData = useCallback(() => {
    clearData();
    setNodes([]);
  }, []);

  const tree = useMemo(() => buildTree(nodes), [nodes]);

  const value: StoreContextValue = {
    nodes,
    tree,
    loaded,
    addNode,
    updateNode,
    deleteNode,
    toggleComplete,
    getNode,
    getParent,
    getChildren,
    exportData,
    importData,
    deleteAllData,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
