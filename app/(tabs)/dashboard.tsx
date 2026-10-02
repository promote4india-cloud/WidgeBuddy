/**
 * app/(tabs)/dashboard.tsx
 *
 * Dashboard screen showing persisted widget definitions from the repository.
 * Renders actual visual widgets using DeclarativeWidgetRenderer with live/mock items.
 * Uses TanStack Query (useWidgets) for data fetching — no hardcoded mocks.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/ui/Screen';
import { Icon, IconName } from '@/ui/Icon';
import { colors, useTheme, radius, spacing, typography } from '@/ui/theme';
import { Button } from '@/ui/Button';
import { AddToHomeScreenModal } from '@/ui/AddToHomeScreenModal';
import { useWidgets } from '@/hooks/useWidgets';
import { getWidgetRepository } from '@/repositories';
import { getTemplate } from '@/editor/templates';
import { ParsedDeclarativeWidgetDefinition } from '@/widgets/declarative/definition';
import { DeclarativeWidgetRenderer } from '@/renderer/declarative/DeclarativeWidgetRenderer';
import { mockUniversalItems } from '@/renderer/mockData';
import { fetchNormalisedData } from '@/services/connectorService';
import { Action, UniversalItem } from '@/widgets/schema';

/** Maps a widget category to a fallback icon when the widget itself has no icon. */
function getWidgetIcon(widget: ParsedDeclarativeWidgetDefinition): IconName {
  if (widget.icon) return widget.icon as IconName;
  const categoryIcons: Record<string, IconName> = {
    weather: 'cloud-sun',
    productivity: 'check-square',
    news: 'rss',
    finance: 'bar-chart-2',
  };
  return categoryIcons[widget.category ?? ''] ?? 'layout';
}

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { widgets, isLoading, isError } = useWidgets();
  const queryClient = useQueryClient();
  const [homeModalWidget, setHomeModalWidget] = useState<ParsedDeclarativeWidgetDefinition | null>(null);
  const [taskOverrides, setTaskOverrides] = useState<Record<string, 'pending' | 'completed'>>({});

  // Fetch live weather data for weather widgets
  const { data: liveWeatherItems } = useQuery<UniversalItem[]>({
    queryKey: ['dashboard-live-weather'],
    queryFn: async () => {
      try {
        return await fetchNormalisedData('weather', {
          useCurrentLocation: true,
          units: 'celsius',
          fallbackCity: 'New York',
        });
      } catch {
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
  });

  // Combine live weather data with standard mock items for rich display
  const combinedItems = useMemo(() => {
    const base =
      !liveWeatherItems || liveWeatherItems.length === 0
        ? mockUniversalItems
        : [
            ...liveWeatherItems,
            ...mockUniversalItems.filter((i) => i.type !== 'weather'),
          ];

    if (Object.keys(taskOverrides).length === 0) {
      return base;
    }

    return base.map((item) => {
      if (item.type === 'task' && taskOverrides[item.id]) {
        return {
          ...item,
          status: taskOverrides[item.id]!,
        };
      }
      return item;
    });
  }, [liveWeatherItems, taskOverrides]);

  const handleWidgetAction = useCallback(async (action: Action) => {
    if (!action || !action.type) return;

    switch (action.type) {
      case 'open_url': {
        if (action.url) {
          try {
            const canOpen = await Linking.canOpenURL(action.url);
            if (canOpen) {
              await Linking.openURL(action.url);
            } else {
              Alert.alert('Cannot Open Link', action.url);
            }
          } catch {
            Alert.alert('Error', 'Unable to open link in browser.');
          }
        }
        break;
      }
      case 'toggle_task': {
        const taskId = action.payload?.['taskId'] as string | undefined;
        const currentStatus = action.payload?.['currentStatus'] as string | undefined;
        if (taskId) {
          setTaskOverrides((prev) => {
            const current = prev[taskId] ?? currentStatus ?? 'pending';
            const next = current === 'completed' ? 'pending' : 'completed';
            return { ...prev, [taskId]: next };
          });
        }
        break;
      }
      case 'navigate': {
        if (action.route) {
          router.push(action.route as any);
        }
        break;
      }
      case 'run_connector': {
        queryClient.invalidateQueries({ queryKey: ['dashboard-live-weather'] });
        break;
      }
      case 'custom': {
        if (action.actionName === 'refresh' || action.actionName === 'refresh_all') {
          queryClient.invalidateQueries({ queryKey: ['dashboard-live-weather'] });
        }
        break;
      }
    }
  }, [queryClient]);

  const handleDeleteWidget = (id: string, name: string) => {
    Alert.alert(
      'Remove Widget',
      `Are you sure you want to remove "${name}" from your dashboard?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const repo = getWidgetRepository();
            await repo.delete(id);
            queryClient.invalidateQueries({ queryKey: ['widgets'] });
          },
        },
      ],
    );
  };

  const handleQuickAddWeather = async () => {
    try {
      const tmpl = getTemplate('weather-focus');
      const cloned = JSON.parse(JSON.stringify(tmpl.definition));
      cloned.id = `${cloned.id}-${Date.now().toString(36)}`;
      const repo = getWidgetRepository();
      await repo.create(cloned);
      queryClient.invalidateQueries({ queryKey: ['widgets'] });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not add weather widget.');
    }
  };

  if (isLoading) {
    return (
      <Screen style={styles.loadingContainer} contentContainerStyle={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard…</Text>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen style={styles.emptyContainer} contentContainerStyle={styles.emptyContainer}>
        <Icon name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.emptyTitle}>Something went wrong</Text>
        <Text style={styles.emptyDesc}>Could not load your widgets. Please try again.</Text>
      </Screen>
    );
  }

  if (widgets.length === 0) {
    return (
      <Screen style={styles.emptyContainer} contentContainerStyle={styles.emptyContainer}>
        <View style={[styles.emptyIconCircle, { backgroundColor: colors.primaryBackground }]}>
          <Icon name="cloud-sun" size={42} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Your Dashboard is Ready</Text>
        <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
          Add a live weather widget or build your own custom glanceable widgets.
        </Text>
        <View style={styles.emptyActions}>
          <Button
            label="Add Weather Widget"
            icon="plus"
            onPress={handleQuickAddWeather}
            style={styles.emptyButton}
          />
          <Button
            label="Browse All Widgets"
            variant="outline"
            icon="layout"
            onPress={() => router.push('/add')}
            style={styles.emptyButton}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.dateHeader, { color: colors.text }]}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <Text style={[styles.subHeader, { color: colors.textMuted }]}>
            {widgets.length} {widgets.length === 1 ? 'widget' : 'widgets'} active
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addIconBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/add')}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {widgets.map((widget) => (
        <View
          key={widget.id}
          style={[
            styles.widgetCardContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Card Meta Header */}
          <View style={styles.widgetHeader}>
            <View style={styles.widgetTitleRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryBackground }]}>
                <Icon name={getWidgetIcon(widget)} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.widgetTitle, { color: colors.text }]}>{widget.displayName}</Text>
              {widget.category ? (
                <View style={[styles.categoryBadge, { backgroundColor: colors.primaryBackground }]}>
                  <Text style={[styles.categoryText, { color: colors.primary }]}>{widget.category}</Text>
                </View>
              ) : null}
            </View>

            {/* Action Buttons: Add to Home Screen, Edit & Delete */}
            <View style={styles.widgetActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.surfaceHover }]}
                onPress={() => setHomeModalWidget(widget)}
                activeOpacity={0.7}
                accessibilityLabel="Add to Home Screen"
              >
                <Icon name="smartphone" size={15} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.surfaceHover }]}
                onPress={() => router.push(`/editor/${widget.id}`)}
                activeOpacity={0.7}
                accessibilityLabel="Edit Widget"
              >
                <Icon name="edit-3" size={15} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.surfaceHover }]}
                onPress={() => handleDeleteWidget(widget.id, widget.displayName)}
                activeOpacity={0.7}
                accessibilityLabel="Delete Widget"
              >
                <Icon name="trash-2" size={15} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Visual Widget Rendering */}
          <View style={styles.rendererWrapper}>
            <DeclarativeWidgetRenderer
              definition={widget}
              size={widget.defaultSize ?? 'medium'}
              items={combinedItems}
              onAction={handleWidgetAction}
            />
          </View>
        </View>
      ))}

      {/* Add to Home Screen Modal Sheet */}
      <AddToHomeScreenModal
        visible={!!homeModalWidget}
        onClose={() => setHomeModalWidget(null)}
        widget={homeModalWidget}
        items={combinedItems}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dateHeader: {
    ...typography.h2,
    fontSize: 22,
    color: colors.text,
  },
  subHeader: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  addIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  widgetCardContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
  },
  widgetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    flex: 1,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text,
    fontSize: 15,
  },
  categoryBadge: {
    backgroundColor: colors.primaryBackground,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  categoryText: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  widgetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rendererWrapper: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: radius.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h2,
    fontSize: 20,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptyDesc: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    maxWidth: 280,
    lineHeight: 20,
  },
  emptyActions: {
    width: '100%',
    maxWidth: 260,
    gap: spacing.sm,
  },
  emptyButton: {
    width: '100%',
  },
});

