/**
 * app/(tabs)/add.tsx
 *
 * Widget Library — list of available widgets, custom widget creation CTA,
 * and saved custom widgets. Uses TanStack Query (useWidgets) for fetching
 * persisted custom widgets from the repository.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/ui/Screen';
import { Icon, IconName } from '@/ui/Icon';
import { Button } from '@/ui/Button';
import { colors, useTheme, radius, spacing, typography } from '@/ui/theme';
import { useWidgets } from '@/hooks/useWidgets';
import { WIDGET_TEMPLATES, WidgetTemplate, getTemplate } from '@/editor/templates';
import { getWidgetRepository } from '@/repositories';
import { DeclarativeWidgetRenderer } from '@/renderer/declarative/DeclarativeWidgetRenderer';
import { mockUniversalItems } from '@/renderer/mockData';
import { WidgetSize } from '@/widgets/schema';

const BUILT_IN_TYPES = [
  { id: 'weather-card', name: 'Weather Card', desc: 'Current conditions & forecast', icon: 'cloud-sun' as IconName, templateId: 'weather-focus' },
  { id: 'clock', name: 'Digital Clock', desc: 'Local time and date banner', icon: 'clock' as IconName, templateId: 'clock' },
  { id: 'calendar-list', name: 'Calendar Schedule', desc: 'Upcoming events & meetings', icon: 'calendar' as IconName, templateId: 'calendar' },
  { id: 'task-list', name: 'Task Manager', desc: 'To-do list with checkboxes', icon: 'check-square' as IconName, templateId: 'tasks' },
  { id: 'rss-feed', name: 'News & RSS Feed', desc: 'Latest articles & headlines', icon: 'rss' as IconName, templateId: 'rss-feed' },
];

export default function AddWidgetScreen() {
  const { colors, isDark } = useTheme();
  const { widgets: customWidgets } = useWidgets();
  const queryClient = useQueryClient();

  const [previewTemplate, setPreviewTemplate] = useState<WidgetTemplate | null>(null);
  const [previewSize, setPreviewSize] = useState<WidgetSize>('medium');

  const handleCreateNew = (templateId = 'my-day') => {
    const target = templateId === 'weather-card' || templateId === 'weather' ? 'weather-focus' : templateId;
    router.push(`/editor/${target}`);
  };

  const handleEditCustom = (id: string) => {
    router.push(`/editor/${id}`);
  };

  const handleOpenPreview = (tmpl: WidgetTemplate) => {
    setPreviewTemplate(tmpl);
    setPreviewSize(tmpl.definition.defaultSize || 'medium');
  };

  const handleAddDirect = async (templateId: string) => {
    try {
      const tmpl = getTemplate(templateId);
      const cloned = JSON.parse(JSON.stringify(tmpl.definition));
      cloned.id = `${cloned.id}-${Date.now().toString(36)}`;
      const repo = getWidgetRepository();
      await repo.create(cloned);
      queryClient.invalidateQueries({ queryKey: ['widgets'] });
      setPreviewTemplate(null);
      Alert.alert(
        'Widget Added!',
        `"${cloned.displayName}" has been added to your dashboard.`,
        [
          { text: 'View Dashboard', onPress: () => router.push('/dashboard') },
          { text: 'OK' },
        ],
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not add widget.');
    }
  };

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      {/* Primary Hero CTA to Open Widget Editor */}
      <TouchableOpacity
        style={styles.heroCta}
        activeOpacity={0.85}
        onPress={() => handleCreateNew('weather-focus')}
      >
        <View style={styles.heroIconCircle}>
          <Icon name="cloud-sun" size={24} color="#ffffff" />
        </View>
        <View style={styles.heroTextContainer}>
          <Text style={styles.heroTitle}>Create Custom Widget</Text>
          <Text style={styles.heroSubtitle}>
            Build your own widget with live weather, tasks, calendar & news components
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color="rgba(255, 255, 255, 0.7)" />
      </TouchableOpacity>

      {/* Starter Templates */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Predefined Templates</Text>
          <Text style={[styles.templateCount, { color: colors.textMuted }]}>
            {WIDGET_TEMPLATES.length} templates
          </Text>
        </View>
        <View style={styles.templatesGrid}>
          {WIDGET_TEMPLATES.map((tmpl) => (
            <View
              key={tmpl.id}
              style={[
                styles.templateCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleOpenPreview(tmpl)}
              >
                <View style={styles.templateTopRow}>
                  <View style={[styles.templateIconWrapper, { backgroundColor: colors.primaryBackground }]}>
                    <Icon name={tmpl.icon as IconName} size={20} color={colors.primary} />
                  </View>
                  <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceHover }]}>
                    <Text style={[styles.categoryBadgeText, { color: colors.textMuted }]}>
                      {tmpl.definition.category || 'Widget'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.templateName, { color: colors.text }]}>{tmpl.name}</Text>
                <Text style={[styles.templateDesc, { color: colors.textMuted }]} numberOfLines={2}>
                  {tmpl.description}
                </Text>
              </TouchableOpacity>

              <View style={styles.templateActionRow}>
                <TouchableOpacity
                  style={[styles.templatePreviewBtn, { borderColor: colors.border }]}
                  onPress={() => handleOpenPreview(tmpl)}
                  activeOpacity={0.7}
                >
                  <Icon name="eye" size={12} color={colors.text} />
                  <Text style={[styles.templatePreviewBtnText, { color: colors.text }]}>Preview</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.templateCustomizeBtn, { borderColor: colors.border }]}
                  onPress={() => handleCreateNew(tmpl.id)}
                  activeOpacity={0.7}
                >
                  <Icon name="sliders" size={12} color={colors.text} />
                  <Text style={[styles.templateCustomizeBtnText, { color: colors.text }]}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.templateAddBtn, { backgroundColor: colors.primaryBackground }]}
                  onPress={() => handleAddDirect(tmpl.id)}
                  activeOpacity={0.75}
                >
                  <Icon name="plus" size={12} color={colors.primary} />
                  <Text style={[styles.templateAddBtnText, { color: colors.primary }]}>Use</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Saved Custom Widgets */}
      {customWidgets.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Dashboard Widgets</Text>
            <Text style={[styles.customCountBadge, { backgroundColor: colors.primaryBackground, color: colors.primary }]}>
              {customWidgets.length}
            </Text>
          </View>
          {customWidgets.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              activeOpacity={0.7}
              onPress={() => handleEditCustom(item.id)}
            >
              <View style={[styles.customIconContainer, { backgroundColor: colors.primaryBackground }]}>
                <Icon name={item.category === 'weather' ? 'cloud-sun' : 'palette'} size={22} color={colors.primary} />
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]}>{item.displayName}</Text>
                <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={1}>
                  {item.description || 'Custom widget'} • {item.supportedSizes.join(', ')}
                </Text>
              </View>
              <View style={[styles.editBadge, { backgroundColor: colors.primaryBackground }]}>
                <Icon name="edit-3" size={14} color={colors.primary} />
                <Text style={[styles.editText, { color: colors.primary }]}>Edit</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Standard Built-in Widgets */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Standard Widgets</Text>
        {BUILT_IN_TYPES.map((item) => (
          <View
            key={item.id}
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={styles.cardMainTouchable}
              activeOpacity={0.7}
              onPress={() => handleCreateNew(item.templateId)}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.primaryBackground }]}>
                <Icon name={item.icon} size={22} color={colors.primary} />
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.desc, { color: colors.textMuted }]}>{item.desc}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.standardAddBtn, { backgroundColor: colors.primary }]}
              onPress={() => handleAddDirect(item.templateId)}
              activeOpacity={0.75}
            >
              <Icon name="plus" size={14} color="#ffffff" />
              <Text style={styles.standardAddBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Weather Diagnostics & Debug Screen Link */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Developer & Testing Tools</Text>
        <TouchableOpacity
          style={[
            styles.debugCard,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? colors.border : '#bae6fd',
            },
          ]}
          activeOpacity={0.75}
          onPress={() => router.push('/weather-debug')}
        >
          <View
            style={[
              styles.debugIconContainer,
              { backgroundColor: isDark ? colors.surfaceHover : '#e0f2fe' },
            ]}
          >
            <Icon name="activity" size={22} color={isDark ? colors.primary : '#0284c7'} />
          </View>
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.text }]}>Weather Connector Preview & Debug</Text>
            <Text style={[styles.desc, { color: colors.textMuted }]}>
              Test GPS vs city fallback, stale cache, and Open-Meteo telemetry
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.border} />
        </TouchableOpacity>
      </View>

      {/* Template Preview Modal */}
      <Modal
        visible={previewTemplate !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPreviewTemplate(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {previewTemplate && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <View style={[styles.modalIconWrapper, { backgroundColor: colors.primaryBackground }]}>
                      <Icon name={previewTemplate.icon as IconName} size={22} color={colors.primary} />
                    </View>
                    <View style={styles.modalTitleContainer}>
                      <View style={styles.modalBadgeRow}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{previewTemplate.name}</Text>
                        <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceHover }]}>
                          <Text style={[styles.categoryBadgeText, { color: colors.textMuted }]}>
                            {previewTemplate.definition.category || 'template'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.modalDesc, { color: colors.textMuted }]}>
                        {previewTemplate.description}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceHover }]}
                    onPress={() => setPreviewTemplate(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="x" size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Size Selector */}
                <View style={styles.sizeSelectorRow}>
                  <Text style={[styles.sizeSelectorLabel, { color: colors.textMuted }]}>Preview Layout:</Text>
                  <View style={[styles.sizeToggleGroup, { backgroundColor: colors.surfaceHover, borderColor: colors.border }]}>
                    {(['small', 'medium', 'large'] as WidgetSize[]).map((sz) => {
                      const isActive = previewSize === sz;
                      const isSupported = (previewTemplate.definition.supportedSizes ?? []).includes(sz);
                      return (
                        <TouchableOpacity
                          key={sz}
                          disabled={!isSupported}
                          style={[
                            styles.sizeToggleBtn,
                            isActive && { backgroundColor: colors.primary },
                            !isSupported && styles.sizeToggleBtnDisabled,
                          ]}
                          onPress={() => setPreviewSize(sz)}
                        >
                          <Text
                            style={[
                              styles.sizeToggleText,
                              { color: isActive ? '#ffffff' : colors.textMuted },
                              !isSupported && styles.sizeToggleTextDisabled,
                            ]}
                          >
                            {sz.charAt(0).toUpperCase() + sz.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Live Widget Preview */}
                <ScrollView
                  style={styles.previewScroll}
                  contentContainerStyle={styles.previewScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={[styles.previewRendererBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border }]}>
                    <DeclarativeWidgetRenderer
                      definition={previewTemplate.definition}
                      size={previewSize}
                      items={mockUniversalItems}
                    />
                  </View>

                  {/* Connectors & Metadata */}
                  <View style={styles.metaContainer}>
                    <View style={styles.metaItem}>
                      <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Connectors Used</Text>
                      <Text style={[styles.metaValue, { color: colors.text }]}>
                        {(previewTemplate.definition.connectorTypes?.length ?? 0) > 0
                          ? previewTemplate.definition.connectorTypes!.join(', ')
                          : 'None (Standalone)'}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Supported Sizes</Text>
                      <Text style={[styles.metaValue, { color: colors.text }]}>
                        {(previewTemplate.definition.supportedSizes ?? []).join(', ')}
                      </Text>
                    </View>
                  </View>
                </ScrollView>

                {/* Action Buttons */}
                <View style={[styles.modalActionsRow, { borderTopColor: colors.border }]}>
                  <TouchableOpacity
                    style={[styles.modalCustomizeBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                    onPress={() => {
                      const id = previewTemplate.id;
                      setPreviewTemplate(null);
                      handleCreateNew(id);
                    }}
                    activeOpacity={0.75}
                  >
                    <Icon name="sliders" size={16} color={colors.text} />
                    <Text style={[styles.modalCustomizeBtnText, { color: colors.text }]}>Customize</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalUseBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleAddDirect(previewTemplate.id)}
                    activeOpacity={0.8}
                  >
                    <Icon name="plus" size={16} color="#ffffff" />
                    <Text style={styles.modalUseBtnText}>Use Template</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: radius.xl,
    marginBottom: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  heroIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    ...typography.h3,
    color: '#ffffff',
    fontSize: 17,
    marginBottom: 2,
  },
  heroSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  customCountBadge: {
    ...typography.captionMedium,
    color: colors.primary,
    backgroundColor: colors.primaryBackground,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: radius.full,
    fontSize: 11,
    marginBottom: spacing.md,
  },
  templateCount: {
    ...typography.caption,
    fontSize: 12,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  templateCard: {
    width: '48.5%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
    minHeight: 160,
  },
  templateTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  templateIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  categoryBadgeText: {
    ...typography.caption,
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  templateName: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  templateDesc: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 14,
    minHeight: 28,
  },
  templateActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  templatePreviewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  templatePreviewBtnText: {
    ...typography.captionMedium,
    fontSize: 10,
  },
  templateCustomizeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  templateCustomizeBtnText: {
    ...typography.captionMedium,
    fontSize: 10,
  },
  templateAddBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  templateAddBtnText: {
    ...typography.captionMedium,
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '90%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  modalIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  modalTitle: {
    ...typography.h3,
    fontSize: 17,
  },
  modalDesc: {
    ...typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sizeSelectorLabel: {
    ...typography.captionMedium,
    fontSize: 12,
  },
  sizeToggleGroup: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sizeToggleBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  sizeToggleBtnDisabled: {
    opacity: 0.35,
  },
  sizeToggleText: {
    ...typography.captionMedium,
    fontSize: 12,
  },
  sizeToggleTextDisabled: {
    textDecorationLine: 'line-through',
  },
  previewScroll: {
    maxHeight: 380,
  },
  previewScrollContent: {
    paddingBottom: spacing.md,
  },
  previewRendererBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.sm,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  metaItem: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  metaLabel: {
    ...typography.caption,
    fontSize: 11,
    marginBottom: 2,
  },
  metaValue: {
    ...typography.bodyMedium,
    fontSize: 12,
    fontWeight: '600',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    marginTop: spacing.xs,
  },
  modalCustomizeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  modalCustomizeBtnText: {
    ...typography.bodyMedium,
    fontSize: 14,
    fontWeight: '600',
  },
  modalUseBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  modalUseBtnText: {
    ...typography.bodyMedium,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  customIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.text,
    marginBottom: 2,
  },
  desc: {
    ...typography.caption,
    color: colors.textMuted,
  },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryBackground,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  editText: {
    ...typography.captionMedium,
    color: colors.primary,
    fontSize: 11,
  },
  cardMainTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  standardAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    marginLeft: spacing.sm,
  },
  standardAddBtnText: {
    ...typography.captionMedium,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  debugCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  debugIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
});
