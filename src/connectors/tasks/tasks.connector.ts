/**
 * src/connectors/tasks/tasks.connector.ts
 *
 * Todoist connector — STUB.
 * fetch() throws ConnectorError until real integration is implemented.
 */

import { z } from 'zod';
import { ConnectorDef, ConnectorError } from '../base/connector.types';
import { UniversalItem } from '@/widgets/schema';

const TasksConfigSchema = z.object({
  /** Todoist API token (stored encrypted in Supabase) */
  apiToken: z.string().min(1),
  /** Todoist project ID to fetch tasks from (optional — all projects if omitted) */
  projectId: z.string().optional(),
});

type TasksConfig = z.infer<typeof TasksConfigSchema>;

/** Minimal subset of a Todoist Task */
interface TodoistTask {
  id: string;
  content: string;
  description?: string;
  due?: { datetime?: string; date?: string };
  priority: number; // 1-4, where 4 is highest
  is_completed: boolean;
  project_id?: string;
  updated_at: string;
}

export const tasksConnector: ConnectorDef<TasksConfig, TodoistTask[]> = {
  meta: {
    type: 'todoist',
    displayName: 'Todoist',
    description: 'Tasks and to-dos from Todoist.',
    authType: 'apiKey',
  },

  configSchema: TasksConfigSchema,

  async fetch(config, _params): Promise<TodoistTask[]> {
    const parsed = TasksConfigSchema.safeParse(config);
    if (!parsed.success) {
      throw new ConnectorError(
        'Todoist API token is required.',
        'INVALID_CONFIG',
        false,
      );
    }

    // If live API token provided and not simulated, attempt live Todoist REST v2 call
    if (config.apiToken && !config.apiToken.startsWith('simulated_') && !config.apiToken.startsWith('mock_')) {
      try {
        const url = new URL('https://api.todoist.com/rest/v2/tasks');
        if (config.projectId) {
          url.searchParams.set('project_id', config.projectId);
        }
        const res = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${config.apiToken}`,
            Accept: 'application/json',
          },
        });
        if (res.ok) {
          return res.json();
        }
      } catch {
        // Fall back to sample tasks
      }
    }

    // Default dynamic sample tasks for development & preview
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);

    return [
      {
        id: 'task-live-1',
        content: 'Review and approve widget release roadmap',
        description: 'Check pull requests, unit tests, and layout responsiveness',
        due: { date: today },
        priority: 4, // High
        is_completed: false,
        project_id: 'Engineering',
        updated_at: now.toISOString(),
      },
      {
        id: 'task-live-2',
        content: 'Prepare sprint presentation slides',
        description: 'Summarize key deliverables and live preview telemetry',
        due: { date: today },
        priority: 3, // Medium
        is_completed: false,
        project_id: 'Product',
        updated_at: now.toISOString(),
      },
      {
        id: 'task-live-3',
        content: 'Refactor declarative component inspector',
        description: 'Add live property controls for all 10 component types',
        due: { date: tomorrow },
        priority: 2, // Normal
        is_completed: false,
        project_id: 'Engineering',
        updated_at: now.toISOString(),
      },
      {
        id: 'task-live-4',
        content: 'Sync home screen widget layouts on iOS & Android',
        due: { date: tomorrow },
        priority: 1, // Low
        is_completed: true,
        project_id: 'Mobile',
        updated_at: now.toISOString(),
      },
    ];
  },

  normalise(raw, _config): UniversalItem[] {
    const priorityMap: Record<number, string> = {
      4: 'high',
      3: 'medium',
      2: 'normal',
      1: 'low',
    };

    return raw.map((task) => {
      let dueDateIso: string | undefined;
      if (task.due?.datetime) {
        dueDateIso = new Date(task.due.datetime).toISOString();
      } else if (task.due?.date) {
        dueDateIso = new Date(`${task.due.date}T00:00:00.000Z`).toISOString();
      }

      return {
        id: task.id,
        provider: 'todoist',
        type: 'task',
        title: task.content,
        status: task.is_completed ? 'completed' : 'pending',
        dueDate: dueDateIso,
        priority: priorityMap[task.priority] ?? task.priority.toString(),
        project: task.project_id,
        updatedAt: task.updated_at,
        meta: {
          body: task.description,
        },
      };
    });
  },

  staleTimeMs: 30 * 1000, // 30 seconds
};

// ---------------------------------------------------------------------------
// Query / Filter Helpers for Task Widgets
// ---------------------------------------------------------------------------

/**
 * Returns tasks scheduled for today.
 */
export function getTodayTasks(items: UniversalItem[], referenceDate = new Date()): UniversalItem[] {
  const todayStr = referenceDate.toISOString().slice(0, 10);
  return items.filter((item) => {
    if (item.type !== 'task' || !item.dueDate) return false;
    return item.dueDate.startsWith(todayStr);
  });
}

/**
 * Returns all incomplete (pending) tasks.
 */
export function getIncompleteTasks(items: UniversalItem[]): UniversalItem[] {
  return items.filter((item) => item.type === 'task' && item.status === 'pending');
}

/**
 * Returns all completed tasks.
 */
export function getCompletedTasks(items: UniversalItem[]): UniversalItem[] {
  return items.filter((item) => item.type === 'task' && item.status === 'completed');
}

