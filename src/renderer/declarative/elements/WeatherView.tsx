/**
 * src/renderer/declarative/elements/WeatherView.tsx
 *
 * Renders declarative WeatherElement with current conditions and forecast days.
 * Gracefully handles missing weather data.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WeatherElement, WeatherElementInput, Action, UniversalItem } from '@/widgets/schema';
import { getFirstItemByType } from '../dataBinding';
import { IconView } from './IconView';

interface WeatherViewProps {
  element: WeatherElement | WeatherElementInput;
  items?: UniversalItem[];
  onAction?: (action: Action) => void;
}

export const WeatherView = React.memo(function WeatherView({
  element,
  items,
  onAction,
}: WeatherViewProps) {
  const weatherItem = getFirstItemByType(items, 'weather');

  const unitLabel = element.tempUnit === 'fahrenheit' ? '°F' : '°C';

  // Fallback if no weather data is available
  if (!weatherItem) {
    return (
      <View style={styles.emptyContainer}>
        <IconView element={{ type: 'icon', name: 'cloud', size: 'medium', color: '#94a3b8' }} />
        <Text style={styles.emptyText}>Weather data unavailable</Text>
      </View>
    );
  }

  const forecastDays = (weatherItem.meta?.forecast as Array<{
    day: string;
    temp: number;
    condition: string;
    icon?: string;
  }>) ?? [];

  const handlePress = () => {
    if (element.action && onAction) {
      onAction(element.action);
    }
  };

  const isForecastMode = element.displayMode === 'forecast';
  const showConditionIcon = element.showConditionIcon !== false;
  const numForecastDays = element.forecastDays ?? 3;

  const content = (
    <View style={styles.container}>
      {isForecastMode ? (
        // Multi-day forecast list
        <View style={styles.forecastRow}>
          {forecastDays.slice(0, numForecastDays).map((dayForecast, idx) => (
            <View key={idx} style={styles.forecastDay}>
              <Text style={styles.forecastDayText}>{dayForecast.day}</Text>
              <IconView
                element={{
                  type: 'icon',
                  name: dayForecast.icon ?? 'sun',
                  size: 'small',
                  color: '#fde047',
                }}
              />
              <Text style={styles.forecastTempText}>
                {Math.round(dayForecast.temp)}°
              </Text>
            </View>
          ))}
        </View>
      ) : (
        // Current conditions
        <View style={styles.currentContainer}>
          <View style={styles.tempConditionRow}>
            {showConditionIcon && (
              <View style={styles.conditionIcon}>
                <IconView
                  element={{
                    type: 'icon',
                    name: weatherItem.condition.toLowerCase().includes('cloud') ? 'cloud' : 'sun',
                    size: 'large',
                    color: '#fde047',
                  }}
                />
              </View>
            )}
            <Text style={styles.tempText}>
              {Math.round(weatherItem.temp)}
              <Text style={styles.unitText}>{unitLabel}</Text>
            </Text>
          </View>
          <Text style={styles.conditionText}>{weatherItem.condition}</Text>
          {(element.showFeelsLike || element.showHumidity || element.showWind) && (
            <View style={styles.detailsRow}>
              {element.showFeelsLike && weatherItem.feelsLike !== undefined && (
                <Text style={styles.detailText}>
                  Feels like {Math.round(weatherItem.feelsLike)}°
                </Text>
              )}
              {element.showHumidity && weatherItem.humidity !== undefined && (
                <Text style={styles.detailText}>
                  Humidity {weatherItem.humidity}%
                </Text>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );

  if (element.action) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  currentContainer: {
    flexDirection: 'column',
    gap: 2,
  },
  tempConditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conditionIcon: {
    marginRight: 4,
  },
  tempText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
  },
  unitText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#bae6fd',
  },
  conditionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#e0f2fe',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  detailText: {
    fontSize: 11,
    color: '#bae6fd',
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  forecastDay: {
    alignItems: 'center',
    gap: 4,
  },
  forecastDayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#bae6fd',
  },
  forecastTempText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyContainer: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
