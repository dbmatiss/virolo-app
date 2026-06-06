import { NextRequest } from "next/server";

const ORS_API_KEY = process.env.ORS_API_KEY;
const AVG_SPEED_KMH = 45;

type Style = "tranquille" | "sportif" | "extreme";

const STYLE_CONFIG: Record<Style, { points: number; angleVariance: number; radiusVariance: number }> = {
  tranquille: { points: 4, angleVariance: 15, radiusVariance: 0.2 },
  sportif:    { points: 6, angleVariance: 25, radiusVariance: 0.35 },
  extreme:    { points: 8, angleVariance: 35, radiusVariance: 0.5 },
};

interface MotoSpot {
  lat: number;
  lng: number;
  name: string;
}

// Interroge Overpass API pour trouver les spots moto dans la zone
async function fetchMotoSpots(lat: number, lng: number, radiusKm: number): Promise<MotoSpot[]> {
  const radiusM = Math.round(radiusKm * 1000);

  // Stratégie : chercher les routes secondaires/tertiaires nommées avec beaucoup
  // de nœuds (= sinueuses), les viewpoints, et les routes aux noms évocateurs
  const query = `
[out:json][timeout:12];
(
  node["tourism"="viewpoint"](around:${radiusM},${lat},${lng});
  node["tourism"="attraction"](around:${radiusM},${lat},${lng});
  node["sport"="motor"](around:${radiusM},${lat},${lng});
  way["highway"~"secondary|tertiary"]["tourism"="yes"](around:${radiusM},${lat},${lng});
  way["highway"~"secondary|tertiary"]["scenic"="yes"](around:${radiusM},${lat},${lng});
  way["highway"~"secondary|tertiary"]["name"~"virage|virages|col|corniche|escargot|belvedere|belvédère|panorama|ronde|lacet|épingle|épingles","i"](around:${radiusM},${lat},${lng});
  way["highway"~"secondary|tertiary"]["name"~"forêt|foret|montagne|crête|crete|circuit","i"](around:${radiusM},${lat},${lng});
  relation["route"="road"]["name"](around:${radiusM},${lat},${lng});
);
out center 20;
`;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];
    const data = await res.json();

    const spots: MotoSpot[] = [];
    for (const el of data.elements ?? []) {
      const name = el.tags?.name;
      if (!name) continue;
      const spotLat = el.lat ?? el.center?.lat;
      const spotLng = el.lon ?? el.center?.lon;
      if (!spotLat || !spotLng) continue;
      spots.push({ lat: spotLat, lng: spotLng, name });
    }

    return spots;
  } catch {
    return [];
  }
}

// Insère les spots moto comme waypoints dans la boucle.
// Pour chaque spot, on remplace le waypoint intérieur le plus proche en angle.
function injectSpots(
  wpts: [number, number][],
  spots: MotoSpot[],
  centerLat: number,
  centerLng: number
): [number, number][] {
  if (spots.length === 0) return wpts;

  const inner = wpts.slice(1, -1);
  const used = new Set<number>();

  for (const spot of spots.slice(0, 3)) {
    const spotAngle = Math.atan2(spot.lng - centerLng, spot.lat - centerLat);

    let bestIdx = -1;
    let bestDiff = Infinity;
    for (let i = 0; i < inner.length; i++) {
      if (used.has(i)) continue;
      const wAngle = Math.atan2(inner[i][1] - centerLng, inner[i][0] - centerLat);
      const diff = Math.abs(spotAngle - wAngle);
      const normalizedDiff = Math.min(diff, 2 * Math.PI - diff);
      if (normalizedDiff < bestDiff) {
        bestDiff = normalizedDiff;
        bestIdx = i;
      }
    }

    // Injecte si le spot est à moins de 45° du waypoint le plus proche
    if (bestIdx >= 0 && bestDiff < (45 * Math.PI) / 180) {
      inner[bestIdx] = [spot.lat, spot.lng];
      used.add(bestIdx);
    }
  }

  return [wpts[0], ...inner, wpts[wpts.length - 1]];
}

function generateWaypoints(
  lat: number,
  lng: number,
  radiusKm: number,
  style: Style = "sportif"
): [number, number][] {
  const DEG_PER_KM_LAT = 1 / 111;
  const DEG_PER_KM_LNG = 1 / (111 * Math.cos((lat * Math.PI) / 180));

  const { points: numPoints, angleVariance, radiusVariance } = STYLE_CONFIG[style];
  const step = 360 / numPoints;
  const baseAngles = Array.from({ length: numPoints }, (_, i) => i * step);

  const wpts: [number, number][] = [[lat, lng]];

  for (const baseAngle of baseAngles) {
    const angle = baseAngle + (Math.random() - 0.5) * 2 * angleVariance;
    const rad = (angle * Math.PI) / 180;
    const r = radiusKm * (1 - radiusVariance / 2 + Math.random() * radiusVariance);
    const dlat = Math.cos(rad) * r * DEG_PER_KM_LAT;
    const dlng = Math.sin(rad) * r * DEG_PER_KM_LNG;
    wpts.push([lat + dlat, lng + dlng]);
  }

  wpts.push([lat, lng]);
  return wpts;
}

async function fetchRoute(waypoints: [number, number][]): Promise<[number, number][]> {
  if (!ORS_API_KEY) throw new Error("Clé API ORS manquante");

  const coordinates = waypoints.map(([lat, lng]) => [lng, lat]);

  const res = await fetch(
    "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: ORS_API_KEY },
      body: JSON.stringify({
        coordinates,
        profile: "driving-car",
        format: "geojson",
        options: { avoid_features: ["highways", "tollways", "ferries"] },
        preference: "shortest",
      }),
    }
  );

  if (!res.ok) throw new Error(`ORS error: ${await res.text()}`);

  const data = await res.json();
  return data.features[0].geometry.coordinates.map(
    ([lng, lat]: [number, number]) => [lat, lng]
  );
}

function buildGpx(coords: [number, number][]): string {
  const trkpts = coords
    .map(([lat, lng]) => `    <trkpt lat="${lat}" lon="${lng}"></trkpt>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Virolo" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Boucle Virolo</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, duration, style = "sportif" } = await request.json();

    if (!lat || !lng || !duration) {
      return Response.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const radiusKm = (duration * AVG_SPEED_KMH) / 4;

    // Cherche les spots moto en parallèle pendant qu'on prépare les waypoints
    const spotsPromise = fetchMotoSpots(lat, lng, radiusKm);

    let route: [number, number][] | null = null;
    let usedWaypoints: [number, number][] | null = null;
    let spots: MotoSpot[] = [];

    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        let wpts = generateWaypoints(lat, lng, radiusKm, style as Style);

        // Au 1er essai on attend les spots pour les injecter
        if (attempt === 0) {
          spots = await spotsPromise;
          wpts = injectSpots(wpts, spots, lat, lng);
        }

        route = await fetchRoute(wpts);
        usedWaypoints = wpts;
        break;
      } catch {
        // retry avec nouveaux waypoints aléatoires
      }
    }

    if (!route || !usedWaypoints) {
      return Response.json({ error: "Impossible de générer une boucle dans cette zone, réessaie." }, { status: 500 });
    }

    const gpx = buildGpx(route);
    return Response.json({
      route,
      gpx,
      waypoints: usedWaypoints,
      spots: spots.slice(0, 3).map((s) => ({ name: s.name, lat: s.lat, lng: s.lng })),
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Erreur inconnue" }, { status: 500 });
  }
}
