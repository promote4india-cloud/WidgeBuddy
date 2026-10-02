/**
 * app/weather-debug.tsx
 *
 * Weather preview and debug screen.
 * Allows developers and users to:
 * - Inspect live weather data and connector status
 * - Toggle between GPS and manual city lookup
 * - Test location permission denial handling
 * - Inspect caching and stale data fallback
 * - Verify that only normalized UniversalItem data reaches the widget layer
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Screen } from '@/ui/Screen';
import { Icon } from '@/ui/Icon';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { colors, radius, spacing, typography } from '@/ui/theme';
import { weatherConnector } from '@/connectors/weather/weather.connector';
import { locationService } from '@/services/locationService';
import { UniversalItem } from '@/widgets/schema';
import { ConnectionHealth, NormalizedDataResult } from '@/connectors/base/connector.types';

export default function WeatherDebugScreen() {
  const router = useRouter();

  // Configuration state
  const [city, setCity] = useState('New York');
  const [useGps, setUseGps] = useState(true);
  const [units, setUnits] = useState<'celsius' | 'fahrenheit'>('celsius');
  const [simulateDenial, setSimulateDenial] = useState(false);
  const [simulateApiFailure, setSimulateApiFailure] = useState(false);

  // Fetch status & data state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NormalizedDataResult | null>(null);
  const [health, setHealth] = useState<ConnectionHealth | null>(null);
  const [cacheEntries, setCacheEntries] = useState<any[]>([]);

  const fetchWeather = useCallback(
    async (forceRefresh = false) => {
      setLoading(true);
      setError(null);

      try {
        // Set simulation hooks
        locationService.setMockPermission(simulateDenial ? 'denied' : null);

        if (simulateApiFailure) {
          throw new Error('Simulated upstream weather API failure (HTTP 503).');
        }

        // Connect with active config
        await weatherConnector.connect({
          city,
          useCurrentLocation: useGps,
          units,
          fallbackCity: 'New York',
        });

        // Fetch or refresh
        const res = forceRefresh
          ? await weatherConnector.refresh()
          : await weatherConnector.fetch();

        setResult(res);
        const h = await weatherConnector.health();
        setHealth(h);
        setCacheEntries(weatherConnector.getCache().inspect());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown weather error');
      } finally {
        setLoading(false);
      }
    },
    [city, useGps, units, simulateDenial, simulateApiFailure],
  );

  useEffect(() => {
    fetchWeather(false);
  }, [fetchWeather]);

  const weatherItem = result?.items[0] as UniversalItem | undefined;
  const isStale = Boolean(weatherItem?.meta?.['isStale']);
  const locationStatus = String(weatherItem?.meta?.['locationStatus'] ?? 'unknown');

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      <Stack.Screen
        options={{
          title: 'Weather Preview & Debug',
          headerBackTitle: 'Back',
        }}
      />

      {/* Security & Health Banner */}
      <Card style={styles.bannerCard}>
        <View style={styles.bannerHeader}>
          <View style={styles.securityBadge}>
            <Icon name="shield-check" size={16} color={colors.success} />
            <Text style={styles.securityText}>Server-Side API Key (Secure)</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: error ? '#fee2e2' : '#dcfce7' },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: error ? '#dc2626' : '#16a34a' },
              ]}
            >
              {error ? 'Error' : 'Connected'}
            </Text>
          </View>
        </View>
        <Text style={styles.bannerSubtext}>
          No API keys are exposed to the client. Responses are cached with stale
          data fallback and GPS denial resilience.
        </Text>
      </Card>

      {/* Main Weather Card Preview */}
      <Card style={styles.previewCard}>
        <Text style={styles.sectionTitle}>Widget Preview</Text>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Fetching weather data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Icon name="alert-triangle" size={24} color={colors.error} />
            <Text style={styles.errorTitle}>Weather Unavailable</Text>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
        ) : weatherItem?.type === 'weather' ? (
          <View style={styles.weatherDisplay}>
            <View style={styles.weatherTopRow}>
              <View>
                <Text style={styles.cityName}>
                  {String(weatherItem.meta?.['cityName'] ?? city)}
                </Text>
                <Text style={styles.conditionText}>{weatherItem.condition}</Text>
              </View>
              <Text style={styles.temperature}>
                {Math.round(weatherItem.temp)}°
                <Text style={styles.tempUnit}>{units === 'celsius' ? 'C' : 'F'}</Text>
              </Text>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Text style={styles.metaLabel}>Feels Like</Text>
                <Text style={styles.metaValue}>
                  {weatherItem.feelsLike !== undefined
                    ? `${Math.round(weatherItem.feelsLike)}°`
                    : '—'}
                </Text>
              </View>
              <View style={styles.metaPill}>
                <Text style={styles.metaLabel}>Humidity</Text>
                <Text style={styles.metaValue}>{weatherItem.humidity}%</Text>
              </View>
              <View style={styles.metaPill}>
                <Text style={styles.metaLabel}>Wind</Text>
                <Text style={styles.metaValue}>
                  {String(weatherItem.meta?.['windSpeed'] ?? '—')} km/h
                </Text>
              </View>
            </View>

            {/* Badges */}
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.dataBadge,
                  isStale ? styles.staleBadge : styles.freshBadge,
                ]}
              >
                <Text
                  style={[
                    styles.dataBadgeText,
                    isStale ? styles.staleText : styles.freshText,
                  ]}
                >
                  {isStale ? '● Stale Data' : '● Fresh Data'}
                </Text>
              </View>

              <View style={styles.locationBadge}>
                <Icon
                  name={locationStatus === 'gps' ? 'navigation' : 'map-pin'}
                  size={12}
                  color={colors.textMuted}
                />
                <Text style={styles.locationBadgeText}>
                  {locationStatus === 'gps'
                    ? 'Device GPS'
                    : locationStatus === 'permission_denied_fallback'
                      ? 'Permission Denied (Fallback City)'
                      : 'City Lookup'}
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </Card>

      {/* Location & Unit Controls */}
      <Card style={styles.controlsCard}>
        <Text style={styles.sectionTitle}>Location & Units</Text>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.toggleBtn, useGps && styles.toggleBtnActive]}
            onPress={() => setUseGps(true)}
          >
            <Icon
              name="navigation"
              size={16}
              color={useGps ? colors.surface : colors.text}
            />
            <Text style={[styles.toggleText, useGps && styles.toggleTextActive]}>
              Use GPS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, !useGps && styles.toggleBtnActive]}
            onPress={() => setUseGps(false)}
          >
            <Icon
              name="map-pin"
              size={16}
              color={!useGps ? colors.surface : colors.text}
            />
            <Text style={[styles.toggleText, !useGps && styles.toggleTextActive]}>
              Custom City
            </Text>
          </TouchableOpacity>
        </View>

        {!useGps && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>City Name:</Text>
            <TextInput
              style={styles.textInput}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. London, Tokyo, Paris"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        )}

        <View style={styles.unitRow}>
          <Text style={styles.inputLabel}>Temperature Unit:</Text>
          <View style={styles.unitSelector}>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                units === 'celsius' && styles.unitBtnActive,
              ]}
              onPress={() => setUnits('celsius')}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  units === 'celsius' && styles.unitBtnTextActive,
                ]}
              >
                °C
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                units === 'fahrenheit' && styles.unitBtnActive,
              ]}
              onPress={() => setUnits('fahrenheit')}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  units === 'fahrenheit' && styles.unitBtnTextActive,
                ]}
              >
                °F
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* Cache & Actions */}
      <Card style={styles.cacheCard}>
        <Text style={styles.sectionTitle}>Cache & Refresh Operations</Text>

        <View style={styles.actionButtons}>
          <Button
            label="Fetch (Cache Check)"
            variant="outline"
            onPress={() => fetchWeather(false)}
            disabled={loading}
          />
          <Button
            label="Force Refresh (Bypass Cache)"
            variant="primary"
            onPress={() => fetchWeather(true)}
            disabled={loading}
          />
        </View>

        <Text style={styles.cacheInfoTitle}>Active Cache Entries:</Text>
        {cacheEntries.length === 0 ? (
          <Text style={styles.cacheEmptyText}>Cache is currently empty.</Text>
        ) : (
          cacheEntries.map((e, idx) => (
            <View key={idx} style={styles.cacheEntry}>
              <Text style={styles.cacheKey}>{e.key}</Text>
              <Text style={styles.cacheDetails}>
                Age: {e.ageSeconds}s | {e.isFresh ? 'Fresh' : 'Stale'}
              </Text>
            </View>
          ))
        )}
      </Card>

      {/* Fault Injection / Simulation Controls */}
      <Card style={styles.simulationCard}>
        <Text style={styles.sectionTitle}>Fault Injection Simulators</Text>
        <Text style={styles.simDescription}>
          Verify that the app never crashes when external conditions fail:
        </Text>

        <View style={styles.simButtons}>
          <TouchableOpacity
            style={[
              styles.simBtn,
              simulateDenial && styles.simBtnActive,
            ]}
            onPress={() => {
              setSimulateDenial(!simulateDenial);
              locationService.setMockPermission(!simulateDenial ? 'denied' : null);
            }}
          >
            <Icon
              name="slash"
              size={16}
              color={simulateDenial ? '#b91c1c' : colors.text}
            />
            <Text
              style={[
                styles.simBtnText,
                simulateDenial && styles.simBtnTextActive,
              ]}
            >
              Simulate GPS Denial: {simulateDenial ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.simBtn,
              simulateApiFailure && styles.simBtnActive,
            ]}
            onPress={() => setSimulateApiFailure(!simulateApiFailure)}
          >
            <Icon
              name="cloud-off"
              size={16}
              color={simulateApiFailure ? '#b91c1c' : colors.text}
            />
            <Text
              style={[
                styles.simBtnText,
                simulateApiFailure && styles.simBtnTextActive,
              ]}
            >
              Simulate API 500 Failure: {simulateApiFailure ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Raw Universal Item (Proving Provider Isolation) */}
      <Card style={styles.rawCard}>
        <Text style={styles.sectionTitle}>Normalized UniversalItem (Layer 3)</Text>
        <Text style={styles.rawSubtext}>
          Widgets only consume this normalized model. Upstream provider details
          are isolated.
        </Text>
        <ScrollView horizontal style={styles.codeScrollView}>
          <Text style={styles.codeText}>
            {JSON.stringify(weatherItem ?? { message: 'No item available' }, null, 2)}
          </Text>
        </ScrollView>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
  },
  bannerCard: {
    backgroundColor: '#f8fafc',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  securityText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#0f766e',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    ...typography.caption,
    fontWeight: '700',
  },
  bannerSubtext: {
    ...typography.caption,
    color: colors.textMuted,
  },
  previewCard: {
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  centerBox: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  errorBox: {
    padding: spacing.lg,
    backgroundColor: '#fef2f2',
    borderRadius: radius.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  errorTitle: {
    ...typography.bodyMedium,
    color: colors.error,
    fontWeight: '700',
  },
  errorMessage: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
  },
  weatherDisplay: {
    gap: spacing.md,
  },
  weatherTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cityName: {
    ...typography.h2,
    fontWeight: '700',
  },
  conditionText: {
    ...typography.body,
    color: colors.textMuted,
  },
  temperature: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text,
  },
  tempUnit: {
    fontSize: 24,
    fontWeight: '500',
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metaPill: {
    flex: 1,
    backgroundColor: colors.surfaceHover,
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  metaValue: {
    ...typography.bodyMedium,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dataBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  freshBadge: {
    backgroundColor: '#dcfce7',
  },
  staleBadge: {
    backgroundColor: '#fef3c7',
  },
  dataBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  freshText: {
    color: '#15803d',
  },
  staleText: {
    color: '#b45309',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceHover,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  locationBadgeText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  controlsCard: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  inputGroup: {
    gap: 4,
    marginTop: spacing.xs,
  },
  inputLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textMuted,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 14,
    color: colors.text,
  },
  unitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  unitSelector: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  unitBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  unitBtnActive: {
    backgroundColor: colors.primary,
  },
  unitBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text,
  },
  unitBtnTextActive: {
    color: '#ffffff',
  },
  cacheCard: {
    gap: spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cacheInfoTitle: {
    ...typography.caption,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  cacheEmptyText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  cacheEntry: {
    padding: spacing.xs,
    backgroundColor: colors.surfaceHover,
    borderRadius: radius.sm,
  },
  cacheKey: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: colors.text,
  },
  cacheDetails: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
  },
  simulationCard: {
    gap: spacing.sm,
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  simDescription: {
    ...typography.caption,
    color: colors.textMuted,
  },
  simButtons: {
    gap: spacing.xs,
  },
  simBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  simBtnActive: {
    backgroundColor: '#fee2e2',
    borderColor: '#f87171',
  },
  simBtnText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
  },
  simBtnTextActive: {
    color: '#b91c1c',
  },
  rawCard: {
    gap: spacing.xs,
  },
  rawSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  codeScrollView: {
    backgroundColor: '#0f172a',
    borderRadius: radius.md,
    padding: spacing.sm,
    maxHeight: 180,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#38bdf8',
  },
});
