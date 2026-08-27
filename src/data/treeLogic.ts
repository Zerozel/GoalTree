import { GoalNode, NodeWithChildren, NodeStatus } from './types';

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function deadlineState(
  deadline: string | null,
  status: NodeStatus,
): { isOverdue: boolean; isDueToday: boolean; daysRemaining: number | null } {
  if (!deadline) return { isOverdue: false, isDueToday: false, daysRemaining: null };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  due.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - now.getTime();
  const days = Math.round(diffMs / 86400000);
  return {
    isOverdue: days < 0 && status !== 'completed',
    isDueToday: days === 0 && status !== 'completed',
    daysRemaining: days,
  };
}

export function isLeaf(nodes: GoalNode[], node: GoalNode): boolean {
  return !nodes.some((n) => n.parentId === node.id);
}

export function getDescendantIds(nodes: GoalNode[], id: string): string[] {
  const result: string[] = [];
  const stack = [id];
  while (stack.length) {
    const current = stack.pop()!;
    for (const n of nodes) {
      if (n.parentId === current) {
        result.push(n.id);
        stack.push(n.id);
      }
    }
  }
  return result;
}

export function buildTree(nodes: GoalNode[]): NodeWithChildren[] {
  const childrenMap = new Map<string | null, GoalNode[]>();
  for (const n of nodes) {
    const arr = childrenMap.get(n.parentId) ?? [];
    arr.push(n);
    childrenMap.set(n.parentId, arr);
  }
  function build(parentId: string | null): NodeWithChildren[] {
    const list = childrenMap.get(parentId) ?? [];
    return list
      .map((n) => {
        const children = build(n.id);
        const dl = deadlineState(n.deadline, n.status);
        if (children.length === 0) {
          const completed = n.status === 'completed' ? 1 : 0;
          return {
            ...n,
            children: [],
            progress: completed * 100,
            completedCount: completed,
            totalCount: 1,
            isOverdue: dl.isOverdue,
            isDueToday: dl.isDueToday,
          };
        }
        const totalCount = children.reduce((s, c) => s + c.totalCount, 0);
        const completedCount = children.reduce((s, c) => s + c.completedCount, 0);
        const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        return {
          ...n,
          children,
          progress,
          completedCount,
          totalCount,
          isOverdue: dl.isOverdue,
          isDueToday: dl.isDueToday,
        };
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  return build(null);
}

export function findInTree(tree: NodeWithChildren[], id: string): NodeWithChildren | null {
  for (const node of tree) {
    if (node.id === id) return node;
    const found = findInTree(node.children, id);
    if (found) return found;
  }
  return null;
}

export function flattenTree(tree: NodeWithChildren[]): NodeWithChildren[] {
  const result: NodeWithChildren[] = [];
  function walk(list: NodeWithChildren[]) {
    for (const n of list) {
      result.push(n);
      walk(n.children);
    }
  }
  walk(tree);
  return result;
}

export function getStatusLabel(status: NodeStatus): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'In progress';
    default:
      return 'Not started';
  }
}
