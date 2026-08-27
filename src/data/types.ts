export type NodeType = 'goal' | 'milestone' | 'task' | 'subtask';

export type NodeStatus = 'not_started' | 'in_progress' | 'completed';

export type Category =
  | 'business'
  | 'education'
  | 'engineering'
  | 'health'
  | 'personal'
  | 'other';

export interface GoalNode {
  id: string;
  parentId: string | null;
  type: NodeType;
  title: string;
  description: string;
  notes: string;
  category: Category;
  deadline: string | null;
  status: NodeStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface AppData {
  version: number;
  nodes: GoalNode[];
}

export interface NodeWithChildren extends GoalNode {
  children: NodeWithChildren[];
  progress: number;
  completedCount: number;
  totalCount: number;
  isOverdue: boolean;
  isDueToday: boolean;
}
