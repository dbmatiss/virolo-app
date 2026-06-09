"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import BottomNav from "../components/BottomNav";

interface SavedRoute {
  id: string;
  share_token: string;
  duration: number;
  center_lat: number;
  center_lng: number;
  created_at: string;
}

interface Friend {
  id: string;
  name: string;
  email: string;
}

function durationLabel(d: number) {
  const h = Math.floor(d);
  const m = (d % 1) * 60;
  return m > 0 ? `${h}h${m.toFixed(0)}` : `${h}h`;
}

export default function RoutesPage() {
  const { data: session, status } = useSession();
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareMenuId, setShareMenuId] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/routes").then((r) => r.json()).then((d) => setRoutes(d.routes ?? [])),
      fetch("/api/friends").then((r) => r.json()).then((d) => setFriends(d.friends ?? [])),
    ]).finally(() => setLoading(false));
  }, [status]);

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/r/${token}`);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareWithFriend = async (routeId: string, friendId: string) => {
    setShareStatus(null);
    const res = await fetch("/api/routes/share-with-friend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routeId, friendId }),
    });
    if (res.ok) {
      setShareStatus("Boucle partagée !");
      setTimeout(() => { setShareMenuId(null); setShareStatus(null); }, 1200);
    } else {
      const d = await res.json();
      setShareStatus(d.error ?? "Erreur");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center bg-zinc-950">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center bg-zinc-950">
          <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold mb-1">Connecte-toi pour voir tes boucles</p>
            <p className="text-zinc-400 text-sm">Toutes tes boucles générées sauvegardées en un endroit.</p>
          </div>
          <Link href="/login" className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl transition-colors">
            Se connecter
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <header className="flex-none bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-sm font-bold shadow-md shadow-orange-500/30">V</div>
          <span className="font-bold text-lg tracking-tight">Virolo</span>
        </Link>
        <h1 className="font-bold text-base">Mes boucles</h1>
        <Link
          href="/app"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto">
        {routes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center">
            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold mb-1">Aucune boucle pour l&apos;instant</p>
              <p className="text-zinc-500 text-sm">Génère ta première boucle et elle apparaîtra ici.</p>
            </div>
            <Link href="/app" className="flex items-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl transition-colors text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Générer une boucle
            </Link>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <p className="text-xs text-zinc-600">{routes.length} boucle{routes.length > 1 ? "s" : ""} sauvegardée{routes.length > 1 ? "s" : ""}</p>
            {routes.map((r) => (
              <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange-500/15 border border-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">
                        {durationLabel(r.duration)} · <span className="text-orange-400">~{Math.round(r.duration * 45)} km</span>
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {new Date(r.created_at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/r/${r.share_token}`}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white font-medium py-2 rounded-xl transition-colors text-xs"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Voir
                    </Link>
                    <button
                      onClick={() => copyLink(r.share_token)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white font-medium py-2 rounded-xl transition-colors text-xs"
                    >
                      {copied === r.share_token ? (
                        <><svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg><span className="text-emerald-400">Copié !</span></>
                      ) : (
                        <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>Lien</>
                      )}
                    </button>
                    {friends.length > 0 && (
                      <button
                        onClick={() => { setShareMenuId(shareMenuId === r.id ? null : r.id); setShareStatus(null); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 border font-medium py-2 rounded-xl transition-colors text-xs ${
                          shareMenuId === r.id
                            ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                            : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300 hover:text-white"
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-6a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Amis
                      </button>
                    )}
                  </div>
                </div>

                {shareMenuId === r.id && (
                  <div className="px-4 pb-4 pt-0 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500 mt-3 mb-2">Partager avec :</p>
                    <div className="flex flex-wrap gap-2">
                      {friends.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => shareWithFriend(r.id, f.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-orange-500 hover:text-white text-zinc-300 rounded-lg transition-colors"
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                    {shareStatus && (
                      <p className="text-xs text-emerald-400 mt-2">{shareStatus}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
