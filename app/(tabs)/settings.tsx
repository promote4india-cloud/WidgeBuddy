/**
 * app/(tabs)/settings.tsx
 *
 * Settings screen with Appearance (Light / Dark mode selection),
 * Data Connections, and system diagnostics.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Screen } from '@/ui/Screen';
import { Icon, IconName } from '@/ui/Icon';
import { useTheme, radius, spacing, typography } from '@/ui/theme';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { theme, isDark, colors, setTheme } = useTheme();

  const GENERAL_ITEMS = [
    { id: 'connections', title: 'Data Connections', desc: 'Manage Open-Meteo, Calendar, RSS', icon: 'plug' as IconName, route: '/connections' },
    { id: 'weather-debug', title: 'Weather Debug & Telemetry', desc: 'GPS vs city, cache status, fault simulator', icon: 'activity' as IconName, route: '/weather-debug' },
  ];

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.appearanceHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryBackground }]}>
              <Icon name="palette" size={20} color={colors.primary} />
            </View>
            <View style={styles.appearanceInfo}>
              <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Theme Mode</Text>
              <Text style={[styles.cardHeaderDesc, { color: colors.textMuted }]}>
                Choose your preferred interface appearance
              </Text>
            </View>
          </View>

          {/* 2 Options: Light or Dark */}
          <View style={styles.optionsRow}>
            {/* Light Option */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                { backgroundColor: colors.surfaceHover, borderColor: colors.border },
                !isDark && [styles.optionCardActive, { borderColor: colors.primary, backgroundColor: colors.surface }],
              ]}
              activeOpacity={0.8}
              onPress={() => setTheme('light')}
            >
              <View style={[styles.optionIconCircle, { backgroundColor: !isDark ? colors.primaryBackground : colors.surface }]}>
                <Icon name="sun" size={22} color={!isDark ? colors.primary : colors.textMuted} />
              </View>
              <Text style={[styles.optionLabel, { color: !isDark ? colors.primary : colors.text }]}>
                Light
              </Text>
              <Text style={[styles.optionSub, { color: colors.textMuted }]}>Clean & bright</Text>
              {!isDark && (
                <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                  <Icon name="check" size={12} color="#ffffff" />
                </View>
              )}
            </TouchableOpacity>

            {/* Dark Option */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                { backgroundColor: colors.surfaceHover, borderColor: colors.border },
                isDark && [styles.optionCardActive, { borderColor: colors.primary, backgroundColor: colors.surface }],
              ]}
              activeOpacity={0.8}
              onPress={() => setTheme('dark')}
            >
              <View style={[styles.optionIconCircle, { backgroundColor: isDark ? colors.primaryBackground : colors.surface }]}>
                <Icon name="moon" size={22} color={isDark ? colors.primary : colors.textMuted} />
              </View>
              <Text style={[styles.optionLabel, { color: isDark ? colors.primary : colors.text }]}>
                Dark
              </Text>
              <Text style={[styles.optionSub, { color: colors.textMuted }]}>Sleek & nocturnal</Text>
              {isDark && (
                <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                  <Icon name="check" size={12} color="#ffffff" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* General Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Connections & Diagnostics</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {GENERAL_ITEMS.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={[styles.row, { backgroundColor: colors.surface }]}
                activeOpacity={0.7}
                onPress={() => item.route && router.push(item.route as any)}
              >
                <View style={[styles.iconContainer, { backgroundColor: colors.surfaceHover }]}>
                  <Icon name={item.icon} size={20} color={colors.textMuted} />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.rowDesc, { color: colors.textMuted }]}>{item.desc}</Text>
                </View>
                <Icon name="chevron-right" size={20} color={colors.border} />
              </TouchableOpacity>
              {index < GENERAL_ITEMS.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.surfaceHover }]} />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* App Info Footnote */}
      <View style={styles.footerInfo}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          WidgeBuddy v1.0.0 • React Native + Expo
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.captionMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  appearanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  appearanceInfo: {
    flex: 1,
  },
  cardHeaderTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    fontSize: 16,
  },
  cardHeaderDesc: {
    ...typography.caption,
    fontSize: 12,
    marginTop: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  optionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    position: 'relative',
  },
  optionCardActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  optionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs + 2,
  },
  optionLabel: {
    ...typography.bodyMedium,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 2,
  },
  optionSub: {
    ...typography.caption,
    fontSize: 11,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  rowDesc: {
    ...typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginLeft: 38 + spacing.md + spacing.lg,
  },
  footerInfo: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  footerText: {
    ...typography.caption,
    fontSize: 12,
  },
});
