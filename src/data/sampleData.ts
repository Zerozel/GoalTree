import { GoalNode, NodeType, Category } from './types';
import { generateId } from './treeLogic';

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 0, 0);
  return d.toISOString();
}

function makeNode(
  parentId: string | null,
  type: NodeType,
  title: string,
  opts: {
    description?: string;
    notes?: string;
    category?: Category;
    deadline?: string | null;
    status?: 'not_started' | 'in_progress' | 'completed';
    completedAt?: string | null;
  } = {},
): GoalNode {
  const now = new Date().toISOString();
  const status = opts.status ?? 'not_started';
  return {
    id: generateId(),
    parentId,
    type,
    title,
    description: opts.description ?? '',
    notes: opts.notes ?? '',
    category: opts.category ?? 'other',
    deadline: opts.deadline ?? null,
    status,
    createdAt: now,
    completedAt: opts.completedAt ?? (status === 'completed' ? now : null),
  };
}

export function createSampleData(): GoalNode[] {
  const nodes: GoalNode[] = [];

  // Root goal
  const goal = makeNode(null, 'goal', 'Build AI-Powered Business', {
    description: 'Launch an AI-powered SaaS business from idea to revenue.',
    category: 'business',
    deadline: daysFromNow(120),
    status: 'in_progress',
  });
  nodes.push(goal);

  // Milestone 1: Research (completed)
  const research = makeNode(goal.id, 'milestone', 'Market Research', {
    deadline: daysFromNow(-5),
    status: 'completed',
    completedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  });
  nodes.push(research);

  const rTask1 = makeNode(research.id, 'task', 'Analyze competitors', { status: 'completed' });
  nodes.push(rTask1);
  nodes.push(makeNode(rTask1.id, 'subtask', 'List top 10 competitors', { status: 'completed' }));
  nodes.push(makeNode(rTask1.id, 'subtask', 'Pricing comparison', { status: 'completed' }));

  const rTask2 = makeNode(research.id, 'task', 'Survey potential users', { status: 'completed' });
  nodes.push(rTask2);
  nodes.push(makeNode(rTask2.id, 'subtask', 'Design survey', { status: 'completed' }));
  nodes.push(makeNode(rTask2.id, 'subtask', 'Collect 50 responses', { status: 'completed' }));

  const rTask3 = makeNode(research.id, 'task', 'Define target persona', { status: 'completed' });
  nodes.push(rTask3);

  // Milestone 2: Product (in progress)
  const product = makeNode(goal.id, 'milestone', 'Build MVP', {
    deadline: daysFromNow(30),
    status: 'in_progress',
  });
  nodes.push(product);

  const pTask1 = makeNode(product.id, 'task', 'Design UI mockups', { status: 'completed' });
  nodes.push(pTask1);
  nodes.push(makeNode(pTask1.id, 'subtask', 'Landing page', { status: 'completed' }));
  nodes.push(makeNode(pTask1.id, 'subtask', 'Dashboard', { status: 'completed' }));

  const pTask2 = makeNode(product.id, 'task', 'Backend API', { status: 'in_progress', deadline: daysFromNow(0) });
  nodes.push(pTask2);
  nodes.push(makeNode(pTask2.id, 'subtask', 'Set up database', { status: 'completed' }));
  nodes.push(makeNode(pTask2.id, 'subtask', 'Auth endpoints', { status: 'in_progress' }));

  const pTask3 = makeNode(product.id, 'task', 'AI integration', { deadline: daysFromNow(14) });
  nodes.push(pTask3);
  nodes.push(makeNode(pTask3.id, 'subtask', 'Choose LLM provider'));
  nodes.push(makeNode(pTask3.id, 'subtask', 'Build prompt pipeline'));

  const pTask4 = makeNode(product.id, 'task', 'Testing', { deadline: daysFromNow(21) });
  nodes.push(pTask4);

  // Milestone 3: Marketing (not started, some overdue)
  const marketing = makeNode(goal.id, 'milestone', 'Marketing', {
    deadline: daysFromNow(60),
  });
  nodes.push(marketing);

  const mTask1 = makeNode(marketing.id, 'task', 'Social media accounts', { deadline: daysFromNow(-2) });
  nodes.push(mTask1);
  nodes.push(makeNode(mTask1.id, 'subtask', 'Create Twitter/X'));
  nodes.push(makeNode(mTask1.id, 'subtask', 'Create LinkedIn'));

  const mTask2 = makeNode(marketing.id, 'task', 'Content calendar', { deadline: daysFromNow(7) });
  nodes.push(mTask2);
  nodes.push(makeNode(mTask2.id, 'subtask', 'First 10 posts'));
  nodes.push(makeNode(mTask2.id, 'subtask', 'Blog articles'));

  const mTask3 = makeNode(marketing.id, 'task', 'Email campaign');
  nodes.push(mTask3);

  // Milestone 4: Launch (not started)
  const launch = makeNode(goal.id, 'milestone', 'Launch', {
    deadline: daysFromNow(90),
  });
  nodes.push(launch);
  nodes.push(makeNode(launch.id, 'task', 'Deploy to production'));
  nodes.push(makeNode(launch.id, 'task', 'Press release'));
  nodes.push(makeNode(launch.id, 'task', 'Onboarding flow'));

  return nodes;
}
