/**
 * Geocoding utilities using OpenStreetMap Nominatim API
 * Free and doesn't require API key
 */

interface GeocodingResult {
  latitude: number;
  longitude: number;
}

/**
 * Geocode an address to get latitude and longitude
 * @param address Full address string
 * @returns Promise with latitude and longitude, or null if not found
 */
export async function geocodeAddress(
  address: string,
  pincode?: string
): Promise<GeocodingResult | null> {
  try {
    // Build search query - prioritize Indian addresses
    const searchQuery = pincode 
      ? `${address}, ${pincode}, India`
      : `${address}, India`;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      searchQuery
    )}&limit=1&countrycodes=in`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'HighOnIceCream/1.0', // Nominatim requires a user agent
      },
    });

    if (!response.ok) {
      console.error('Geocoding API error:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
