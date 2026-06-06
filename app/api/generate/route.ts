import { NextRequest } from "next/server";

const ORS_API_KEY = process.env.ORS_API_KEY;
const AVG_SPEED_KMH = 45; // vitesse moyenne moto sur routes secondaires sinueuses

// Génère des waypoints autour du centre pour former une boucle sinueuse
// Plus de waypoints + distribution irrégulière = routes plus intéressantes
function generateWaypoints(
  lat: number,
  lng: number,
  radiusKm: number
): [number, number][] {
  const DEG_PER_KM_LAT = 1 / 111;
  const DEG_PER_KM_LNG = 1 / (111 * Math.cos((lat * Math.PI) / 180));

  // 6 waypoints répartis sur 360° avec décalage aléatoire de ±25°
  // et variation du rayon de ±35% pour créer une boucle asymétrique
  const baseAngles = [30, 90, 150, 210, 270, 330];
  const angleVariance = 25; // degrés
  const radiusVariance = 0.35;

  const points: [number, number][] = [[lat, lng]];

  for (const baseAngle of baseAngles) {
    const angle = baseAngle + (Math.random() - 0.5) * 2 * angleVariance;
    const rad = (angle * Math.PI) / 180;
    const r = radiusKm * (1 - radiusVariance / 2 + Math.random() * radiusVariance);
    const dlat = Math.cos(rad) * r * DEG_PER_KM_LAT;
    const dlng = Math.sin(rad) * r * DEG_PER_KM_LNG;
    points.push([lat + dlat, lng + dlng]);
  }

  points.push([lat, lng]); // retour au départ
  return points;
}

// Appelle l'API OpenRouteService pour calculer le tracé routier
async function fetchRoute(
  waypoints: [number, number][]
): Promise<[number, number][]> {
  if (!ORS_API_KEY) throw new Error("Clé API ORS manquante");

  const coordinates = waypoints.map(([lat, lng]) => [lng, lat]); // ORS: [lng, lat]

  const body = {
    coordinates,
    profile: "driving-car",
    format: "geojson",
    options: {
      avoid_features: ["highways", "tollways", "ferries"],
    },
    preference: "shortest",
  };

  const res = await fetch(
    "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: ORS_API_KEY,
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ORS error: ${err}`);
  }

  const data = await res.json();
  const coords: [number, number][] = data.features[0].geometry.coordinates.map(
    ([lng, lat]: [number, number]) => [lat, lng]
  );
  return coords;
}

// Génère le fichier GPX à partir d'un tableau de coordonnées
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
    const { lat, lng, duration } = await request.json();

    if (!lat || !lng || !duration) {
      return Response.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // Calcul du rayon : durée (h) × vitesse (km/h) ÷ 4
    // On divise par ~4 pour avoir un rayon cohérent avec une boucle
    const radiusKm = (duration * AVG_SPEED_KMH) / 4;

    let route: [number, number][] | null = null;
    let lastError = "";
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const waypoints = generateWaypoints(lat, lng, radiusKm);
        route = await fetchRoute(waypoints);
        break;
      } catch (e) {
        lastError = e instanceof Error ? e.message : "Erreur inconnue";
      }
    }

    if (!route) return Response.json({ error: "Impossible de générer une boucle dans cette zone, réessaie." }, { status: 500 });

    const gpx = buildGpx(route);
    return Response.json({ route, gpx });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    return Response.json({ error: message }, { status: 500 });
  }
}
