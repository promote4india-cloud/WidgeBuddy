/**
 * src/editor/components/EditorPreview.tsx
 *
 * Live preview component for the widget editor.
 * Renders the active DeclarativeWidgetDefinition draft using DeclarativeWidgetRenderer
 * and mock normalized data.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Icon } from '@/ui/Icon';
import { colors, radius, spacing, typography } from '@/ui/theme';
import { useEditorStore } from '@/store/editorStore';
import { WidgetSize, WIDGET_SIZE_DIMENSIONS } from '@/widgets/declarative/layout';
import { DeclarativeWidgetRenderer } from '@/renderer/declarative/DeclarativeWidgetRenderer';
import { mockUniversalItems } from '@/renderer/mockData';
import { Action } from '@/widgets/schema';

const SIZES: { size: WidgetSize; label: string; desc: string }[] = [
  { size: 'small', label: 'Small', desc: '2x2' },
  { size: 'medium', label: 'Medium', desc: '4x2' },
  { size: 'large', label: 'Large', desc: '6x4' },
];

export function EditorPreview() {
  const draft = useEditorStore((s) => s.draft);
  const activeSize = useEditorStore((s) => s.activeSize);
  const setActiveSize = useEditorStore((s) => s.setActiveSize);
  const [taskOverrides, setTaskOverrides] = useState<Record<string, 'pending' | 'completed'>>({});

  const previewItems = useMemo(() => {
    if (Object.keys(taskOverrides).length === 0) {
      return mockUniversalItems;
    }
    return mockUniversalItems.map((item) => {
      if (item.type === 'task' && taskOverrides[item.id]) {
        return { ...item, status: taskOverrides[item.id]! };
      }
      return item;
    });
  }, [taskOverrides]);

  const handleAction = useCallback(async (action: Action) => {
    if (!action || !action.type) return;

    if (action.type === 'toggle_task') {
      const taskId = action.payload?.['taskId'] as string | undefined;
      const currentStatus = action.payload?.['currentStatus'] as string | undefined;
      if (taskId) {
        setTaskOverrides((prev) => {
          const current = prev[taskId] ?? currentStatus ?? 'pending';
          const next = current === 'completed' ? 'pending' : 'completed';
          return { ...prev, [taskId]: next };
        });
      }
    } else if (action.type === 'open_url' && action.url) {
      try {
        const canOpen = await Linking.canOpenURL(action.url);
        if (canOpen) {
          await Linking.openURL(action.url);
        }
      } catch {
        Alert.alert('Preview Action', `Opened URL: ${action.url}`);
      }
    }
  }, []);

  if (!draft) return null;

  const dims = WIDGET_SIZE_DIMENSIONS[activeSize];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="eye" size={16} color={colors.primary} />
          <Text style={styles.previewTitle}>Live Preview</Text>
          <View style={styles.dimBadge}>
            <Text style={styles.dimText}>
              {dims.w}x{dims.h} Grid
            </Text>
          </View>
        </View>

        {/* Size switcher tabs */}
        <View style={styles.sizeTabs}>
          {SIZES.map(({ size, label, desc }) => {
            const isActive = activeSize === size;
            return (
              <TouchableOpacity
                key={size}
                style={[styles.sizeTab, isActive && styles.sizeTabActive]}
                onPress={() => setActiveSize(size)}
                activeOpacity={0.7}
              >
                <Text style={[styles.sizeTabLabel, isActive && styles.sizeTabLabelActive]}>
                  {label}
                </Text>
                <Text style={[styles.sizeTabDesc, isActive && styles.sizeTabDescActive]}>
                  {desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Widget Render Frame */}
      <View style={styles.frameWrapper}>
        <View style={styles.frame}>
          <DeclarativeWidgetRenderer
            definition={draft}
            size={activeSize}
            items={previewItems}
            onAction={handleAction}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  header: {
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  previewTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.text,
  },
  dimBadge: {
    backgroundColor: colors.primaryBackground,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginLeft: spacing.xs,
  },
  dimText: {
    ...typography.captionMedium,
    color: colors.primary,
    fontSize: 11,
  },
  sizeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: 3,
    gap: 4,
  },
  sizeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: radius.sm,
    gap: 4,
  },
  sizeTabActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sizeTabLabel: {
    ...typography.captionMedium,
    color: colors.textMuted,
    fontSize: 12,
  },
  sizeTabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  sizeTabDesc: {
    fontSize: 10,
    color: colors.textMuted,
  },
  sizeTabDescActive: {
    color: colors.primary,
  },
  frameWrapper: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
  },
  frame: {
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
});
