"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import BottomNav, { avatarColor } from "../components/BottomNav";

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

type Tab = "amis" | "demandes" | "recues";

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-10 h-10 text-sm";
  return (
    <div className={`${sz} ${avatarColor(name)} rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

export default function FriendsPage() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<Tab>("amis");
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
    if (query.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) { const data = await res.json(); setResults(data.users ?? []); }
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
    if (!res.ok) { setMessage({ type: "error", text: data.error ?? "Erreur" }); return; }
    setMessage({ type: "ok", text: "Demande envoyée !" });
    setQuery("");
    setResults([]);
    loadFriends();
  }

  async function respond(id: string, action: "accept" | "remove") {
    if (action === "accept") await fetch(`/api/friends/${id}`, { method: "PATCH" });
    else await fetch(`/api/friends/${id}`, { method: "DELETE" });
    loadFriends();
  }

  const durationLabel = (d: number) => {
    const h = Math.floor(d);
    const m = (d % 1) * 60;
    return m > 0 ? `${h}h${m.toFixed(0)}` : `${h}h`;
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-6a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold mb-1">Connecte-toi pour gérer tes amis</p>
            <p className="text-zinc-400 text-sm">Partage tes boucles avec ta communauté de motards.</p>
          </div>
          <Link href="/login" className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl transition-colors">
            Se connecter
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const pendingCount = incoming.length;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "amis", label: "Amis", count: friends.length > 0 ? friends.length : undefined },
    { id: "demandes", label: "Demandes", count: pendingCount > 0 ? pendingCount : undefined },
    { id: "recues", label: "Reçues", count: shared.length > 0 ? shared.length : undefined },
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <header className="flex-none bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-sm font-bold shadow-md shadow-orange-500/30">V</div>
          <span className="font-bold text-lg tracking-tight">Virolo</span>
        </Link>
        <h1 className="font-bold text-base">Amis</h1>
        <div className="w-20" />
      </header>

      {/* Tabs */}
      <div className="flex-none flex border-b border-zinc-800 bg-zinc-950 px-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                tab === t.id ? "bg-orange-500/20 text-orange-400" : "bg-zinc-800 text-zinc-500"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Tab: Amis */}
        {tab === "amis" && (
          <div className="p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ajouter un ami par nom ou email..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500/60 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {message && (
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border ${
                message.type === "ok"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                {message.text}
              </div>
            )}

            {results.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
                {results.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-3">
                    <Avatar name={u.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                    </div>
                    <button
                      onClick={() => sendRequest(u.email)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-white rounded-lg transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      Ajouter
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Friends list */}
            {friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-6a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-zinc-400 text-sm">Pas encore d&apos;amis.</p>
                <p className="text-zinc-600 text-xs">Recherche par nom ou email pour en ajouter.</p>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
                {friends.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-4">
                    <Avatar name={f.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{f.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{f.email}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" title="Ami" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Demandes */}
        {tab === "demandes" && (
          <div className="p-4 space-y-6">
            {incoming.length === 0 && outgoing.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-zinc-400 text-sm">Aucune demande en attente.</p>
              </div>
            )}

            {incoming.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 font-semibold tracking-widest mb-3">REÇUES</p>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
                  {incoming.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 p-4">
                      <Avatar name={r.user.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{r.user.name}</p>
                        <p className="text-xs text-zinc-500 truncate">{r.user.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => respond(r.id, "accept")}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Accepter
                        </button>
                        <button
                          onClick={() => respond(r.id, "remove")}
                          className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {outgoing.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 font-semibold tracking-widest mb-3">ENVOYÉES</p>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
                  {outgoing.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 p-4">
                      <Avatar name={r.user.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{r.user.name}</p>
                        <p className="text-xs text-zinc-500">En attente de réponse...</p>
                      </div>
                      <button
                        onClick={() => respond(r.id, "remove")}
                        className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Reçues */}
        {tab === "recues" && (
          <div className="p-4">
            {shared.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <p className="text-zinc-400 text-sm">Aucune boucle reçue pour l&apos;instant.</p>
                <p className="text-zinc-600 text-xs">Demande à un ami de te partager une de ses boucles.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {shared.map((s) =>
                  s.route ? (
                    <Link
                      key={s.id}
                      href={`/r/${s.route.share_token}`}
                      className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 rounded-2xl p-4 transition-all group"
                    >
                      <div className="w-10 h-10 bg-orange-500/15 border border-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-white">
                            Boucle {s.route.duration}h · ~{Math.round(s.route.duration * 45)} km
                          </p>
                        </div>
                        <p className="text-xs text-zinc-500">
                          De <span className="text-zinc-400">{s.sender?.name ?? "un ami"}</span> · {new Date(s.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-zinc-600 group-hover:text-orange-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : null
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
