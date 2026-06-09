"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import BottomNav, { avatarColor } from "../components/BottomNav";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [routeCount, setRouteCount] = useState<number | null>(null);
  const [friendCount, setFriendCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/routes").then((r) => r.json()).then((d) => setRouteCount(d.routes?.length ?? 0)),
      fetch("/api/friends").then((r) => r.json()).then((d) => setFriendCount(d.friends?.length ?? 0)),
    ]).finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || (status === "authenticated" && loading)) {
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold mb-1">Crée ton profil motard</p>
            <p className="text-zinc-400 text-sm">Sauvegarde tes boucles et connecte-toi avec des amis.</p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Link href="/login" className="w-full flex items-center justify-center px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl transition-colors">
              Se connecter
            </Link>
            <Link href="/login" className="w-full flex items-center justify-center px-6 py-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors text-sm">
              Créer un compte
            </Link>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const name = session.user?.name ?? "Motard";
  const email = session.user?.email ?? "";
  const initial = name[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <header className="flex-none bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-sm font-bold shadow-md shadow-orange-500/30">V</div>
          <span className="font-bold text-lg tracking-tight">Virolo</span>
        </Link>
        <h1 className="font-bold text-base">Profil</h1>
        <div className="w-20" />
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
          {/* Avatar + infos */}
          <div className="flex flex-col items-center gap-4 pt-4">
            {session.user?.image ? (
              <Image
                src={session.user.image}
                alt=""
                width={80}
                height={80}
                className="rounded-2xl shadow-lg"
              />
            ) : (
              <div className={`w-20 h-20 ${avatarColor(name)} rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg`}>
                {initial}
              </div>
            )}
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">{name}</h2>
              <p className="text-sm text-zinc-500 mt-0.5">{email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/routes" className="bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 rounded-2xl p-5 text-center transition-colors group">
              <p className="text-3xl font-black text-white mb-1 group-hover:text-orange-400 transition-colors">
                {routeCount ?? "—"}
              </p>
              <p className="text-xs text-zinc-500 font-medium">Boucle{routeCount !== 1 ? "s" : ""} générée{routeCount !== 1 ? "s" : ""}</p>
            </Link>
            <Link href="/friends" className="bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 rounded-2xl p-5 text-center transition-colors group">
              <p className="text-3xl font-black text-white mb-1 group-hover:text-orange-400 transition-colors">
                {friendCount ?? "—"}
              </p>
              <p className="text-xs text-zinc-500 font-medium">Ami{friendCount !== 1 ? "s" : ""}</p>
            </Link>
          </div>

          {/* Quick actions */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
            <Link href="/routes" className="flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-800/60 transition-colors group">
              <div className="w-8 h-8 bg-zinc-800 group-hover:bg-orange-500/20 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-zinc-400 group-hover:text-orange-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <span className="flex-1 text-sm text-zinc-300">Mes boucles</span>
              <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/friends" className="flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-800/60 transition-colors group">
              <div className="w-8 h-8 bg-zinc-800 group-hover:bg-orange-500/20 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-zinc-400 group-hover:text-orange-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-6a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="flex-1 text-sm text-zinc-300">Mes amis</span>
              <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/app" className="flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-800/60 transition-colors group">
              <div className="w-8 h-8 bg-zinc-800 group-hover:bg-orange-500/20 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-zinc-400 group-hover:text-orange-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <span className="flex-1 text-sm text-zinc-300">Générer une boucle</span>
              <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-zinc-900 border border-zinc-800 hover:border-red-500/30 hover:bg-red-500/5 text-zinc-400 hover:text-red-400 font-medium rounded-2xl transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Se déconnecter
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
