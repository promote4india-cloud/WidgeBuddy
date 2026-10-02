/**
 * app/connections.tsx
 *
 * Manage external data source connections.
 *
 * Requirements (Prompt 12):
 * - connected/disconnected state
 * - provider name & metadata
 * - last successful sync
 * - reconnect
 * - disconnect
 * - connect action with OAuth authorization
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Screen } from '@/ui/Screen';
import { Icon } from '@/ui/Icon';
import { Button } from '@/ui/Button';
import { useTheme, radius, spacing, typography } from '@/ui/theme';
import {
  useConnectionStore,
  ConnectionItem,
  ProviderConnectionStatus,
} from '@/services/connectionManager';

function formatLastSync(timestamp: string | null): string {
  if (!timestamp) return 'Never synced';
  const now = Date.now();
  const syncTime = new Date(timestamp).getTime();
  const diffSec = Math.floor((now - syncTime) / 1000);

  if (diffSec < 45) return 'Synced just now';
  if (diffSec < 3600) return `Synced ${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `Synced ${Math.floor(diffSec / 3600)}h ago`;
  return new Date(timestamp).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ConnectionsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const connections = useConnectionStore((s) => s.connections);
  const activeAction = useConnectionStore((s) => s.activeProviderAction);
  const initConnections = useConnectionStore((s) => s.initConnections);
  const connectProvider = useConnectionStore((s) => s.connectProvider);
  const reconnectProvider = useConnectionStore((s) => s.reconnectProvider);
  const disconnectProvider = useConnectionStore((s) => s.disconnectProvider);
  const syncProvider = useConnectionStore((s) => s.syncProvider);

  const [connectModalProvider, setConnectModalProvider] = useState<ConnectionItem | null>(null);
  const [oauthEmail, setOauthEmail] = useState('alex.developer@gmail.com');

  useEffect(() => {
    initConnections();
  }, [initConnections]);

  const handleDisconnect = (conn: ConnectionItem) => {
    Alert.alert(
      `Disconnect ${conn.name}?`,
      `Widgets using ${conn.name} will not receive live updates until you reconnect.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => disconnectProvider(conn.id),
        },
      ],
    );
  };

  const handleReconnect = async (conn: ConnectionItem) => {
    const success = await reconnectProvider(conn.id);
    if (success) {
      Alert.alert('Reconnected', `${conn.name} has been successfully re-authenticated.`);
    } else {
      Alert.alert('Reconnect Failed', conn.errorMessage || 'Please try connecting again.');
    }
  };

  const handleSync = async (conn: ConnectionItem) => {
    const success = await syncProvider(conn.id);
    if (success) {
      Alert.alert('Sync Successful', `${conn.name} data refreshed.`);
    } else {
      Alert.alert('Sync Failed', conn.errorMessage || 'Unable to sync with provider.');
    }
  };

  const handleOpenConnect = (conn: ConnectionItem) => {
    setConnectModalProvider(conn);
  };

  const handleAuthorizeOAuth = async () => {
    if (!connectModalProvider) return;
    const providerId = connectModalProvider.id;
    setConnectModalProvider(null);

    const success = await connectProvider(providerId, oauthEmail);
    if (success) {
      Alert.alert('Connected!', `${connectModalProvider.name} is now connected and ready.`);
    } else {
      Alert.alert('Connection Failed', 'Could not authenticate with provider.');
    }
  };

  const renderStatusBadge = (status: ProviderConnectionStatus) => {
    switch (status) {
      case 'connected':
        return (
          <View style={[styles.badge, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
            <Icon name="check-circle-2" size={13} color={colors.success} />
            <Text style={[styles.badgeText, { color: colors.success }]}>Connected</Text>
          </View>
        );
      case 'expired':
        return (
          <View style={[styles.badge, { backgroundColor: 'rgba(245, 158, 11, 0.14)' }]}>
            <Icon name="alert-circle" size={13} color={colors.warning} />
            <Text style={[styles.badgeText, { color: colors.warning }]}>Token Expired</Text>
          </View>
        );
      case 'error':
        return (
          <View style={[styles.badge, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
            <Icon name="alert-circle" size={13} color={colors.error} />
            <Text style={[styles.badgeText, { color: colors.error }]}>Error</Text>
          </View>
        );
      case 'disconnected':
      default:
        return (
          <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
            <Icon name="circle" size={11} color={colors.textMuted} />
            <Text style={[styles.badgeText, { color: colors.textMuted }]}>Disconnected</Text>
          </View>
        );
    }
  };

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      <Stack.Screen
        options={{
          title: 'Data Connections',
          headerBackTitle: 'Back',
        }}
      />

      {/* Header Info */}
      <View style={styles.headerArea}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Connected Providers</Text>
        <Text style={[styles.headerDesc, { color: colors.textMuted }]}>
          Connect external services to populate your widgets with real-time data. Credentials and tokens are securely managed and never exposed to widgets.
        </Text>
      </View>

      {/* Connection Cards */}
      <View style={styles.list}>
        {connections.map((conn) => {
          const isBusy = activeAction === conn.id;

          return (
            <View
              key={conn.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor:
                    conn.status === 'expired'
                      ? colors.warning
                      : conn.status === 'error'
                      ? colors.error
                      : colors.border,
                },
              ]}
            >
              {/* Card Header: Icon, Name, Auth Type Badge & Status */}
              <View style={[styles.cardHeader, { borderBottomColor: colors.surfaceHover }]}>
                <View style={[styles.iconContainer, { backgroundColor: colors.surfaceHover }]}>
                  <Icon name={conn.icon} size={22} color={colors.primary} />
                </View>

                <View style={styles.infoArea}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.name, { color: colors.text }]}>{conn.name}</Text>
                    {renderStatusBadge(conn.status)}
                  </View>
                  <Text style={[styles.desc, { color: colors.textMuted }]}>{conn.description}</Text>
                </View>
              </View>

              {/* Account details & Sync telemetry */}
              <View style={styles.detailsArea}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Auth Type</Text>
                  <View style={[styles.authPill, { backgroundColor: colors.surfaceHover }]}>
                    <Text style={[styles.authText, { color: colors.primary }]}>
                      {conn.authType === 'oauth2'
                        ? 'OAuth 2.0'
                        : conn.authType === 'apiKey'
                        ? 'API Key'
                        : 'Open Source'}
                    </Text>
                  </View>
                </View>

                {conn.accountEmail && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Account</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {conn.accountEmail}
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Last Sync</Text>
                  <Text style={[styles.detailValue, { color: colors.textMuted }]}>
                    {formatLastSync(conn.lastSuccessfulSync)}
                  </Text>
                </View>

                {conn.errorMessage && (
                  <View style={styles.errorBox}>
                    <Icon name="alert-circle" size={14} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {conn.errorMessage}
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={[styles.cardFooter, { backgroundColor: colors.surfaceHover }]}>
                {isBusy ? (
                  <View style={styles.busyContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.busyText, { color: colors.textMuted }]}>
                      Processing...
                    </Text>
                  </View>
                ) : conn.status === 'connected' ? (
                  <View style={styles.footerActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: colors.border }]}
                      onPress={() => handleSync(conn)}
                    >
                      <Icon name="refresh-cw" size={14} color={colors.text} />
                      <Text style={[styles.actionBtnText, { color: colors.text }]}>Sync Now</Text>
                    </TouchableOpacity>

                    {conn.id === 'openweather' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: colors.border }]}
                        onPress={() => router.push('/weather-debug' as any)}
                      >
                        <Icon name="settings" size={14} color={colors.text} />
                        <Text style={[styles.actionBtnText, { color: colors.text }]}>Debug</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.dangerBtn]}
                      onPress={() => handleDisconnect(conn)}
                    >
                      <Icon name="x-circle" size={14} color={colors.error} />
                      <Text style={[styles.actionBtnText, { color: colors.error }]}>Disconnect</Text>
                    </TouchableOpacity>
                  </View>
                ) : conn.status === 'expired' ? (
                  <View style={styles.footerActions}>
                    <TouchableOpacity
                      style={[styles.reconnectBtn, { backgroundColor: colors.warning }]}
                      onPress={() => handleReconnect(conn)}
                    >
                      <Icon name="refresh-cw" size={14} color="#ffffff" />
                      <Text style={styles.reconnectBtnText}>Reconnect Account</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.dangerBtn]}
                      onPress={() => handleDisconnect(conn)}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.error }]}>Disconnect</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.connectBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleOpenConnect(conn)}
                  >
                    <Icon name={conn.authType === 'oauth2' ? 'lock' : 'check'} size={14} color="#ffffff" />
                    <Text style={styles.connectBtnText}>
                      {conn.authType === 'oauth2' ? `Connect with ${conn.name}` : `Connect ${conn.name}`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* OAuth Connect Modal */}
      <Modal
        visible={Boolean(connectModalProvider)}
        transparent
        animationType="fade"
        onRequestClose={() => setConnectModalProvider(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconBox, { backgroundColor: colors.surfaceHover }]}>
                <Icon
                  name={connectModalProvider?.icon || 'calendar'}
                  size={26}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Connect {connectModalProvider?.name}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                WidgeBuddy requests read-only access to synchronize events into your dashboard widgets.
              </Text>
            </View>

            {/* Scopes Requested */}
            <View style={[styles.scopeBox, { backgroundColor: colors.surfaceHover, borderColor: colors.border }]}>
              <Text style={[styles.scopeHeader, { color: colors.text }]}>Permissions Requested</Text>
              <View style={styles.scopeItem}>
                <Icon name="check" size={14} color={colors.success} />
                <Text style={[styles.scopeText, { color: colors.textMuted }]}>
                  View calendar events and schedule (read-only)
                </Text>
              </View>
              <View style={styles.scopeItem}>
                <Icon name="check" size={14} color={colors.success} />
                <Text style={[styles.scopeText, { color: colors.textMuted }]}>
                  Keep calendar cache synchronized
                </Text>
              </View>
            </View>

            {/* Email field */}
            <View style={styles.inputArea}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Account Email</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                ]}
                value={oauthEmail}
                onChangeText={setOauthEmail}
                placeholder="you@gmail.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="outline"
                onPress={() => setConnectModalProvider(null)}
                style={{ flex: 1 }}
              />
              <Button
                label="Authorize"
                variant="primary"
                onPress={handleAuthorizeOAuth}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerArea: {
    marginBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.h2,
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  headerDesc: {
    ...typography.body,
    lineHeight: 20,
  },
  list: {
    gap: spacing.lg,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoArea: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    ...typography.h3,
    fontSize: 16,
  },
  desc: {
    ...typography.caption,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailsArea: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    ...typography.caption,
    fontSize: 12,
  },
  detailValue: {
    ...typography.captionMedium,
    fontSize: 12,
  },
  authPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  authText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    fontSize: 11,
    flex: 1,
  },
  cardFooter: {
    padding: spacing.sm,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  actionBtnText: {
    ...typography.captionMedium,
    fontSize: 12,
  },
  dangerBtn: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  reconnectBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  reconnectBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radius.md,
  },
  connectBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
  busyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 8,
  },
  busyText: {
    ...typography.caption,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.h2,
    fontSize: 20,
    marginBottom: 4,
  },
  modalSubtitle: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
  scopeBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  scopeHeader: {
    ...typography.captionMedium,
    fontSize: 12,
    marginBottom: 4,
  },
  scopeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scopeText: {
    fontSize: 12,
    flex: 1,
  },
  inputArea: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.captionMedium,
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
