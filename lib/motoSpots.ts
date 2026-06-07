// Base de spots moto connus, curatée manuellement.
// Ajoute ici les routes/lieux que les motards apprécient dans chaque région.
// radiusKm = rayon dans lequel ce spot est considéré "dans la zone" de recherche.

export interface CuratedSpot {
  name: string;
  lat: number;
  lng: number;
}

export const CURATED_SPOTS: CuratedSpot[] = [
  // Forêt de Fontainebleau / Gâtinais
  { name: "L'Escargot (Route Ronde, Forêt de Fontainebleau)", lat: 48.3974, lng: 2.7643 },
  { name: "Les 17 virages d'Arbonne-la-Forêt", lat: 48.4115, lng: 2.5685 },
  { name: "Route des Gorges de Franchard", lat: 48.4096, lng: 2.6432 },
  { name: "Croix du Calvaire (Forêt de Fontainebleau)", lat: 48.4196, lng: 2.7147 },

  // Tu peux ajouter d'autres régions ici au fur et à mesure
  // { name: "Col de ...", lat: ..., lng: ... },
];

// Renvoie les spots curatés présents dans le rayon de recherche
export function findCuratedSpots(lat: number, lng: number, radiusKm: number): CuratedSpot[] {
  const DEG_PER_KM = 1 / 111;
  const maxDeg = radiusKm * DEG_PER_KM * 1.3; // marge

  return CURATED_SPOTS.filter((spot) => {
    const dLat = spot.lat - lat;
    const dLng = (spot.lng - lng) * Math.cos((lat * Math.PI) / 180);
    const distDeg = Math.sqrt(dLat * dLat + dLng * dLng);
    return distDeg <= maxDeg;
  });
}
