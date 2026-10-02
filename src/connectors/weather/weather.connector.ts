/**
 * src/connectors/weather/weather.connector.ts
 *
 * Production Weather Connector implementing the Connector framework.
 *
 * Key Requirements:
 * - Uses reliable weather API (Open-Meteo & Supabase Edge Function)
 * - Keeps API keys server-side (zero secrets on client)
 * - Caches responses with fresh TTL and stale fallback
 * - Handles location permission denial gracefully with city fallback
 * - Isolates provider payload: only normalized WeatherItem reaches widgets
 * - Fully compatible with existing UniversalItem / WeatherItemSchema
 */

import { z } from 'zod';
import { UniversalItem } from '@/widgets/schema';
import { BaseConnector } from '../base/BaseConnector';
import {
  ConnectorMetadata,
  ConnectorMeta,
  ConnectorError,
} from '../base/connector.types';
import { WeatherCache, weatherCache } from './weather.cache';
import {
  locationService,
  LocationPermissionDeniedError,
} from '@/services/locationService';
import { supabase, isSupabaseConfigured } from '@/services/supabase';

// ---------------------------------------------------------------------------
// Config Schema
// ---------------------------------------------------------------------------

export const WeatherConfigSchema = z.object({
  /** City name to look up when not using GPS */
  city: z.string().optional(),
  /** Country code (e.g. 'US', 'GB') */
  country: z.string().optional(),
  /** Explicit latitude override */
  latitude: z.number().min(-90).max(90).optional(),
  /** Explicit longitude override */
  longitude: z.number().min(-180).max(180).optional(),
  /** Whether to use device GPS (default true) */
  useCurrentLocation: z.boolean().default(true),
  /** Temperature unit */
  units: z.enum(['celsius', 'fahrenheit']).default('celsius'),
  /** Fallback city if GPS permission is denied */
  fallbackCity: z.string().default('New York'),
  /** Optional API key override (stored in connections table if needed) */
  apiKey: z.string().optional(),
});

export type WeatherConfigInput = z.input<typeof WeatherConfigSchema>;
export type WeatherConfig = z.infer<typeof WeatherConfigSchema>;

// ---------------------------------------------------------------------------
// Raw Internal Weather Data (Provider response isolated from widget layer)
// ---------------------------------------------------------------------------

export interface RawWeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  weatherCode: number;
  windSpeed: number;
  isDay: boolean;
  cityName: string;
  latitude: number;
  longitude: number;
  highTemp?: number;
  lowTemp?: number;
  fetchedAt: string;
  isStale?: boolean;
  locationStatus?: 'gps' | 'city' | 'permission_denied_fallback';
}

// ---------------------------------------------------------------------------
// Helper: Map WMO weather codes to human descriptions and icon URLs
// ---------------------------------------------------------------------------

export function getWmoCondition(code: number): string {
  switch (code) {
    case 0:
      return 'Clear sky';
    case 1:
      return 'Mainly clear';
    case 2:
      return 'Partly cloudy';
    case 3:
      return 'Overcast';
    case 45:
    case 48:
      return 'Foggy';
    case 51:
    case 53:
    case 55:
      return 'Drizzle';
    case 56:
    case 57:
      return 'Freezing Drizzle';
    case 61:
      return 'Light rain';
    case 63:
      return 'Moderate rain';
    case 65:
      return 'Heavy rain';
    case 71:
    case 73:
    case 75:
      return 'Snow fall';
    case 77:
      return 'Snow grains';
    case 80:
    case 81:
    case 82:
      return 'Rain showers';
    case 85:
    case 86:
      return 'Snow showers';
    case 95:
      return 'Thunderstorm';
    case 96:
    case 99:
      return 'Thunderstorm with hail';
    default:
      return 'Clear sky';
  }
}

export function getWmoIconUrl(code: number, isDay: boolean): string {
  const time = isDay ? 'd' : 'n';
  let iconCode = '01'; // clear sky

  if (code === 1 || code === 2) iconCode = '02'; // partly cloudy
  else if (code === 3) iconCode = '03'; // overcast
  else if (code === 45 || code === 48) iconCode = '50'; // fog
  else if (code >= 51 && code <= 67) iconCode = '10'; // rain
  else if (code >= 71 && code <= 77) iconCode = '13'; // snow
  else if (code >= 80 && code <= 82) iconCode = '09'; // showers
  else if (code >= 85 && code <= 86) iconCode = '13'; // snow showers
  else if (code >= 95) iconCode = '11'; // thunderstorm

  return `https://openweathermap.org/img/wn/${iconCode}${time}@2x.png`;
}

// ---------------------------------------------------------------------------
// Well-known fallback coordinates
// ---------------------------------------------------------------------------

