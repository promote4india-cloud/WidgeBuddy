/**
 * src/editor/components/ComponentPaletteModal.tsx
 *
 * Modal bottom sheet allowing users to add any of the supported 10 component types
 * into their widget layout tree.
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { Icon, IconName } from '@/ui/Icon';
import { colors, radius, spacing, typography } from '@/ui/theme';
import { useEditorStore } from '@/store/editorStore';
import { WidgetElementType } from '@/editor/utils/treeUtils';

interface PaletteOption {
  type: WidgetElementType;
  name: string;
  desc: string;
  icon: IconName;
  category: 'content' | 'data' | 'layout';
}

const PALETTE_OPTIONS: PaletteOption[] = [
  {
    type: 'text',
    name: 'Text Block',
    desc: 'Headings, subtitles, labels, or body text',
    icon: 'type',
    category: 'content',
  },
  {
    type: 'icon',
    name: 'Icon',
    desc: 'Visual iconography with custom colors and sizes',
    icon: 'sparkles',
    category: 'content',
  },
  {
    type: 'weather',
    name: 'Weather',
    desc: 'Current temperature, condition, or multi-day forecast',
    icon: 'cloud-sun',
    category: 'data',
  },
  {
    type: 'event',
    name: 'Calendar Event',
    desc: 'Upcoming meeting with time, location, and badge',
    icon: 'calendar',
    category: 'data',
  },
  {
    type: 'taskList',
    name: 'Task List',
    desc: 'To-do list with status checkboxes and counters',
    icon: 'check-square',
    category: 'data',
  },
  {
    type: 'articleList',
    name: 'Article List',
    desc: 'News stories and RSS cards with thumbnails',
    icon: 'newspaper',
    category: 'data',
  },
  {
    type: 'metric',
    name: 'Metric Card',
    desc: 'Key numbers, stats, and trend indicators',
    icon: 'bar-chart-2',
    category: 'data',
  },
  {
    type: 'divider',
    name: 'Divider Line',
    desc: 'Subtle separator between content sections',
    icon: 'minus',
    category: 'layout',
  },
  {
    type: 'container',
    name: 'Container Box',
    desc: 'Group items in a row or column with padding and gap',
    icon: 'columns',
    category: 'layout',
  },
  {
    type: 'action',
    name: 'Action Button',
    desc: 'Interactive button or link with deep link triggers',
    icon: 'external-link',
    category: 'content',
  },
];

export function ComponentPaletteModal() {
  const isPaletteOpen = useEditorStore((s) => s.isPaletteOpen);
  const closePalette = useEditorStore((s) => s.closePalette);
  const addElement = useEditorStore((s) => s.addElement);

  if (!isPaletteOpen) return null;

  const handleSelect = (type: WidgetElementType) => {
    addElement(type);
  };

  return (
    <Modal
      visible={isPaletteOpen}
      animationType="slide"
      transparent
      onRequestClose={closePalette}
    >
      <TouchableWithoutFeedback onPress={closePalette}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.header}>
                <View style={styles.handle} />
                <View style={styles.titleRow}>
                  <Text style={styles.sheetTitle}>Add Component</Text>
                  <TouchableOpacity
                    onPress={closePalette}
                    style={styles.closeBtn}
                    accessibilityLabel="Close palette"
                  >
                    <Icon name="x" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.sheetSubtitle}>
                  Choose a component to insert into your widget layout
                </Text>
              </View>

              <ScrollView
                style={styles.scrollList}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {PALETTE_OPTIONS.map((item) => (
                  <TouchableOpacity
                    key={item.type}
                    style={styles.optionCard}
                    activeOpacity={0.7}
                    onPress={() => handleSelect(item.type)}
                  >
                    <View style={styles.iconCircle}>
                      <Icon name={item.icon} size={20} color={colors.primary} />
                    </View>
                    <View style={styles.optionInfo}>
                      <Text style={styles.optionName}>{item.name}</Text>
                      <Text style={styles.optionDesc} numberOfLines={2}>
                        {item.desc}
                      </Text>
                    </View>
                    <Icon name="plus" size={18} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '80%',
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.text,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  sheetSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  scrollList: {
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    ...typography.bodyMedium,
    color: colors.text,
    marginBottom: 2,
  },
  optionDesc: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
