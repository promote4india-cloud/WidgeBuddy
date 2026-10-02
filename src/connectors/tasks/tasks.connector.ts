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

  async fetch(_config, _params): Promise<TodoistTask[]> {
    // TODO: implement Todoist REST API v2 call
    throw new ConnectorError(
      'Todoist connector not yet implemented.',
      'NOT_IMPLEMENTED',
      false,
    );
  },

  normalise(raw, _config): UniversalItem[] {
    return raw.map((task) => ({
      id: task.id,
      provider: 'todoist',
      type: 'task',
      title: task.content,
      status: task.is_completed ? 'completed' : 'pending',
      dueDate: task.due?.datetime ?? task.due?.date,
      priority: task.priority.toString(),
      project: task.project_id,
      updatedAt: task.updated_at,
      meta: {
        body: task.description,
      },
    }));
  },

  staleTimeMs: 30 * 1000, // 30 seconds
};
