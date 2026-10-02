/**
 * src/widgets/built-in/task-list.ts
 */

import { WidgetDefinition } from '../schema';

export const taskListDef: WidgetDefinition = {
  type: 'task-list',
  displayName: 'Task List',
  description: 'Your tasks and to-dos.',
  version: '1.0.0',
  connectorTypes: ['todoist'],
  configFields: [
    {
      key: 'maxTasks',
      label: 'Max tasks to show',
      type: 'number',
      defaultValue: 8,
      required: false,
    },
    {
      key: 'showCompleted',
      label: 'Show completed tasks',
      type: 'boolean',
      defaultValue: false,
      required: false,
    },
    {
      key: 'filter',
      label: 'Filter',
      type: 'select',
      defaultValue: 'today',
      options: [
        { label: 'Today', value: 'today' },
        { label: 'This week', value: 'week' },
        { label: 'All', value: 'all' },
      ],
      required: false,
    },
  ],
  minW: 2,
  minH: 2,
};
