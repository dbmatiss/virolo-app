"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import BottomNav from "../../components/BottomNav";

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
  const { data: session } = useSession();
  const [data, setData] = useState<SharedRoute | null>(null);
  const [error, setError] = useState(false);
  const [token, setToken] = useState<string>("");
  const [copied, setCopied] = useState(false);

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

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const durationLabel = (d: number) => {
    const h = Math.floor(d);
    const m = (d % 1) * 60;
    return m > 0 ? `${h}h${m.toFixed(0)}` : `${h}h`;
  };

  if (error) {
    return (
      <div className="flex flex-col h-full bg-zinc-950">
        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 text-center">
          <div className="text-5xl">🏍️</div>
          <div>
            <h1 className="text-xl font-bold text-white mb-2">Boucle introuvable</h1>
            <p className="text-zinc-400 text-sm">Ce lien de partage n&apos;existe plus ou est invalide.</p>
          </div>
          <Link href="/app" className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl text-sm transition-colors">
            Créer ma boucle
          </Link>
        </div>
        {session && <BottomNav />}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col h-full bg-zinc-950">
        <header className="flex-none bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between z-[2000]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-sm font-bold shadow-md shadow-orange-500/30">V</div>
            <span className="font-bold text-lg tracking-tight">Virolo</span>
          </Link>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="w-8 h-8 animate-spin text-orange-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-zinc-400 text-sm">Chargement de la boucle...</p>
          </div>
        </div>
        {session && <BottomNav />}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex-none bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between z-[2000] relative">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-sm font-bold shadow-md shadow-orange-500/30">V</div>
          <span className="font-bold text-lg tracking-tight">Virolo</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-zinc-500 bg-zinc-800 px-2.5 py-1 rounded-full">
            Boucle partagée · {durationLabel(data.duration)} · ~{Math.round(data.duration * 45)} km
          </span>
          <Link href="/app" className="px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold rounded-lg transition-colors">
            Créer la mienne
          </Link>
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative">
        <div className="absolute inset-0">
          <Map route={data.route} center={[data.center_lat, data.center_lng]} />
        </div>

        {/* Panel */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-[1000]">
          <div className="bg-zinc-900/95 backdrop-blur border border-zinc-700/60 rounded-2xl shadow-2xl overflow-hidden">
            {/* Info */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800">
              <div className="w-10 h-10 bg-orange-500/15 border border-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">Boucle {durationLabel(data.duration)}</p>
                <p className="text-xs text-zinc-400 mt-0.5">~{Math.round(data.duration * 45)} km · Partagée via Virolo</p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={openGoogleMaps}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:text-blue-300 font-medium py-2.5 rounded-xl transition-colors text-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  Google Maps
                </button>
                <button
                  onClick={downloadGpx}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-medium py-2.5 rounded-xl transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  GPX
                </button>
              </div>
              <button
                onClick={copyLink}
                className="w-full flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                {copied ? (
                  <><svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg><span className="text-emerald-400">Lien copié !</span></>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>Copier le lien</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {session && <BottomNav />}
    </div>
  );
}
