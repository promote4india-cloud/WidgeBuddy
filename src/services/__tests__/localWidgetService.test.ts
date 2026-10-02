/**
 * src/services/__tests__/localWidgetService.test.ts
 *
 * Unit tests for localWidgetService with AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveCustomWidget,
  getCustomWidgets,
  getCustomWidget,
  deleteCustomWidget,
  clearAllCustomWidgets,
} from '../localWidgetService';
import { DeclarativeWidgetDefinition } from '@/widgets/declarative/definition';
import { WidgetValidationError } from '@/widgets/declarative/validation';

describe('localWidgetService', () => {
  beforeEach(async () => {
    await clearAllCustomWidgets();
    jest.clearAllMocks();
  });

  const sampleWidget: DeclarativeWidgetDefinition = {
    id: 'my-custom-test-widget',
    displayName: 'Test Widget',
    description: 'A test widget description',
    version: '1.0.0',
    category: 'productivity',
    tags: ['test'],
    connectorTypes: ['weather'],
    configFields: [],
    supportedSizes: ['small', 'medium'],
    defaultSize: 'medium',
    layouts: {
      small: {
        root: {
          type: 'container',
          id: 'root-s',
          direction: 'column',
          gap: 4,
          padding: 0,
          children: [
            {
              type: 'text',
              id: 'txt-1',
              content: 'Small layout',
            },
          ],
        },
      },
      medium: {
        root: {
          type: 'container',
          id: 'root-m',
          direction: 'column',
          gap: 8,
          padding: 0,
          children: [
            {
              type: 'text',
              id: 'txt-2',
              content: 'Medium layout',
            },
          ],
        },
      },
    },
  };

  it('saves and retrieves custom widgets', async () => {
    await saveCustomWidget(sampleWidget);

    const all = await getCustomWidgets();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe('my-custom-test-widget');
    expect(all[0].displayName).toBe('Test Widget');
  });

  it('updates an existing widget when saving with the same ID', async () => {
    await saveCustomWidget(sampleWidget);

    const modifiedWidget: DeclarativeWidgetDefinition = {
      ...sampleWidget,
      displayName: 'Updated Test Widget Name',
    };

    await saveCustomWidget(modifiedWidget);

    const all = await getCustomWidgets();
    expect(all.length).toBe(1);
    expect(all[0].displayName).toBe('Updated Test Widget Name');
  });

  it('finds a single widget by ID', async () => {
    await saveCustomWidget(sampleWidget);

    const found = await getCustomWidget('my-custom-test-widget');
    expect(found).not.toBeNull();
    expect(found?.displayName).toBe('Test Widget');

    const missing = await getCustomWidget('non-existent-widget');
    expect(missing).toBeNull();
  });

  it('deletes a custom widget by ID', async () => {
    await saveCustomWidget(sampleWidget);

    const deleted = await deleteCustomWidget('my-custom-test-widget');
    expect(deleted).toBe(true);

    const all = await getCustomWidgets();
    expect(all.length).toBe(0);

    const deleteAgain = await deleteCustomWidget('my-custom-test-widget');
    expect(deleteAgain).toBe(false);
  });

  it('rejects invalid widget definitions and throws WidgetValidationError', async () => {
    const invalidWidget = {
      id: 'INVALID CAPS ID', // Invalid slug regex
      displayName: '', // Invalid empty display name
      supportedSizes: [], // At least one size required
      layouts: {},
    } as unknown as DeclarativeWidgetDefinition;

    await expect(saveCustomWidget(invalidWidget)).rejects.toThrow(WidgetValidationError);
  });
});
