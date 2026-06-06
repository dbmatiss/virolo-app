"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const Map = dynamic(() => import("./components/Map"), { ssr: false });

const DEFAULT_CENTER: [number, number] = [48.4, 2.47]; // Milly-la-Forêt

export default function Home() {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [duration, setDuration] = useState(2);
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpxData, setGpxData] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    setGpxData(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: center[0], lng: center[1], duration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur serveur");
      setRoute(data.route);
      setGpxData(data.gpx);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const downloadGpx = () => {
    if (!gpxData) return;
    const blob = new Blob([gpxData], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `virolo-${Date.now()}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const durationLabel = () => {
    const h = Math.floor(duration);
    const m = (duration % 1) * 60;
    return m > 0 ? `${h}h${m.toFixed(0)}` : `${h}h00`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#111827", color: "white", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.5rem" }}>🏍️</span>
          <span style={{ fontWeight: 700, fontSize: "1.25rem" }}>Virolo</span>
        </div>
        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Boucles moto sur mesure</span>
      </header>

      {/* Panneau de contrôle */}
      <div style={{ background: "#1f2937", color: "white", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Localisation */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginBottom: "2px" }}>Point de départ</div>
            <div style={{ fontSize: "0.85rem" }}>{center[0].toFixed(4)}, {center[1].toFixed(4)}</div>
          </div>
          <button
            onClick={locate}
            disabled={locating}
            style={{ background: "#374151", border: "1px solid #4b5563", color: "white", borderRadius: "8px", padding: "8px 12px", cursor: locating ? "not-allowed" : "pointer", fontSize: "0.85rem" }}
          >
            {locating ? "⏳ ..." : "📍 Ma position"}
          </button>
        </div>

        {/* Durée */}
        <div>
          <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
            <span>Durée souhaitée</span>
            <span style={{ color: "#f97316", fontWeight: 700 }}>{durationLabel()}</span>
          </div>
          <input
            type="range" min={0.5} max={6} step={0.5} value={duration}
            onChange={(e) => setDuration(parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "#f97316" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "#6b7280", marginTop: "2px" }}>
            <span>30min</span><span>6h</span>
          </div>
        </div>

        {/* Bouton générer */}
        <button
          onClick={generate}
          disabled={loading}
          style={{ background: loading ? "#374151" : "#f97316", color: "white", border: "none", borderRadius: "12px", padding: "14px", fontSize: "1rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.3px" }}
        >
          {loading ? "Calcul en cours..." : "🗺️ Générer ma boucle"}
        </button>

        {error && (
          <div style={{ background: "#7f1d1d", color: "#fca5a5", borderRadius: "8px", padding: "8px 12px", fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        {gpxData && (
          <button
            onClick={downloadGpx}
            style={{ background: "#064e3b", color: "#6ee7b7", border: "1px solid #065f46", borderRadius: "12px", padding: "10px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}
          >
            ⬇️ Télécharger le tracé (.gpx)
          </button>
        )}
      </div>

      {/* Carte */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Map route={route} center={center} />
      </div>
    </div>
  );
}
