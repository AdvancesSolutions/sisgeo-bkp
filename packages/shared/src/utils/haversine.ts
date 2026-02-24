/** Raio da Terra em km para cálculo de distância (Haversine) */
const EARTH_RADIUS_KM = 6371;

export interface Coords {
  lat: number;
  lng: number;
}

/**
 * Calcula a distância em km entre duas coordenadas usando a fórmula de Haversine.
 * @param coords1 - Primeira coordenada { lat, lng }
 * @param coords2 - Segunda coordenada { lat, lng }
 * @returns Distância em quilômetros
 */
export function haversineDistance(
  coords1: Coords | { lat: number; lng: number },
  coords2: Coords | { lat: number; lng: number },
): number {
  const lat1 = typeof coords1.lat === 'number' ? coords1.lat : parseFloat(String(coords1.lat));
  const lng1 = typeof coords1.lng === 'number' ? coords1.lng : parseFloat(String(coords1.lng));
  const lat2 = typeof coords2.lat === 'number' ? coords2.lat : parseFloat(String(coords2.lat));
  const lng2 = typeof coords2.lng === 'number' ? coords2.lng : parseFloat(String(coords2.lng));

  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}
