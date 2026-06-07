"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

const Map = dynamic(() => import("../components/Map"), { ssr: false });

const DEFAULT_CENTER: [number, number] = [48.4, 2.47];

type Style = "tranquille" | "sportif" | "extreme";

interface SavedRoute {
  id: string;
  share_token: string;
  duration: number;
  center_lat: number;
  center_lng: number;
  created_at: string;
}

export default function AppPage() {
  const { data: session } = useSession();
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [duration, setDuration] = useState(2);
  const [style, setStyle] = useState<Style>("sportif");
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [waypoints, setWaypoints] = useState<[number, number][] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpxData, setGpxData] = useState<string | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [justGenerated, setJustGenerated] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [spots, setSpots] = useState<{ name: string; lat: number; lng: number }[]>([]);
  const [shareMenuRouteId, setShareMenuRouteId] = useState<string | null>(null);
  const [friendsList, setFriendsList] = useState<{ id: string; name: string; email: string }[]>([]);
  const [shareFriendStatus, setShareFriendStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/routes").then((r) => r.json()).then((d) => { if (d.routes) setSavedRoutes(d.routes); });
    fetch("/api/friends").then((r) => r.json()).then((d) => { if (d.friends) setFriendsList(d.friends); });
  }, [session]);

  const shareRouteWithFriend = async (routeId: string, friendId: string) => {
    setShareFriendStatus(null);
    const res = await fetch("/api/routes/share-with-friend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routeId, friendId }),
    });
    if (res.ok) {
      setShareFriendStatus("Boucle partagée !");
      setTimeout(() => { setShareMenuRouteId(null); setShareFriendStatus(null); }, 1200);
    } else {
      const d = await res.json();
      setShareFriendStatus(d.error ?? "Erreur");
    }
  };

  const locate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    setGpxData(null);
    setWaypoints(null);
    setShareToken(null);
    setJustGenerated(false);
    setSpots([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: center[0], lng: center[1], duration, style }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur serveur");
      setRoute(data.route);
      setGpxData(data.gpx);
      setWaypoints(data.waypoints ?? null);
      setSpots(data.spots ?? []);
      setJustGenerated(true);

      if (session?.user) {
        const saved = await fetch("/api/routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            duration,
            center_lat: center[0],
            center_lng: center[1],
            waypoints: data.waypoints,
            route: data.route,
            gpx: data.gpx,
          }),
        }).then((r) => r.json());
        if (saved.share_token) setShareToken(saved.share_token);
        fetch("/api/routes").then((r) => r.json()).then((d) => { if (d.routes) setSavedRoutes(d.routes); });
      }
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

  const openGoogleMaps = () => {
    if (!waypoints) return;
    const stops = waypoints.map(([lat, lng]) => `${lat},${lng}`).join("/");
    window.open(`https://www.google.com/maps/dir/${stops}`, "_blank");
  };

  const copyShareLink = () => {
    if (!shareToken) return;
    navigator.clipboard.writeText(`${window.location.origin}/r/${shareToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSavedRoute = async (r: SavedRoute) => {
    const res = await fetch(`/api/routes/share?token=${r.share_token}`);
    const data = await res.json();
    if (data.route) {
      setRoute(data.route.route);
      setGpxData(data.route.gpx);
      setWaypoints(data.route.waypoints);
      setCenter([data.route.center_lat, data.route.center_lng]);
      setDuration(data.route.duration);
      setShareToken(r.share_token);
      setJustGenerated(true);
    }
    setShowSaved(false);
  };

  const durationLabel = () => {
    const h = Math.floor(duration);
    const m = (duration % 1) * 60;
    return m > 0 ? `${h}h${m.toFixed(0)}` : `${h}h`;
  };

  const styles: { value: Style; label: string; emoji: string }[] = [
    { value: "tranquille", label: "Tranquille", emoji: "😌" },
    { value: "sportif", label: "Sportif", emoji: "🏍️" },
    { value: "extreme", label: "Extrême", emoji: "🔥" },
  ];

  return (
    <div className="flex flex-col h-full">
      <header className="flex-none bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between z-[2000] relative">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-sm font-bold">V</div>
          <span className="font-bold text-lg tracking-tight">Virolo</span>
        </Link>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Link
                href="/friends"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4" />
                </svg>
                Amis
              </Link>
              {savedRoutes.length > 0 && (
                <button
                  onClick={() => setShowSaved(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span className="hidden sm:inline">Mes boucles</span>
                  <span className="bg-orange-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium">
                    {savedRoutes.length}
                  </span>
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
                >
                  {session.user?.image ? (
                    <Image src={session.user.image} alt="" width={28} height={28} className="rounded-lg" />
                  ) : (
                    <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center text-xs font-bold">
                      {session.user?.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <span className="text-sm text-zinc-300 hidden sm:inline">{session.user?.name?.split(" ")[0]}</span>
                  <svg className="w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl z-[2001] overflow-hidden animate-fade-in">
                    <div className="px-4 py-3 border-b border-zinc-700">
                      <p className="text-sm font-medium text-white truncate">{session.user?.name}</p>
                      <p className="text-xs text-zinc-400 truncate">{session.user?.email}</p>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/login" className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold rounded-xl transition-colors">
              Connexion
            </Link>
          )}
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0">
          <Map route={route} center={center} />
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 sm:left-4 sm:translate-x-0 z-[1000]">
          <div className="bg-zinc-900/95 backdrop-blur border border-zinc-700/60 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-zinc-800">
              <p className="text-xs text-zinc-500 font-medium mb-1.5">POINT DE DÉPART</p>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 ring-2 ring-blue-400/30" />
                  <span className="text-sm text-zinc-300 font-mono truncate">{center[0].toFixed(4)}, {center[1].toFixed(4)}</span>
                </div>
                <button onClick={locate} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  Ma position
                </button>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-zinc-500 font-medium">DURÉE</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-orange-400">{durationLabel()}</span>
                  <span className="text-xs text-zinc-500">~{Math.round(duration * 45)} km</span>
                </div>
              </div>
              <input type="range" min={0.5} max={6} step={0.5} value={duration} onChange={(e) => setDuration(parseFloat(e.target.value))} className="w-full" />
              <div className="flex justify-between text-xs text-zinc-600 mt-1.5">
                <span>30 min</span><span>6 heures</span>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-zinc-800">
              <p className="text-xs text-zinc-500 font-medium mb-2">STYLE</p>
              <div className="flex gap-2">
                {styles.map((s) => (
                  <button key={s.value} onClick={() => setStyle(s.value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition-all ${
                      style === s.value ? "bg-orange-500/20 border-orange-500/60 text-orange-400" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    <span>{s.emoji}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 py-3 space-y-2">
              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-3 py-2.5 text-sm">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {error}
                </div>
              )}
              <button onClick={generate} disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold py-3.5 rounded-xl transition-all text-sm tracking-wide"
              >
                {loading ? (
                  <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Calcul en cours...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>Générer ma boucle</>
                )}
              </button>

              {justGenerated && gpxData && (
                <div className="space-y-2 animate-fade-in">
                  <div className="flex gap-2">
                    <button onClick={openGoogleMaps} className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:text-blue-300 font-medium py-2.5 rounded-xl transition-colors text-sm">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                      Google Maps
                    </button>
                    <button onClick={downloadGpx} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-medium py-2.5 rounded-xl transition-colors text-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      GPX
                    </button>
                  </div>
                  {shareToken && (
                    <button onClick={copyShareLink} className="w-full flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white font-medium py-2.5 rounded-xl transition-colors text-sm">
                      {copied ? (
                        <><svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span className="text-emerald-400">Lien copié !</span></>
                      ) : (
                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>Partager la boucle</>
                      )}
                    </button>
                  )}
                </div>
              )}

              {spots.length > 0 && (
                <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-3 animate-fade-in">
                  <p className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
                    <span>📍</span> Spots moto sur ta route
                  </p>
                  <div className="space-y-1.5">
                    {spots.map((s) => (
                      <div key={s.name} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                        <span className="text-xs text-zinc-300 truncate">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!session && (
                <p className="text-center text-xs text-zinc-600 pb-1">
                  <Link href="/login" className="text-orange-400 hover:text-orange-300 transition-colors">Connecte-toi</Link> pour sauvegarder et partager
                </p>
              )}
            </div>
          </div>
        </div>

        {userMenuOpen && <div className="fixed inset-0 z-[1500]" onClick={() => setUserMenuOpen(false)} />}
      </div>

      {showSaved && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[2000] flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h2 className="font-bold text-lg">Mes boucles</h2>
              <button onClick={() => setShowSaved(false)} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {savedRoutes.map((r) => (
                <div key={r.id} className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
                  <div className="w-full flex items-center gap-3 p-3">
                    <button onClick={() => loadSavedRoute(r)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <div className="w-8 h-8 bg-orange-500/20 border border-orange-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{Math.floor(r.duration)}h{r.duration % 1 ? ((r.duration % 1) * 60).toFixed(0) : ""} · ~{Math.round(r.duration * 45)} km</p>
                        <p className="text-xs text-zinc-500">{new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</p>
                      </div>
                    </button>
                    {friendsList.length > 0 && (
                      <button
                        onClick={() => { setShareMenuRouteId(shareMenuRouteId === r.id ? null : r.id); setShareFriendStatus(null); }}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                        title="Partager à un ami"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342a4 4 0 100-2.684m0 2.684a4 4 0 110-2.684m0 2.684l6.632 3.658m-6.632-6.342l6.632-3.658m0 0a4 4 0 105.367-5.367 4 4 0 00-5.367 5.367zm0 9.316a4 4 0 105.367 5.367 4 4 0 00-5.367-5.367z" /></svg>
                      </button>
                    )}
                  </div>
                  {shareMenuRouteId === r.id && (
                    <div className="px-3 pb-3 pt-0 border-t border-zinc-700/60 animate-fade-in">
                      <p className="text-xs text-zinc-500 mt-2 mb-1.5">Partager avec :</p>
                      <div className="flex flex-wrap gap-1.5">
                        {friendsList.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => shareRouteWithFriend(r.id, f.id)}
                            className="px-2.5 py-1 text-xs bg-zinc-700 hover:bg-orange-500 hover:text-white text-zinc-300 rounded-lg transition-colors"
                          >
                            {f.name}
                          </button>
                        ))}
                      </div>
                      {shareFriendStatus && <p className="text-xs text-emerald-400 mt-1.5">{shareFriendStatus}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
