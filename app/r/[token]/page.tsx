"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";

const Map = dynamic(() => import("@/app/components/Map"), { ssr: false });

interface SharedRoute {
  duration: number;
  center_lat: number;
  center_lng: number;
  route: [number, number][];
  waypoints: [number, number][];
  gpx: string;
  created_at: string;
}

export default function SharedRoutePage({ params }: { params: Promise<{ token: string }> }) {
  const [data, setData] = useState<SharedRoute | null>(null);
  const [error, setError] = useState(false);
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/routes/share?token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(true);
        else setData(d.route);
      })
      .catch(() => setError(true));
  }, [token]);

  const downloadGpx = () => {
    if (!data) return;
    const blob = new Blob([data.gpx], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `virolo-${token}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openGoogleMaps = () => {
    if (!data?.waypoints) return;
    const stops = data.waypoints.map(([lat, lng]) => `${lat},${lng}`).join("/");
    window.open(`https://www.google.com/maps/dir/${stops}`, "_blank");
  };

  const durationLabel = (d: number) => {
    const h = Math.floor(d);
    const m = (d % 1) * 60;
    return m > 0 ? `${h}h${m.toFixed(0)}` : `${h}h`;
  };

  if (error) return (
    <div className="min-h-full flex flex-col items-center justify-center bg-zinc-950 gap-4 p-8">
      <div className="text-5xl">🏍️</div>
      <h1 className="text-xl font-bold text-white">Boucle introuvable</h1>
      <p className="text-zinc-400 text-sm text-center">Ce lien de partage n&apos;existe plus ou est invalide.</p>
      <Link href="/" className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl text-sm transition-colors">
        Créer ma boucle
      </Link>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <header className="flex-none bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between z-[2000] relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-sm font-bold">V</div>
          <span className="font-bold text-lg tracking-tight">Virolo</span>
          {data && (
            <span className="hidden sm:inline text-xs text-zinc-500">
              Boucle partagée · {durationLabel(data.duration)} · ~{Math.round(data.duration * 45)} km
            </span>
          )}
        </div>
        <Link href="/" className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold rounded-xl transition-colors">
          Créer la mienne
        </Link>
      </header>

      <div className="flex-1 relative">
        {data ? (
          <>
            <div className="absolute inset-0">
              <Map route={data.route} center={[data.center_lat, data.center_lng]} />
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-[1000]">
              <div className="bg-zinc-900/95 backdrop-blur border border-zinc-700/60 rounded-2xl shadow-2xl p-4 space-y-2">
                <div className="flex items-center gap-3 pb-2 border-b border-zinc-800">
                  <div className="w-9 h-9 bg-orange-500/20 border border-orange-500/30 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Boucle {durationLabel(data.duration)}</p>
                    <p className="text-xs text-zinc-400">~{Math.round(data.duration * 45)} km · Générée sur Virolo</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={openGoogleMaps} className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-medium py-2.5 rounded-xl transition-colors text-sm">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    Google Maps
                  </button>
                  <button onClick={downloadGpx} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium py-2.5 rounded-xl transition-colors text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    GPX
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-zinc-950">
            <div className="flex flex-col items-center gap-3">
              <svg className="w-8 h-8 animate-spin text-orange-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <p className="text-zinc-400 text-sm">Chargement de la boucle...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
