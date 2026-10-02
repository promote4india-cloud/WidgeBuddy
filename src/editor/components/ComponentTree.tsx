/**
 * src/editor/components/ComponentTree.tsx
 *
 * Visual hierarchy outline of components in the active layout.
 * Supports selecting, reordering up/down, removing, and adding components.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon, IconName } from '@/ui/Icon';
import { colors, radius, spacing, typography } from '@/ui/theme';
import { useEditorStore } from '@/store/editorStore';
import {
  WidgetElement,
  ContainerElement,
  TextElement,
  IconElement,
  WeatherElement,
  EventElement,
  TaskListElement,
  ArticleListElement,
  MetricElement,
  DividerElement,
  ActionElement,
} from '@/widgets/declarative/elements';

const ELEMENT_ICON_MAP: Record<string, IconName> = {
  text: 'type',
  icon: 'sparkles',
  weather: 'cloud-sun',
  event: 'calendar',
  taskList: 'check-square',
  articleList: 'newspaper',
  metric: 'bar-chart-2',
  divider: 'minus',
  container: 'columns',
  action: 'external-link',
};

function getElementSummary(element: WidgetElement): string {
  switch (element.type) {
    case 'text':
      return `"${(element as TextElement).content || 'Empty text'}"`;
    case 'icon':
      return `icon: ${(element as IconElement).name || 'sparkles'}`;
    case 'weather': {
      const mode = (element as WeatherElement).displayMode || 'current';
      return `Weather (${mode})`;
    }
    case 'event':
      return (element as EventElement).title || 'Event Card';
    case 'taskList':
      return `Tasks (max ${(element as TaskListElement).maxItems || 3})`;
    case 'articleList':
      return `Articles (${(element as ArticleListElement).layout || 'compact'})`;
    case 'metric':
      return `${(element as MetricElement).label || 'Metric'}: ${(element as MetricElement).value || 0}`;
    case 'divider':
      return `Divider (${(element as DividerElement).orientation || 'horizontal'})`;
    case 'container':
      return `Box (${(element as ContainerElement).direction || 'column'}, ${((element as ContainerElement).children || []).length} items)`;
    case 'action':
      return (element as ActionElement).label || 'Action Button';
    default:
      return 'Unknown element';
  }
}

interface ElementNodeProps {
  element: WidgetElement;
  depth?: number;
  isFirst: boolean;
  isLast: boolean;
}

function ElementNode({ element, depth = 0, isFirst, isLast }: ElementNodeProps) {
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const removeElement = useEditorStore((s) => s.removeElement);
  const reorderElement = useEditorStore((s) => s.reorderElement);
  const openPalette = useEditorStore((s) => s.openPalette);

  const isSelected = selectedElementId === element.id;
  const iconName = ELEMENT_ICON_MAP[element.type] || 'layers';
  const summary = getElementSummary(element);

  const handleSelect = () => {
    selectElement(isSelected ? null : (element.id ?? null));
  };

  const handleMoveUp = () => {
    if (element.id && !isFirst) {
      reorderElement(element.id, 'up');
    }
  };

  const handleMoveDown = () => {
    if (element.id && !isLast) {
      reorderElement(element.id, 'down');
    }
  };

  const handleRemove = () => {
    if (element.id) {
      removeElement(element.id);
    }
  };

  return (
    <View style={[styles.nodeWrapper, { marginLeft: depth * spacing.md }]}>
      <TouchableOpacity
        style={[
          styles.nodeRow,
          isSelected && styles.nodeRowSelected,
        ]}
        activeOpacity={0.8}
        onPress={handleSelect}
      >
        <View style={[styles.badge, isSelected && styles.badgeSelected]}>
          <Icon name={iconName} size={15} color={isSelected ? colors.primary : colors.textMuted} />
          <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
            {element.type.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.summaryText} numberOfLines={1}>
          {summary}
        </Text>

        {/* Action Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlBtn, isFirst && styles.controlBtnDisabled]}
            disabled={isFirst}
            onPress={handleMoveUp}
            accessibilityLabel="Move element up"
          >
            <Icon
              name="arrow-up"
              size={14}
              color={isFirst ? colors.border : colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, isLast && styles.controlBtnDisabled]}
            disabled={isLast}
            onPress={handleMoveDown}
            accessibilityLabel="Move element down"
          >
            <Icon
              name="arrow-down"
              size={14}
              color={isLast ? colors.border : colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlBtnDelete}
            onPress={handleRemove}
            accessibilityLabel="Delete element"
          >
            <Icon name="trash-2" size={14} color={colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Recursive nested children for containers */}
      {element.type === 'container' && (
        <View style={styles.containerChildren}>
          {((element as ContainerElement).children ?? []).map((child, idx, arr) => (
            <ElementNode
              key={child.id || `child-${idx}`}
              element={child}
              depth={depth + 1}
              isFirst={idx === 0}
              isLast={idx === arr.length - 1}
            />
          ))}
          <TouchableOpacity
            style={styles.innerAddBtn}
            onPress={() => openPalette(element.id)}
          >
            <Icon name="plus" size={12} color={colors.primary} />
            <Text style={styles.innerAddText}>Add inside container</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export function ComponentTree() {
  const draft = useEditorStore((s) => s.draft);
  const activeSize = useEditorStore((s) => s.activeSize);
  const openPalette = useEditorStore((s) => s.openPalette);

  if (!draft) return null;

  const layout = draft.layouts[activeSize];
  const rootChildren = (layout?.root as unknown as ContainerElement)?.children ?? [];

  return (
    <View style={styles.treeContainer}>
      <View style={styles.treeHeader}>
        <View style={styles.treeHeaderTitleRow}>
          <Icon name="layers" size={18} color={colors.primary} />
          <Text style={styles.treeHeaderTitle}>Component Structure</Text>
          <Text style={styles.countBadge}>{rootChildren.length}</Text>
        </View>
        <Text style={styles.treeHeaderDesc}>
          Select a component to customize, or reorder with arrows
        </Text>
      </View>

      {rootChildren.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="inbox" size={32} color={colors.border} />
          <Text style={styles.emptyText}>No components added yet</Text>
          <Text style={styles.emptySubtext}>
            Tap the button below to add your first component
          </Text>
        </View>
      ) : (
        <View style={styles.treeList}>
          {rootChildren.map((child, idx) => (
            <ElementNode
              key={child.id || `root-${idx}`}
              element={child}
              isFirst={idx === 0}
              isLast={idx === rootChildren.length - 1}
            />
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.addBtn}
        activeOpacity={0.8}
        onPress={() => openPalette()}
      >
        <Icon name="plus" size={18} color={colors.primary} />
        <Text style={styles.addBtnText}>Add Component</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  treeContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  treeHeader: {
    marginBottom: spacing.md,
  },
  treeHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  treeHeaderTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.text,
  },
  countBadge: {
    ...typography.captionMedium,
    color: colors.primary,
    backgroundColor: colors.primaryBackground,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: radius.full,
    marginLeft: 4,
    fontSize: 11,
  },
  treeHeaderDesc: {
    ...typography.caption,
    color: colors.textMuted,
  },
  treeList: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  nodeWrapper: {
    marginBottom: 4,
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
  },
  nodeRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBackground,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
  },
  badgeSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  badgeTextSelected: {
    color: colors.primary,
  },
  summaryText: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  controlBtn: {
    padding: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  controlBtnDisabled: {
    opacity: 0.35,
  },
  controlBtnDelete: {
    padding: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: 4,
  },
  containerChildren: {
    marginTop: 4,
    paddingLeft: spacing.xs,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
  },
  innerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    marginVertical: 4,
    borderRadius: radius.sm,
  },
  innerAddText: {
    ...typography.captionMedium,
    color: colors.primary,
    fontSize: 12,
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryBackground,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  addBtnText: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.primary,
    fontSize: 14,
  },
});
