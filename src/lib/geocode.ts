import type { Coords } from '@/stores/types';

const cache = new Map<string, Coords | null>();

export async function geocodeAddress(address: string): Promise<Coords | null> {
  if (!address || address.length < 3) return null;
  
  const key = address.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key) || null;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=fr`,
      { headers: { 'Accept-Language': 'fr' } }
    );
    const data = await res.json();
    if (data.length > 0) {
      const coords: Coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      cache.set(key, coords);
      return coords;
    }
  } catch {
    // Silently fail
  }
  
  cache.set(key, null);
  return null;
}
