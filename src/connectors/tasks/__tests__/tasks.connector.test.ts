/**
 * src/connectors/tasks/__tests__/tasks.connector.test.ts
 *
 * Unit and integration tests for Tasks (Todoist) Connector.
 * Verifies:
 * - Normalization to TaskItem schema (id, title, dueDate, status, provider, priority, project)
 * - Provider-specific data isolation
 * - Support for today's tasks, incomplete tasks, and completed tasks
 * - API error handling and validation
 */

import {
  tasksConnector,
  getTodayTasks,
  getIncompleteTasks,
  getCompletedTasks,
} from '../tasks.connector';
import { UniversalItemSchema, TaskItemSchema } from '@/widgets/schema';
import { ConnectorError } from '@/connectors/base/connector.types';

const MOCK_TODOIST_RAW = [
  {
    id: 't-1',
    content: 'Review quarterly earnings report',
    description: 'Verify financial metrics and balance sheet',
    due: { date: '2026-10-02' },
    priority: 4,
    is_completed: false,
    project_id: 'Finance',
    updated_at: '2026-10-02T08:00:00.000Z',
  },
  {
    id: 't-2',
    content: 'Team weekly catchup',
    description: 'Discuss sprint velocity',
    due: { date: '2026-10-02' },
    priority: 3,
    is_completed: true,
    project_id: 'Team',
    updated_at: '2026-10-02T09:00:00.000Z',
  },
  {
    id: 't-3',
    content: 'Write architectural decision record',
    description: 'Document ADR-007',
    due: { date: '2026-10-10' },
    priority: 2,
    is_completed: false,
    project_id: 'Architecture',
    updated_at: '2026-10-02T10:00:00.000Z',
  },
];

describe('Tasks Connector', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Validation & Configuration', () => {
    it('throws INVALID_CONFIG if apiToken is missing or empty', async () => {
      await expect(
        tasksConnector.fetch({ apiToken: '' } as any),
      ).rejects.toThrow(ConnectorError);
    });

    it('successfully fetches simulated dynamic tasks when in mock mode', async () => {
      const items = await tasksConnector.fetch({ apiToken: 'simulated_token' });
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].content).toBeDefined();
    });

    it('calls live Todoist REST API when valid live token is provided', async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(MOCK_TODOIST_RAW),
        }),
      ) as jest.Mock;

      const raw = await tasksConnector.fetch({
        apiToken: 'live_todoist_user_token_12345',
        projectId: 'proj_eng',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.todoist.com/rest/v2/tasks?project_id=proj_eng',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer live_todoist_user_token_12345',
          }),
        }),
      );
      expect(raw).toHaveLength(3);
    });
  });

  describe('Normalization to Universal Data Model', () => {
    it('normalizes Todoist raw tasks into UniversalItem & TaskItem', () => {
      const items = tasksConnector.normalise(MOCK_TODOIST_RAW, { apiToken: 'token' });
      expect(items).toHaveLength(3);

      items.forEach((item) => {
        // Validate against universal schema
        expect(() => UniversalItemSchema.parse(item)).not.toThrow();
        // Validate against task schema
        const task = TaskItemSchema.parse(item);
        expect(task.provider).toBe('todoist');
        expect(task.type).toBe('task');
        expect(task.id).toBeDefined();
        expect(task.title).toBeDefined();
      });

      // Task 1 check
      const t1 = items[0];
      if (t1.type === 'task') {
        expect(t1.title).toBe('Review quarterly earnings report');
        expect(t1.status).toBe('pending');
        expect(t1.priority).toBe('high');
        expect(t1.project).toBe('Finance');
        expect(t1.dueDate).toBe('2026-10-02T00:00:00.000Z');
      }

      // Task 2 check (completed)
      const t2 = items[1];
      if (t2.type === 'task') {
        expect(t2.status).toBe('completed');
        expect(t2.priority).toBe('medium');
      }
    });

    it('isolates upstream raw Todoist properties from top-level widget properties', () => {
      const items = tasksConnector.normalise(MOCK_TODOIST_RAW, { apiToken: 'token' });
      const raw = items[0] as any;
      expect(raw.is_completed).toBeUndefined();
      expect(raw.content).toBeUndefined();
      expect(raw.project_id).toBeUndefined();
    });
  });

  describe('Query / Filter Helpers', () => {
    it('filters today tasks correctly', () => {
      const items = tasksConnector.normalise(MOCK_TODOIST_RAW, { apiToken: 'token' });
      const refDate = new Date('2026-10-02T12:00:00Z');
      const todayTasks = getTodayTasks(items, refDate);

      expect(todayTasks).toHaveLength(2);
      expect(todayTasks.map((t) => t.id)).toEqual(['t-1', 't-2']);
    });

    it('filters incomplete tasks correctly', () => {
      const items = tasksConnector.normalise(MOCK_TODOIST_RAW, { apiToken: 'token' });
      const incomplete = getIncompleteTasks(items);

      expect(incomplete).toHaveLength(2);
      expect(incomplete.map((t) => t.id)).toEqual(['t-1', 't-3']);
    });

    it('filters completed tasks correctly', () => {
      const items = tasksConnector.normalise(MOCK_TODOIST_RAW, { apiToken: 'token' });
      const completed = getCompletedTasks(items);

      expect(completed).toHaveLength(1);
      expect(completed[0].id).toBe('t-2');
    });
  });
});
