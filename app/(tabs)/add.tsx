/**
 * app/(tabs)/add.tsx
 *
 * Widget Library — list of available widgets, custom widget creation CTA,
 * and saved custom widgets. Uses TanStack Query (useWidgets) for fetching
 * persisted custom widgets from the repository.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/ui/Screen';
import { Icon, IconName } from '@/ui/Icon';
import { colors, useTheme, radius, spacing, typography } from '@/ui/theme';
import { useWidgets } from '@/hooks/useWidgets';
import { WIDGET_TEMPLATES, getTemplate } from '@/editor/templates';
import { getWidgetRepository } from '@/repositories';

const BUILT_IN_TYPES = [
  { id: 'weather-card', name: 'Weather Card', desc: 'Current conditions & forecast', icon: 'cloud-sun' as IconName, templateId: 'weather-focus' },
  { id: 'clock', name: 'Clock', desc: 'Local time and date', icon: 'clock' as IconName, templateId: 'blank' },
  { id: 'calendar-list', name: 'Calendar List', desc: 'Upcoming events', icon: 'calendar' as IconName, templateId: 'my-day' },
  { id: 'task-list', name: 'Task List', desc: 'Your to-do list', icon: 'check-square' as IconName, templateId: 'my-day' },
  { id: 'rss-feed', name: 'RSS Feed', desc: 'Latest articles', icon: 'rss' as IconName, templateId: 'blank' },
];

export default function AddWidgetScreen() {
  const { colors, isDark } = useTheme();
  const { widgets: customWidgets } = useWidgets();
  const queryClient = useQueryClient();

  const handleCreateNew = (templateId = 'my-day') => {
    const target = templateId === 'weather-card' || templateId === 'weather' ? 'weather-focus' : templateId;
    router.push(`/editor/${target}`);
  };

  const handleEditCustom = (id: string) => {
    router.push(`/editor/${id}`);
  };

  const handleAddDirect = async (templateId: string) => {
    try {
      const tmpl = getTemplate(templateId);
      const cloned = JSON.parse(JSON.stringify(tmpl.definition));
      cloned.id = `${cloned.id}-${Date.now().toString(36)}`;
      const repo = getWidgetRepository();
      await repo.create(cloned);
      queryClient.invalidateQueries({ queryKey: ['widgets'] });
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
          <Text style={styles.heroTitle}>Create Weather Widget</Text>
          <Text style={styles.heroSubtitle}>
            Live temperature, forecast, condition icons & city detection
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color="rgba(255, 255, 255, 0.7)" />
      </TouchableOpacity>

      {/* Starter Templates */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Start From Template</Text>
        <View style={styles.templatesRow}>
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
                onPress={() => handleCreateNew(tmpl.id)}
              >
                <View style={[styles.templateIconWrapper, { backgroundColor: colors.primaryBackground }]}>
                  <Icon name={tmpl.icon as IconName} size={20} color={colors.primary} />
                </View>
                <Text style={[styles.templateName, { color: colors.text }]}>{tmpl.name}</Text>
                <Text style={[styles.templateDesc, { color: colors.textMuted }]} numberOfLines={2}>
                  {tmpl.description}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.templateAddBtn, { backgroundColor: colors.primaryBackground }]}
                onPress={() => handleAddDirect(tmpl.id)}
                activeOpacity={0.75}
              >
                <Icon name="plus" size={13} color={colors.primary} />
                <Text style={[styles.templateAddBtnText, { color: colors.primary }]}>Add</Text>
              </TouchableOpacity>
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
  templatesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  templateCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  templateIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  templateName: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.text,
    marginBottom: 2,
  },
  templateDesc: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 14,
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
  templateAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: colors.primaryBackground,
    paddingVertical: 4,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  templateAddBtnText: {
    ...typography.captionMedium,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
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