const CITY_COORDINATES: Record<string, { lat: number; lon: number; name: string }> = {
  'new york': { lat: 40.7128, lon: -74.006, name: 'New York' },
  london: { lat: 51.5074, lon: -0.1278, name: 'London' },
  tokyo: { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
  paris: { lat: 48.8566, lon: 2.3522, name: 'Paris' },
  sydney: { lat: -33.8688, lon: 151.2093, name: 'Sydney' },
  'san francisco': { lat: 37.7749, lon: -122.4194, name: 'San Francisco' },
};

// ---------------------------------------------------------------------------
// WeatherConnector Class
// ---------------------------------------------------------------------------

export class WeatherConnector extends BaseConnector<
  WeatherConfigInput,
  RawWeatherData
> {
  readonly metadata: ConnectorMetadata = {
    id: 'weather',
    name: 'Weather',
    description: 'Real-time weather conditions and forecasts via reliable server-side API.',
    version: '1.0.0',
    authType: 'none', // API keys are kept server-side; client needs no auth
    supportedDataTypes: ['weather'],
    staleTimeMs: 10 * 60 * 1000, // 10 minutes
    type: 'weather',
    displayName: 'Weather',
  };

  /** Legacy meta for backward compatibility */
  get meta(): ConnectorMeta {
    return {
      type: this.metadata.id,
      displayName: this.metadata.name,
      description: this.metadata.description,
      authType: this.metadata.authType,
      staleTimeMs: this.metadata.staleTimeMs,
      id: this.metadata.id,
      name: this.metadata.name,
    };
  }

  readonly configSchema = WeatherConfigSchema;
  private cache: WeatherCache<RawWeatherData>;

  constructor(customCache?: WeatherCache<RawWeatherData>) {
    super();
    this.cache = customCache ?? (weatherCache as WeatherCache<RawWeatherData>);
  }

  /** Exposes the internal cache instance for testing/debugging */
  getCache(): WeatherCache<RawWeatherData> {
    return this.cache;
  }

  /**
   * Resolves target coordinates based on GPS or configured city,
   * gracefully handling location permission denials.
   */
  async resolveLocation(config: WeatherConfig): Promise<{
    lat: number;
    lon: number;
    cityName: string;
    locationStatus: 'gps' | 'city' | 'permission_denied_fallback';
  }> {
    // 1. Explicit coordinates provided
    if (config.latitude !== undefined && config.longitude !== undefined) {
      return {
        lat: config.latitude,
        lon: config.longitude,
        cityName: config.city ?? 'Custom Location',
        locationStatus: 'city',
      };
    }

    // 2. GPS requested
    if (config.useCurrentLocation) {
      try {
        const coords = await locationService.getCurrentPosition();
        return {
          lat: coords.latitude,
          lon: coords.longitude,
          cityName: config.city ?? 'Current Location',
          locationStatus: 'gps',
        };
      } catch (err) {
        // Location permission denial or unavailable — fall back gracefully
        const fallback =
          CITY_COORDINATES[config.fallbackCity.toLowerCase()] ??
          CITY_COORDINATES['new york']!;
        return {
          lat: fallback.lat,
          lon: fallback.lon,
          cityName: `${fallback.name} (Fallback)`,
          locationStatus: 'permission_denied_fallback',
        };
      }
    }

    // 3. Named city specified
    const cityName = config.city ?? config.fallbackCity ?? 'New York';
    const known = CITY_COORDINATES[cityName.toLowerCase()];
    if (known) {
      return {
        lat: known.lat,
        lon: known.lon,
        cityName: known.name,
        locationStatus: 'city',
      };
    }

    // 4. Fallback default
    const def = CITY_COORDINATES['new york']!;
    return {
      lat: def.lat,
      lon: def.lon,
      cityName: def.name,
      locationStatus: 'city',
    };
  }

  /**
   * Internal raw fetch logic with caching and stale fallback.
   * Isolates upstream provider API response.
   */
  protected override async fetchRaw(
    config: WeatherConfig,
    params?: Record<string, unknown>,
  ): Promise<RawWeatherData> {
    const loc = await this.resolveLocation(config);
    const cacheKey = `weather:${loc.lat.toFixed(3)}:${loc.lon.toFixed(3)}:${config.units}`;
    const forceRefresh = Boolean(params?.['forceRefresh']);

    // 1. Check fresh cache
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey, false);
      if (cached && !cached.isStale) {
        return cached.data;
      }
    }

    // 2. Perform network fetch
    try {
      const freshData = await this.fetchFromApi(loc.lat, loc.lon, loc.cityName, config.units);
      freshData.locationStatus = loc.locationStatus;

      // Update cache
      this.cache.set(cacheKey, freshData);
      return freshData;
    } catch (networkError) {
      // 3. Handle failure by checking for stale cached data
      const stale = this.cache.get(cacheKey, true);
      if (stale) {
        return {
          ...stale.data,
          isStale: true,
          locationStatus: loc.locationStatus,
        };
      }

      // No cache available — rethrow typed error
      throw new ConnectorError(
        `Weather API request failed: ${networkError instanceof Error ? networkError.message : 'Network error'}`,
        'NETWORK_ERROR',
        true,
      );
    }
  }

  /**
   * Fetches weather from the Supabase Edge Function or reliable Open-Meteo API.
   * Keeps API keys server-side; client requires zero secrets.
   */
  private async fetchFromApi(
    lat: number,
    lon: number,
    cityName: string,
    units: 'celsius' | 'fahrenheit',
  ): Promise<RawWeatherData> {
    // Attempt Supabase Edge Function first if configured
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.functions.invoke('weather', {
          body: { latitude: lat, longitude: lon, units },
        });

        if (!error && data && data.data?.current) {
          const cur = data.data.current;
          const daily = data.data.daily;
          return {
            temperature: cur.temperature_2m,
            feelsLike: cur.apparent_temperature ?? cur.temperature_2m,
            humidity: cur.relative_humidity_2m ?? 50,
            weatherCode: cur.weather_code ?? 0,
            windSpeed: cur.wind_speed_10m ?? 0,
            isDay: cur.is_day === 1,
            cityName: data.resolvedCity ?? cityName,
            latitude: lat,
            longitude: lon,
            highTemp: daily?.temperature_2m_max?.[0],
            lowTemp: daily?.temperature_2m_min?.[0],
            fetchedAt: new Date().toISOString(),
            isStale: false,
          };
        }
      } catch {
        // Fall back to direct Open-Meteo call if Edge Function is unreachable
      }
    }

    // Direct call to Open-Meteo (Reliable, high availability, zero key needed)
    const tempUnit = units === 'fahrenheit' ? '&temperature_unit=fahrenheit' : '';
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto${tempUnit}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo returned status ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    const cur = json.current;
    if (!cur) {
      throw new Error('Malformed weather response: missing current conditions');
    }

    const daily = json.daily;

    return {
      temperature: Number(cur.temperature_2m),
      feelsLike: Number(cur.apparent_temperature ?? cur.temperature_2m),
      humidity: Number(cur.relative_humidity_2m ?? 50),
      weatherCode: Number(cur.weather_code ?? 0),
      windSpeed: Number(cur.wind_speed_10m ?? 0),
      isDay: cur.is_day === 1,
      cityName,
      latitude: lat,
      longitude: lon,
      highTemp: daily?.temperature_2m_max?.[0],
      lowTemp: daily?.temperature_2m_min?.[0],
      fetchedAt: new Date().toISOString(),
      isStale: false,
    };
  }

  /**
   * Pure normaliser: transforms internal RawWeatherData into UniversalItem[] of type 'weather'.
   * Never exposes raw provider payload to widgets.
   */
  override normalise(
    raw: RawWeatherData | any,
    _config?: WeatherConfig | any,
  ): UniversalItem[] {
    // Backward compatibility: support legacy OpenWeather response shape
    if (raw && typeof raw === 'object' && 'main' in raw && 'weather' in raw) {
      const weatherArray = Array.isArray(raw.weather) ? raw.weather : [];
      return [
        {
          id: `weather-current-${raw.dt ?? Date.now()}`,
          provider: 'weather',
          type: 'weather',
          temp: Number(raw.main?.temp ?? 0),
          condition: String(weatherArray[0]?.description ?? 'Weather'),
          feelsLike: raw.main?.feels_like !== undefined ? Number(raw.main.feels_like) : undefined,
          humidity: raw.main?.humidity !== undefined ? Number(raw.main.humidity) : undefined,
          iconUrl: weatherArray[0]?.icon
            ? `https://openweathermap.org/img/wn/${weatherArray[0].icon}@2x.png`
            : undefined,
          updatedAt: raw.dt ? new Date(raw.dt * 1000).toISOString() : new Date().toISOString(),
          meta: {
            cityName: String(raw.name ?? 'London'),
          },
        },
      ];
    }

    const condition = getWmoCondition(raw.weatherCode ?? 0);
    const iconUrl = getWmoIconUrl(raw.weatherCode ?? 0, raw.isDay ?? true);

    return [
      {
        id: `weather-${(raw.latitude ?? 0).toFixed(2)}-${(raw.longitude ?? 0).toFixed(2)}`,
        provider: 'weather',
        type: 'weather',
        temp: raw.temperature ?? 0,
        condition,
        feelsLike: raw.feelsLike,
        humidity: raw.humidity,
        iconUrl,
        updatedAt: raw.fetchedAt ?? new Date().toISOString(),
        meta: {
          cityName: raw.cityName ?? 'Unknown',
          latitude: raw.latitude,
          longitude: raw.longitude,
          windSpeed: raw.windSpeed,
          isDay: raw.isDay,
          highTemp: raw.highTemp,
          lowTemp: raw.lowTemp,
          isStale: raw.isStale ?? false,
          locationStatus: raw.locationStatus ?? 'city',
        },
      },
    ];
  }

  /**
   * Refresh forces cache bypass to fetch live data.
   */
  override async refresh(params?: Record<string, unknown>): Promise<any> {
    return this.fetch({ ...params, forceRefresh: true });
  }

  /**
   * Health check validates API connectivity.
   */
  override async health() {
    const base = await super.health();
    return {
      ...base,
      message: base.healthy
        ? 'Weather API connected & ready.'
        : `Weather connection status: ${base.status}`,
    };
  }
}

/** Global WeatherConnector singleton instance */
export const weatherConnector = new WeatherConnector();
