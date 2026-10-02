/**
 * app/editor/[type].tsx
 *
 * Functional Widget Editor Screen for WidgeBuddy.
 * Allows users to:
 * - Create a widget from scratch or templates (e.g. My Day)
 * - Name and describe it
 * - Choose/switch layout sizes (small, medium, large)
 * - Add components from a palette of 10 types
 * - Remove components
 * - Reorder components up and down
 * - Edit basic component properties in real-time
 * - Preview the widget live with mock normalized data
 * - Save the widget definition via WidgetRepository
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/ui/Screen';
import { colors, spacing, typography } from '@/ui/theme';
import { useEditorStore } from '@/store/editorStore';
import {
  EditorHeader,
  EditorPreview,
  ComponentTree,
  PropertyInspector,
  ComponentPaletteModal,
} from '@/editor/components';
import { AddToHomeScreenModal } from '@/ui/AddToHomeScreenModal';
import { getWidgetRepository } from '@/repositories';
import { validateWidgetDefinition } from '@/widgets/declarative/validation';

export default function WidgetEditorScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const draft = useEditorStore((s) => s.draft);
  const initNewWidget = useEditorStore((s) => s.initNewWidget);
  const loadWidget = useEditorStore((s) => s.loadWidget);
  const queryClient = useQueryClient();

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showHomeModal, setShowHomeModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const repo = getWidgetRepository();

    async function initialize() {
      const widgetType = type || 'new';

      if (
        widgetType === 'new' ||
        widgetType === 'blank' ||
        widgetType === 'my-day' ||
        widgetType === 'weather-focus' ||
        widgetType === 'weather-card' ||
        widgetType === 'weather'
      ) {
        const templateId =
          widgetType === 'new'
            ? 'my-day'
            : widgetType === 'weather-card' || widgetType === 'weather'
              ? 'weather-focus'
              : widgetType;
        initNewWidget(templateId);
        return;
      }

      // Check if it's a locally saved custom widget
      const saved = await repo.get(widgetType);
      if (saved && isMounted) {
        loadWidget(saved);
        return;
      }

      // Fallback: initialize new widget
      if (isMounted) {
        initNewWidget('weather-focus');
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };
  }, [type, initNewWidget, loadWidget]);

  const handleSave = async () => {
    if (!draft) return;

    const validation = validateWidgetDefinition(draft);
    if (!validation.success) {
      Alert.alert(
        'Validation Error',
        `Please fix the following issues before saving:\n\n${validation.errorSummary}`,
      );
      return;
    }

    try {
      setIsSaving(true);
      const repo = getWidgetRepository();

      // Upsert: try update first, fall back to create for new widgets
      const existing = await repo.get(draft.id);
      if (existing) {
        await repo.update(draft.id, draft);
      } else {
        await repo.create(draft);
      }

      // Invalidate widget queries so dashboard and library refresh
      queryClient.invalidateQueries({ queryKey: ['widgets'] });

      setSaveSuccess(true);
      Alert.alert(
        'Widget Saved!',
        `"${draft.displayName}" has been saved to your dashboard. Would you like to pin it to your Home Screen?`,
        [
          { text: 'Add to Home Screen', onPress: () => setShowHomeModal(true) },
          { text: 'View Dashboard', onPress: () => router.push('/dashboard') },
          { text: 'Keep Editing', style: 'cancel' },
        ],
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred while saving.';
      Alert.alert('Save Failed', msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (!draft) {
    return (
      <Screen contentContainerStyle={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Loading Editor...' }} />
        <Text style={styles.loadingText}>Loading widget editor...</Text>
      </Screen>
    );
  }

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      <Stack.Screen
        options={{
          title: `Edit: ${draft.displayName || 'Widget'}`,
          headerBackTitle: 'Back',
        }}
      />

      {/* Header: Title, Description, Validation Status, Save Button & Home Screen Pin */}
      <EditorHeader
        onSave={handleSave}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        onAddToHomeScreen={() => setShowHomeModal(true)}
      />

      {/* Live Preview & Size Selector */}
      <EditorPreview />

      {/* Component Tree Structure: Reorder Up/Down, Remove, Add */}
      <ComponentTree />

      {/* Dynamic Property Inspector for selected element */}
      <PropertyInspector />

      {/* Component Palette Modal Sheet */}
      <ComponentPaletteModal />

      {/* Add To Native Home Screen Modal */}
      <AddToHomeScreenModal
        visible={showHomeModal}
        onClose={() => setShowHomeModal(false)}
        widget={draft}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.background,
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
  },
});
