"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import BottomNav, { avatarColor } from "../components/BottomNav";
import { useTheme } from "../components/ThemeProvider";

interface Route {
  id: string;
  duration: number;
  created_at: string;
}

function StatCard({ value, label, sub, href }: { value: string; label: string; sub?: string; href?: string }) {
  const inner = (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center hover:border-zinc-700 transition-colors group">
      <p className="text-2xl font-black text-white group-hover:text-orange-400 transition-colors leading-none mb-1">{value}</p>
      <p className="text-xs text-zinc-400 font-medium">{label}</p>
      {sub && <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

function SkeletonStat() {
  return <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 animate-pulse h-20" />;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [friendCount, setFriendCount] = useState<number | null>(null);
  const [sharedCount, setSharedCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/routes").then((r) => r.json()).then((d) => setRoutes(d.routes ?? [])),
      fetch("/api/friends").then((r) => r.json()).then((d) => setFriendCount(d.friends?.length ?? 0)),
      fetch("/api/routes/inbox").then((r) => r.json()).then((d) => setSharedCount(d.shared?.length ?? 0)),
    ]).finally(() => setLoading(false));
  }, [status]);

  const totalKm = routes.reduce((acc, r) => acc + Math.round(r.duration * 45), 0);
  const totalHours = routes.reduce((acc, r) => acc + r.duration, 0);
  const totalHoursLabel = totalHours >= 1
    ? `${Math.floor(totalHours)}h${totalHours % 1 ? ((totalHours % 1) * 60).toFixed(0) + "m" : ""}`
    : `${Math.round(totalHours * 60)} min`;

  // Boucle la plus longue
  const longestRoute = routes.reduce<Route | null>((best, r) => !best || r.duration > best.duration ? r : best, null);

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="flex flex-col h-full bg-zinc-950">
        <header className="flex-none bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-sm font-bold">V</div>
            <span className="font-bold text-lg tracking-tight">Virolo</span>
          </div>
          <h1 className="font-bold text-base">Profil</h1>
          <div className="w-20" />
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex flex-col items-center py-6 gap-3 animate-pulse">
            <div className="w-20 h-20 bg-zinc-800 rounded-2xl" />
            <div className="h-5 w-32 bg-zinc-800 rounded" />
            <div className="h-3 w-40 bg-zinc-800 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SkeletonStat /><SkeletonStat /><SkeletonStat /><SkeletonStat />
          </div>
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

  const { theme, toggle: toggleTheme } = useTheme();
  const name = session.user?.name ?? "Motard";
  const email = session.user?.email ?? "";
  const initial = name[0]?.toUpperCase() ?? "?";
  const memberSince = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

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
        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

          {/* Avatar + infos */}
          <div className="flex flex-col items-center gap-3 py-4">
            {session.user?.image ? (
              <Image src={session.user.image} alt="" width={80} height={80} className="rounded-2xl shadow-lg" />
            ) : (
              <div className={`w-20 h-20 ${avatarColor(name)} rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg`}>
                {initial}
              </div>
            )}
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">{name}</h2>
              <p className="text-sm text-zinc-500 mt-0.5">{email}</p>
              <p className="text-xs text-zinc-700 mt-1">Membre depuis {memberSince}</p>
            </div>
          </div>

          {/* Stats grid */}
          <div>
            <p className="text-[10px] text-zinc-600 font-semibold tracking-widest mb-3">STATISTIQUES</p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                value={routes.length.toString()}
                label={`Boucle${routes.length !== 1 ? "s" : ""} générée${routes.length !== 1 ? "s" : ""}`}
                href="/routes"
              />
              <StatCard
                value={`${totalKm.toLocaleString("fr-FR")} km`}
                label="Distance totale estimée"
                sub="à ~45 km/h de moyenne"
              />
              <StatCard
                value={totalHoursLabel}
                label="Temps en selle"
                sub={routes.length > 0 ? "temps cumulé" : undefined}
              />
              <StatCard
                value={friendCount?.toString() ?? "—"}
                label={`Ami${friendCount !== 1 ? "s" : ""} motard${friendCount !== 1 ? "s" : ""}`}
                href="/friends"
              />
            </div>
          </div>

          {/* Extra stats */}
          {routes.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] text-zinc-600 font-semibold tracking-widest">RECORDS</p>
              {longestRoute && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-orange-500/15 border border-orange-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-sm">🏆</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">Boucle la plus longue</p>
                      <p className="text-[10px] text-zinc-500">{new Date(longestRoute.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-orange-400">~{Math.round(longestRoute.duration * 45)} km</p>
                    <p className="text-[10px] text-zinc-500">{Math.floor(longestRoute.duration)}h{longestRoute.duration % 1 ? ((longestRoute.duration % 1) * 60).toFixed(0) : ""}</p>
                  </div>
                </div>
              )}
              {sharedCount !== null && sharedCount > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-blue-500/15 border border-blue-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-sm">📬</span>
                    </div>
                    <p className="text-xs font-medium text-white">Boucles reçues d&apos;amis</p>
                  </div>
                  <p className="text-sm font-bold text-blue-400">{sharedCount}</p>
                </div>
              )}
            </div>
          )}

          {/* Quick actions */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
            {[
              { href: "/routes", label: "Mes boucles", icon: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" },
              { href: "/friends", label: "Mes amis", icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-6a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z" },
              { href: "/app", label: "Générer une boucle", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-800/60 transition-colors group">
                <div className="w-8 h-8 bg-zinc-800 group-hover:bg-orange-500/20 rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
                  <svg className="w-4 h-4 text-zinc-400 group-hover:text-orange-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <span className="flex-1 text-sm text-zinc-300">{item.label}</span>
                <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>

          {/* Thème */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                {theme === "dark" ? (
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm text-zinc-300 font-medium">{theme === "dark" ? "Mode sombre" : "Mode clair"}</p>
                <p className="text-[10px] text-zinc-600">Préférence sauvegardée localement</p>
              </div>
            </div>
            {/* Toggle switch */}
            <button
              onClick={toggleTheme}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                theme === "light" ? "bg-orange-500" : "bg-zinc-700"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                theme === "light" ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
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

          <div className="pb-2" />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
