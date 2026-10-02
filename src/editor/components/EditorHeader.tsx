/**
 * src/editor/components/EditorHeader.tsx
 *
 * Header controls for the widget editor:
 * - Widget display name and description inputs
 * - Schema validation status indicator
 * - Save Widget action button
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Icon } from '@/ui/Icon';
import { colors, radius, spacing, typography } from '@/ui/theme';
import { useEditorStore } from '@/store/editorStore';
import { validateWidgetDefinition } from '@/widgets/declarative/validation';

interface EditorHeaderProps {
  onSave: () => void;
  isSaving: boolean;
  saveSuccess: boolean;
  onAddToHomeScreen?: () => void;
}

export function EditorHeader({ onSave, isSaving, saveSuccess, onAddToHomeScreen }: EditorHeaderProps) {
  const draft = useEditorStore((s) => s.draft);
  const setName = useEditorStore((s) => s.setName);
  const setDescription = useEditorStore((s) => s.setDescription);

  if (!draft) return null;

  const validation = validateWidgetDefinition(draft);
  const isValid = validation.success;

  return (
    <View style={styles.headerCard}>
      <View style={styles.topRow}>
        <View style={styles.titleArea}>
          <Text style={styles.label}>Widget Name</Text>
          <TextInput
            style={styles.nameInput}
            value={draft.displayName}
            onChangeText={setName}
            placeholder="Name your widget..."
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.actionsRow}>
          {onAddToHomeScreen && (
            <TouchableOpacity
              style={styles.homeBtn}
              onPress={onAddToHomeScreen}
              activeOpacity={0.8}
              accessibilityLabel="Add to Home Screen"
            >
              <Icon name="smartphone" size={15} color={colors.primary} />
              <Text style={styles.homeBtnText}>Home</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.saveBtn,
              (!isValid || isSaving) && styles.saveBtnDisabled,
              saveSuccess && styles.saveBtnSuccess,
            ]}
            onPress={onSave}
            disabled={!isValid || isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : saveSuccess ? (
              <>
                <Icon name="check" size={16} color="#ffffff" />
                <Text style={styles.saveBtnText}>Saved!</Text>
              </>
            ) : (
              <>
                <Icon name="save" size={16} color="#ffffff" />
                <Text style={styles.saveBtnText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.descArea}>
        <TextInput
          style={styles.descInput}
          value={draft.description || ''}
          onChangeText={setDescription}
          placeholder="Add an optional description..."
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Validation status badge */}
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusBadge,
            isValid ? styles.statusBadgeValid : styles.statusBadgeInvalid,
          ]}
        >
          <Icon
            name={isValid ? 'check-circle-2' : 'alert-circle'}
            size={12}
            color={isValid ? colors.success : colors.error}
          />
          <Text
            style={[
              styles.statusText,
              isValid ? styles.statusTextValid : styles.statusTextInvalid,
            ]}
          >
            {isValid ? 'Schema Valid' : 'Incomplete configuration'}
          </Text>
        </View>
        <Text style={styles.versionTag}>v{draft.version || '1.0.0'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleArea: {
    flex: 1,
  },
  label: {
    ...typography.captionMedium,
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameInput: {
    ...typography.h2,
    fontSize: 20,
    color: colors.text,
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  descArea: {
    marginTop: spacing.xs,
  },
  descInput: {
    ...typography.caption,
    color: colors.textMuted,
    paddingVertical: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceHover || colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    justifyContent: 'center',
  },
  homeBtnText: {
    ...typography.captionMedium,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    minWidth: 84,
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnSuccess: {
    backgroundColor: colors.success,
  },
  saveBtnText: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: '#ffffff',
    fontSize: 13,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusBadgeValid: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusBadgeInvalid: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextValid: {
    color: colors.success,
  },
  statusTextInvalid: {
    color: colors.error,
  },
  versionTag: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
});
