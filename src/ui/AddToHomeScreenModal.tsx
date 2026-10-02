/**
 * src/ui/AddToHomeScreenModal.tsx
 *
 * Interactive modal presenting platform-specific instructions and actions
 * to pin or add user-created widgets to Android & iOS Home Screens.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Icon } from './Icon';
import { Button } from './Button';
import { useTheme, radius, spacing, typography } from './theme';
import { DeclarativeWidgetDefinition } from '@/widgets/declarative/definition';
import { UniversalItem } from '@/widgets/schema';
import {
  homeScreenWidgetService,
  PinWidgetResult,
} from '@/services/homeScreenWidgetService';

export interface AddToHomeScreenModalProps {
  visible: boolean;
  onClose: () => void;
  widget: DeclarativeWidgetDefinition | null;
  items?: UniversalItem[];
}

export function AddToHomeScreenModal({
  visible,
  onClose,
  widget,
  items = [],
}: AddToHomeScreenModalProps) {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PinWidgetResult | null>(null);

  if (!widget) return null;

  const isAndroid = Platform.OS === 'android';
  const isIos = Platform.OS === 'ios';
  const isExpoGo = homeScreenWidgetService.isExpoGoEnvironment();

  const handleSyncAndPin = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await homeScreenWidgetService.requestPinHomeScreenWidget(widget, items);
      setResult(res);
    } catch (e: any) {
      setResult({
        success: false,
        platform: isAndroid ? 'android' : isIos ? 'ios' : 'web',
        isNativeSupported: false,
        message: e?.message || 'Synchronization failed.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryBackground }]}>
              <Icon name="smartphone" size={24} color={colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>
                Add to Home Screen
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {widget.displayName} • {widget.defaultSize || 'Medium'} size
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceHover }]}
              accessibilityLabel="Close"
            >
              <Icon name="x" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Platform Specific Content */}
          <View style={styles.content}>
            {isExpoGo ? (
              <View
                style={[
                  styles.expoGoBanner,
                  {
                    backgroundColor: isDark ? '#451a03' : '#fffbeb',
                    borderColor: isDark ? '#b45309' : '#fde68a',
                  },
                ]}
              >
                <View style={styles.bannerHeader}>
                  <Icon name="alert-triangle" size={16} color={isDark ? '#fbbf24' : '#d97706'} />
                  <Text
                    style={[
                      styles.bannerTitle,
                      { color: isDark ? '#fef3c7' : '#92400e' },
                    ]}
                  >
                    Running in Expo Go Sandbox
                  </Text>
                </View>
                <Text
                  style={[
                    styles.bannerBody,
                    { color: isDark ? '#fde68a' : '#b45309' },
                  ]}
                >
                  Expo Go cannot add widgets to your physical phone's home screen. Mobile OSes require compiled native app extensions (WidgetKit / AppWidget). This widget is already active on your in-app Dashboard. To display it on your launcher, build a standalone app.
                </Text>
              </View>
            ) : null}

            {isAndroid ? (
              <View style={styles.platformSection}>
                <View style={[styles.stepBox, { backgroundColor: colors.surfaceHover }]}>
                  <View style={styles.stepHeader}>
                    <Icon name="check-circle-2" size={16} color={colors.success} />
                    <Text style={[styles.stepTitle, { color: colors.text }]}>
                      In-App Dashboard
                    </Text>
                  </View>
                  <Text style={[styles.stepBody, { color: colors.textMuted }]}>
                    "{widget.displayName}" is active on your WidgeBuddy Dashboard right now.
                  </Text>
                </View>

                <View style={[styles.stepBox, { backgroundColor: colors.surfaceHover }]}>
                  <View style={styles.stepHeader}>
                    <Icon name="layers" size={16} color={colors.primary} />
                    <Text style={[styles.stepTitle, { color: colors.text }]}>
                      Android Launcher Pinning
                    </Text>
                  </View>
                  <Text style={[styles.stepBody, { color: colors.textMuted }]}>
                    In standalone native builds, Android can automatically prompt you to pin this widget, or you can long-press any empty space on your phone launcher and drag WidgeBuddy from the "Widgets" drawer.
                  </Text>
                </View>
              </View>
            ) : isIos ? (
              <View style={styles.platformSection}>
                <View style={[styles.stepBox, { backgroundColor: colors.surfaceHover }]}>
                  <View style={styles.stepHeader}>
                    <Icon name="check-circle-2" size={16} color={colors.success} />
                    <Text style={[styles.stepTitle, { color: colors.text }]}>
                      In-App Dashboard
                    </Text>
                  </View>
                  <Text style={[styles.stepBody, { color: colors.textMuted }]}>
                    "{widget.displayName}" is active on your WidgeBuddy Dashboard right now.
                  </Text>
                </View>

                <Text style={[styles.iosIntro, { color: colors.textMuted }]}>
                  On iOS, Apple requires adding widgets manually through Jiggle Mode:
                </Text>

                <View style={[styles.iosStepRow, { backgroundColor: colors.surfaceHover }]}>
                  <View style={[styles.iosStepNum, { backgroundColor: colors.primaryBackground }]}>
                    <Text style={[styles.iosStepNumText, { color: colors.primary }]}>1</Text>
                  </View>
                  <Text style={[styles.iosStepText, { color: colors.text }]}>
                    Touch & hold any empty area on your iPhone Home Screen until the apps jiggle.
                  </Text>
                </View>

                <View style={[styles.iosStepRow, { backgroundColor: colors.surfaceHover }]}>
                  <View style={[styles.iosStepNum, { backgroundColor: colors.primaryBackground }]}>
                    <Text style={[styles.iosStepNumText, { color: colors.primary }]}>2</Text>
                  </View>
                  <Text style={[styles.iosStepText, { color: colors.text }]}>
                    Tap the <Text style={{ fontWeight: 'bold' }}>+</Text> button in the top corner to open the Widget Gallery.
                  </Text>
                </View>

                <View style={[styles.iosStepRow, { backgroundColor: colors.surfaceHover }]}>
                  <View style={[styles.iosStepNum, { backgroundColor: colors.primaryBackground }]}>
                    <Text style={[styles.iosStepNumText, { color: colors.primary }]}>3</Text>
                  </View>
                  <Text style={[styles.iosStepText, { color: colors.text }]}>
                    Search for <Text style={{ fontWeight: 'bold' }}>WidgeBuddy</Text> and tap <Text style={{ fontWeight: 'bold' }}>Add Widget</Text>.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.stepBox, { backgroundColor: colors.surfaceHover }]}>
                <Text style={[styles.stepBody, { color: colors.text }]}>
                  Syncing "{widget.displayName}" to home screen storage bridge.
                </Text>
              </View>
            )}

            {/* Sync Feedback Result */}
            {result && (
              <View
                style={[
                  styles.resultBox,
                  {
                    backgroundColor: result.success ? (isDark ? '#064e3b' : '#ecfdf5') : '#fef2f2',
                    borderColor: result.success ? '#10b981' : '#f87171',
                  },
                ]}
              >
                <Icon
                  name={result.success ? 'check-circle-2' : 'alert-circle'}
                  size={16}
                  color={result.success ? '#10b981' : '#ef4444'}
                />
                <Text
                  style={[
                    styles.resultText,
                    { color: result.success ? (isDark ? '#34d399' : '#047857') : '#b91c1c' },
                  ]}
                >
                  {result.message}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <Button
              label={
                loading
                  ? 'Syncing...'
                  : result?.success
                    ? isExpoGo
                      ? 'Synced to In-App Dashboard!'
                      : 'Synced to Home Screen!'
                    : isExpoGo
                      ? 'Sync Widget Definition'
                      : 'Set as Home Widget'
              }
              icon="smartphone"
              onPress={handleSyncAndPin}
              disabled={loading}
              fullWidth
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    fontSize: 17,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  expoGoBanner: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 6,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  bannerTitle: {
    ...typography.captionMedium,
    fontWeight: '700',
    fontSize: 12,
  },
  bannerBody: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 15,
  },
  platformSection: {
    gap: spacing.sm,
  },
  stepBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    gap: 4,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  stepTitle: {
    ...typography.captionMedium,
    fontWeight: '700',
    fontSize: 12,
  },
  stepBody: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
  iosIntro: {
    ...typography.caption,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  iosStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  iosStepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosStepNumText: {
    fontSize: 12,
    fontWeight: '700',
  },
  iosStepText: {
    ...typography.caption,
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  resultText: {
    ...typography.caption,
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.xs,
  },
});
