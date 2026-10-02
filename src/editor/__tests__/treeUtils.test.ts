/**
 * src/editor/__tests__/treeUtils.test.ts
 *
 * Unit tests for pure tree manipulation utilities.
 */

import {
  generateElementId,
  assignMissingIds,
  findElementById,
  findParentContainer,
  insertElement,
  removeElement,
  moveElement,
  updateElement,
  createDefaultElement,
} from '../utils/treeUtils';
import { ContainerElement, TextElement, WidgetElement } from '@/widgets/declarative/elements';

describe('treeUtils', () => {
  describe('generateElementId', () => {
    it('generates unique IDs with type prefix', () => {
      const id1 = generateElementId('text');
      const id2 = generateElementId('text');
      expect(id1).toContain('elem_text_');
      expect(id1).not.toEqual(id2);
    });
  });

  describe('assignMissingIds', () => {
    it('assigns IDs to elements lacking one', () => {
      const el: WidgetElement = {
        type: 'text',
        content: 'Hello',
      } as WidgetElement;

      const res = assignMissingIds(el);
      expect(res.id).toBeDefined();
      expect(res.id).toContain('elem_text_');
    });

    it('preserves existing IDs', () => {
      const el = {
        type: 'text',
        id: 'existing-id-123',
        content: 'Hello',
      } as unknown as TextElement;
      const res = assignMissingIds(el);
      expect(res.id).toBe('existing-id-123');
    });

    it('recursively assigns IDs to container children', () => {
      const container: ContainerElement = {
        type: 'container',
        id: 'c1',
        direction: 'column',
        gap: 8,
        padding: 0,
        children: [
          { type: 'text', content: 'Child 1' } as WidgetElement,
          {
            type: 'container',
            direction: 'row',
            gap: 4,
            padding: 0,
            children: [{ type: 'divider' } as WidgetElement],
          } as ContainerElement,
        ],
      };

      const res = assignMissingIds(container) as ContainerElement;
      expect(res.id).toBe('c1');
      expect(res.children[0].id).toBeDefined();
      expect((res.children[1] as ContainerElement).id).toBeDefined();
      expect(((res.children[1] as ContainerElement).children[0] as WidgetElement).id).toBeDefined();
    });
  });

  describe('findElementById', () => {
    it('finds element at root or deeply nested', () => {
      const tree: ContainerElement = {
        type: 'container',
        id: 'root-1',
        direction: 'column',
        gap: 8,
        padding: 0,
        children: [
          { type: 'text', id: 'txt-1', content: 'Line 1' } as TextElement,
          {
            type: 'container',
            id: 'nested-box',
            direction: 'row',
            gap: 4,
            padding: 0,
            children: [
              { type: 'text', id: 'deep-txt', content: 'Deep' } as TextElement,
            ],
          } as ContainerElement,
        ],
      };

      expect(findElementById(tree, 'root-1')?.id).toBe('root-1');
      expect(findElementById(tree, 'txt-1')?.id).toBe('txt-1');
      expect(findElementById(tree, 'deep-txt')?.id).toBe('deep-txt');
      expect(findElementById(tree, 'non-existent')).toBeNull();
    });
  });

  describe('findParentContainer', () => {
    it('identifies direct parent and index of target element', () => {
      const child1 = { type: 'text', id: 'c1', content: 'A' } as unknown as TextElement;
      const child2 = { type: 'text', id: 'c2', content: 'B' } as unknown as TextElement;
      const root: ContainerElement = {
        type: 'container',
        id: 'root',
        direction: 'column',
        gap: 8,
        padding: 0,
        children: [child1, child2],
      };

      const res1 = findParentContainer(root, 'c1');
      expect(res1?.parent.id).toBe('root');
      expect(res1?.index).toBe(0);

      const res2 = findParentContainer(root, 'c2');
      expect(res2?.parent.id).toBe('root');
      expect(res2?.index).toBe(1);

      expect(findParentContainer(root, 'missing')).toBeNull();
    });
  });

  describe('insertElement', () => {
    it('appends to root container', () => {
      const root: ContainerElement = {
        type: 'container',
        id: 'root',
        direction: 'column',
        gap: 8,
        padding: 0,
        children: [],
      };

      const newEl = createDefaultElement('text');
      const updated = insertElement(root, 'root', newEl);
      expect(updated.children.length).toBe(1);
      expect(updated.children[0].type).toBe('text');
    });

    it('inserts at specific index', () => {
      const root: ContainerElement = {
        type: 'container',
        id: 'root',
        direction: 'column',
        gap: 8,
        padding: 0,
        children: [
          { type: 'text', id: 'first', content: 'First' } as TextElement,
          { type: 'text', id: 'last', content: 'Last' } as TextElement,
        ],
      };

      const middle = { type: 'text', id: 'middle', content: 'Middle' } as TextElement;
      const updated = insertElement(root, 'root', middle, 1);
      expect(updated.children.length).toBe(3);
      expect(updated.children[1].id).toBe('middle');
    });
  });

  describe('removeElement', () => {
    it('removes target element by ID', () => {
      const root: ContainerElement = {
        type: 'container',
        id: 'root',
        direction: 'column',
        gap: 8,
        padding: 0,
        children: [
          { type: 'text', id: 't1', content: '1' } as TextElement,
          { type: 'text', id: 't2', content: '2' } as TextElement,
        ],
      };

      const updated = removeElement(root, 't1');
      expect(updated.children.length).toBe(1);
      expect(updated.children[0].id).toBe('t2');
    });

    it('does not remove root container', () => {
      const root: ContainerElement = {
        type: 'container',
        id: 'root',
        direction: 'column',
        gap: 8,
        padding: 0,
        children: [],
      };
      const res = removeElement(root, 'root');
      expect(res.id).toBe('root');
    });
  });

  describe('moveElement', () => {
    it('reorders elements up and down', () => {
      const root: ContainerElement = {
        type: 'container',
        id: 'root',
        direction: 'column',
        gap: 8,
        padding: 0,
        children: [
          { type: 'text', id: 'a', content: 'A' } as TextElement,
          { type: 'text', id: 'b', content: 'B' } as TextElement,
          { type: 'text', id: 'c', content: 'C' } as TextElement,
        ],
      };

      // Move 'b' up -> [b, a, c]
      const up = moveElement(root, 'b', 'up');
      expect(up.children.map((c) => c.id)).toEqual(['b', 'a', 'c']);

      // Move 'b' down -> [a, c, b]
      const down = moveElement(root, 'b', 'down');
      expect(down.children.map((c) => c.id)).toEqual(['a', 'c', 'b']);

      // Boundaries (moving 'a' up does nothing)
      const atBoundary = moveElement(root, 'a', 'up');
      expect(atBoundary.children.map((c) => c.id)).toEqual(['a', 'b', 'c']);
    });
  });

  describe('updateElement', () => {
    it('updates properties of target element', () => {
      const root: ContainerElement = {
        type: 'container',
        id: 'root',
        direction: 'column',
        gap: 8,
        padding: 0,
        children: [
          { type: 'text', id: 't1', content: 'Old Content' } as TextElement,
        ],
      };

      const updated = updateElement(root, 't1', { content: 'Updated Content' });
      const target = updated.children[0] as TextElement;
      expect(target.content).toBe('Updated Content');
    });
  });

  describe('createDefaultElement', () => {
    it('creates defaults for all 10 types', () => {
      const types = [
        'text',
        'icon',
        'weather',
        'event',
        'taskList',
        'articleList',
        'metric',
        'divider',
        'container',
        'action',
      ] as const;

      for (const t of types) {
        const el = createDefaultElement(t);
        expect(el.type).toBe(t);
        expect(el.id).toBeDefined();
      }
    });
  });
});
