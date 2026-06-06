import { NextRequest } from "next/server";

const ORS_API_KEY = process.env.ORS_API_KEY;
const AVG_SPEED_KMH = 50; // vitesse moyenne moto sur routes secondaires

// Génère des waypoints autour du centre pour former une boucle
// On crée 4 points cardinaux à une distance proportionnelle à la durée
function generateWaypoints(
  lat: number,
  lng: number,
  radiusKm: number
): [number, number][] {
  const DEG_PER_KM_LAT = 1 / 111;
  const DEG_PER_KM_LNG = 1 / (111 * Math.cos((lat * Math.PI) / 180));

  // On crée une boucle avec 4-5 waypoints dans des directions variées
  // On ajoute un décalage aléatoire pour éviter des routes trop symétriques
  const angles = [45, 135, 200, 310]; // angles en degrés
  const variance = 0.3; // facteur de variation du rayon

  const points: [number, number][] = [[lat, lng]]; // départ

  for (const angle of angles) {
    const rad = (angle * Math.PI) / 180;
    const r = radiusKm * (1 - variance / 2 + Math.random() * variance);
    const dlat = Math.sin(rad) * r * DEG_PER_KM_LAT;
    const dlng = Math.cos(rad) * r * DEG_PER_KM_LNG;
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
    preference: "recommended",
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

    const waypoints = generateWaypoints(lat, lng, radiusKm);
    const route = await fetchRoute(waypoints);
    const gpx = buildGpx(route);

    return Response.json({ route, gpx });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    return Response.json({ error: message }, { status: 500 });
  }
}
