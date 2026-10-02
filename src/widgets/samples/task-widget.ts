/**
 * src/widgets/samples/task-widget.ts
 *
 * Sample 3: Tasks & Reminders Widget
 * Demonstrates:
 * - task metadata & config fields
 * - small / medium / large layouts
 * - taskList element, container, text, icon, divider, action
 */

import { DeclarativeWidgetDefinition } from '../declarative/definition';

export const taskManagerWidget: DeclarativeWidgetDefinition = {
  id: 'task-manager-widget',
  displayName: 'Tasks & Reminders',
  description: 'Track daily tasks, priorities, and to-do lists.',
  version: '1.0.0',
  author: 'WidgeBuddy Team',
  category: 'productivity',
  tags: ['tasks', 'todo', 'reminders', 'productivity'],
  icon: 'check-square',
  connectorTypes: ['todoist'],
  supportedSizes: ['small', 'medium', 'large'],
  defaultSize: 'medium',
  configFields: [
    {
      key: 'filterStatus',
      label: 'Filter Status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending Only', value: 'pending' },
        { label: 'Completed Only', value: 'completed' },
        { label: 'All Tasks', value: 'all' },
      ],
      required: true,
    },
    {
      key: 'showPriority',
      label: 'Show Priority Badges',
      type: 'boolean',
      defaultValue: true,
      required: false,
    },
  ],
  layouts: {
    // -----------------------------------------------------------------------
    // Small (2x2): Quick pending tasks counter with quick-add button
    // -----------------------------------------------------------------------
    small: {
      backgroundColor: '#18181b',
      padding: 12,
      root: {
        type: 'container',
        direction: 'column',
        alignment: { vertical: 'space-between' },
        children: [
          {
            type: 'container',
            direction: 'row',
            alignment: { horizontal: 'space-between', vertical: 'center' },
            children: [
              {
                type: 'text',
                content: 'TASKS',
                variant: 'caption',
                weight: 'bold',
                color: '#a1a1aa',
              },
              {
                type: 'icon',
                name: 'check-circle',
                size: 'small',
                color: '#22c55e',
              },
            ],
          },
          {
            type: 'container',
            direction: 'column',
            children: [
              {
                type: 'text',
                content: '4',
                variant: 'heading',
                size: '2xl',
                weight: 'bold',
                color: '#fafafa',
              },
              {
                type: 'text',
                content: 'Remaining today',
                variant: 'caption',
                color: '#a1a1aa',
              },
            ],
          },
          {
            type: 'action',
            label: '+ New Task',
            variant: 'button',
            style: 'secondary',
            action: {
              type: 'run_connector',
              actionName: 'create_task',
            },
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Medium (4x2): Interactive task list view
    // -----------------------------------------------------------------------
    medium: {
      backgroundColor: '#18181b',
      padding: 14,
      root: {
        type: 'container',
        direction: 'column',
        gap: 8,
        children: [
          {
            type: 'container',
            direction: 'row',
            alignment: { horizontal: 'space-between', vertical: 'center' },
            children: [
              {
                type: 'text',
                content: "Today's Priorities",
                variant: 'title',
                weight: 'bold',
                color: '#fafafa',
              },
              {
                type: 'action',
                label: '+ Add',
                variant: 'button',
                style: 'ghost',
                action: {
                  type: 'run_connector',
                  actionName: 'create_task',
                },
              },
            ],
          },
          {
            type: 'divider',
            orientation: 'horizontal',
            color: '#27272a',
            thickness: 1,
          },
          {
            type: 'taskList',
            maxItems: 3,
            showCheckbox: true,
            showDueDate: true,
            showPriority: true,
            filterStatus: 'pending',
            allowToggle: true,
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Large (6x4): Full task manager dashboard
    // -----------------------------------------------------------------------
    large: {
      backgroundColor: '#09090b',
      padding: 16,
      root: {
        type: 'container',
        direction: 'column',
        gap: 12,
        children: [
          {
            type: 'container',
            direction: 'row',
            alignment: { horizontal: 'space-between', vertical: 'center' },
            children: [
              {
                type: 'container',
                direction: 'column',
                children: [
                  {
                    type: 'text',
                    content: 'Task Manager',
                    variant: 'heading',
                    weight: 'bold',
                    color: '#fafafa',
                  },
                  {
                    type: 'text',
                    content: 'Inbox & Due Today',
                    variant: 'caption',
                    color: '#71717a',
                  },
                ],
              },
              {
                type: 'container',
                direction: 'row',
                gap: 8,
                children: [
                  {
                    type: 'action',
                    label: 'Sync',
                    variant: 'button',
                    style: 'secondary',
                    action: {
                      type: 'run_connector',
                      actionName: 'sync_tasks',
                    },
                  },
                  {
                    type: 'action',
                    label: '+ Task',
                    variant: 'button',
                    style: 'primary',
                    action: {
                      type: 'run_connector',
                      actionName: 'create_task',
                    },
                  },
                ],
              },
            ],
          },
          {
            type: 'divider',
            orientation: 'horizontal',
            color: '#27272a',
            thickness: 1,
          },
          {
            type: 'taskList',
            maxItems: 6,
            showCheckbox: true,
            showDueDate: true,
            showPriority: true,
            filterStatus: 'pending',
            emptyMessage: 'All caught up! No tasks left.',
            allowToggle: true,
          },
        ],
      },
    },
  },
};
