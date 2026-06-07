"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface FriendUser {
  id: string;
  name: string;
  email: string;
}

interface FriendRequest {
  id: string;
  status: "pending" | "accepted";
  created_at: string;
  user: FriendUser;
  direction: "incoming" | "outgoing";
}

interface SharedRoute {
  id: string;
  created_at: string;
  route: {
    id: string;
    share_token: string;
    duration: number;
    center_lat: number;
    center_lng: number;
    created_at: string;
  } | null;
  sender: { id: string; name: string } | null;
}

export default function FriendsPage() {
  const { data: session, status } = useSession();
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [shared, setShared] = useState<SharedRoute[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const loadFriends = useCallback(async () => {
    const res = await fetch("/api/friends");
    if (res.ok) {
      const data = await res.json();
      setFriends(data.friends ?? []);
      setIncoming(data.incoming ?? []);
      setOutgoing(data.outgoing ?? []);
    }
  }, []);

  const loadShared = useCallback(async () => {
    const res = await fetch("/api/routes/inbox");
    if (res.ok) {
      const data = await res.json();
      setShared(data.shared ?? []);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([loadFriends(), loadShared()]).finally(() => setLoading(false));
  }, [status, loadFriends, loadShared]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.users ?? []);
      }
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  async function sendRequest(email: string) {
    setMessage(null);
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Erreur" });
      return;
    }
    setMessage({ type: "ok", text: "Demande envoyée !" });
    setQuery("");
    setResults([]);
    loadFriends();
  }

  async function respond(id: string, action: "accept" | "remove") {
    if (action === "accept") {
      await fetch(`/api/friends/${id}`, { method: "PATCH" });
    } else {
      await fetch(`/api/friends/${id}`, { method: "DELETE" });
    }
    loadFriends();
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-full bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-full bg-zinc-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-zinc-400">Connecte-toi pour gérer tes amis.</p>
        <Link href="/login" className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl transition-colors">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-zinc-950 text-white">
      <header className="bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <Link href="/app" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-sm font-bold">V</div>
          <span className="font-bold text-lg tracking-tight">Virolo</span>
        </Link>
        <Link href="/app" className="text-sm text-zinc-400 hover:text-white transition-colors">
          ← Retour à la carte
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight mb-1">Mes amis</h1>
          <p className="text-zinc-500 text-sm">Ajoute des amis pour partager tes boucles avec eux.</p>
        </div>

        {/* Recherche / ajout */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="font-semibold text-sm text-zinc-300 mb-3">Ajouter un ami</h2>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/60 transition-colors"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {message && (
            <p className={`mt-2 text-xs ${message.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>
              {message.text}
            </p>
          )}

          {results.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {results.map((u) => (
                <div key={u.id} className="flex items-center justify-between bg-zinc-800/60 rounded-xl px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{u.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                  </div>
                  <button
                    onClick={() => sendRequest(u.email)}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-white rounded-lg transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Demandes reçues */}
        {incoming.length > 0 && (
          <section>
            <h2 className="font-semibold text-sm text-zinc-300 mb-3">Demandes reçues</h2>
            <div className="space-y-2">
              {incoming.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-orange-500/20 text-orange-400 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {r.user.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{r.user.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{r.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => respond(r.id, "accept")}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors"
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => respond(r.id, "remove")}
                      className="px-3 py-1.5 text-xs font-semibold bg-zinc-800 text-zinc-400 hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Demandes envoyées */}
        {outgoing.length > 0 && (
          <section>
            <h2 className="font-semibold text-sm text-zinc-300 mb-3">Demandes envoyées</h2>
            <div className="space-y-2">
              {outgoing.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-zinc-800 text-zinc-400 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {r.user.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{r.user.name}</p>
                      <p className="text-xs text-zinc-500">En attente de réponse...</p>
                    </div>
                  </div>
                  <button
                    onClick={() => respond(r.id, "remove")}
                    className="px-3 py-1.5 text-xs font-semibold bg-zinc-800 text-zinc-400 hover:bg-zinc-700 rounded-lg transition-colors flex-shrink-0"
                  >
                    Annuler
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Liste d'amis */}
        <section>
          <h2 className="font-semibold text-sm text-zinc-300 mb-3">
            Mes amis {friends.length > 0 && <span className="text-zinc-600">({friends.length})</span>}
          </h2>
          {friends.length === 0 ? (
            <p className="text-sm text-zinc-600">Pas encore d&apos;amis. Utilise la recherche ci-dessus pour en ajouter !</p>
          ) : (
            <div className="space-y-2">
              {friends.map((f) => (
                <div key={f.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-orange-500/20 text-orange-400 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {f.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{f.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{f.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Boucles partagées avec moi */}
        <section>
          <h2 className="font-semibold text-sm text-zinc-300 mb-3">Boucles partagées avec moi</h2>
          {shared.length === 0 ? (
            <p className="text-sm text-zinc-600">Aucune boucle reçue pour l&apos;instant.</p>
          ) : (
            <div className="space-y-2">
              {shared.map((s) =>
                s.route ? (
                  <Link
                    key={s.id}
                    href={`/r/${s.route.share_token}`}
                    className="flex items-center justify-between bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 rounded-xl px-4 py-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">
                        Boucle de {s.route.duration}h{" "}
                        <span className="text-zinc-500 font-normal">par {s.sender?.name ?? "un ami"}</span>
                      </p>
                      <p className="text-xs text-zinc-500">
                        Reçue le {new Date(s.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : null
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
