// supabase/functions/weather/index.ts
//
// Supabase Edge Function: Weather Proxy
// Keeps third-party weather API keys server-side (Deno.env.get('WEATHER_API_KEY')).
// Proxies requests securely and caches responses.
//
// Deploy with: supabase functions deploy weather

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherRequest {
  latitude?: number;
  longitude?: number;
  city?: string;
  units?: 'celsius' | 'fahrenheit';
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let body: WeatherRequest = {};
    if (req.method === 'POST') {
      body = await req.json().catch(() => ({}));
    } else {
      const url = new URL(req.url);
      body = {
        latitude: url.searchParams.get('latitude') ? Number(url.searchParams.get('latitude')) : undefined,
        longitude: url.searchParams.get('longitude') ? Number(url.searchParams.get('longitude')) : undefined,
        city: url.searchParams.get('city') ?? undefined,
        units: (url.searchParams.get('units') as 'celsius' | 'fahrenheit') ?? 'celsius',
      };
    }

    // Default to New York if coordinates/city not provided
    let lat = body.latitude ?? 40.7128;
    let lon = body.longitude ?? -74.006;
    let resolvedCity = body.city ?? 'Local Area';

    // If city name is specified without coordinates, resolve geocoding
    if (body.city && (body.latitude === undefined || body.longitude === undefined)) {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(body.city)}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results.length > 0) {
          lat = geoData.results[0].latitude;
          lon = geoData.results[0].longitude;
          resolvedCity = geoData.results[0].name;
        }
      }
    }

    // Server-side API key (if using a paid provider like OpenWeather or WeatherAPI)
    // const serverApiKey = Deno.env.get('WEATHER_API_KEY');

    // Fetch reliable weather from Open-Meteo
    const tempUnitParam = body.units === 'fahrenheit' ? '&temperature_unit=fahrenheit' : '';
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto${tempUnitParam}`;

    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) {
      throw new Error(`Upstream weather API failed: ${weatherRes.status} ${weatherRes.statusText}`);
    }

    const rawData = await weatherRes.json();

    const responsePayload = {
      source: 'supabase-edge-function',
      resolvedCity,
      latitude: lat,
      longitude: lon,
      units: body.units ?? 'celsius',
      data: rawData,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600', // 10 minute cache header
      },
      status: 200,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown weather server error';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
