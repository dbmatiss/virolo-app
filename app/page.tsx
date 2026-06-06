import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-full bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-black text-sm">V</div>
          <span className="font-bold text-lg tracking-tight">Virolo</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">Connexion</Link>
          <Link href="/app" className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold rounded-xl transition-colors">
            Essayer
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          🏍️ Générateur de boucles moto
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-6 max-w-2xl leading-tight">
          Ta prochaine boucle moto{" "}
          <span className="text-orange-500">t&apos;attend.</span>
        </h1>

        <p className="text-zinc-400 text-lg sm:text-xl max-w-xl mb-10 leading-relaxed">
          Donne ta position et la durée souhaitée. Virolo génère un itinéraire sinueux sur mesure, loin des autoroutes.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-16">
          <Link href="/app" className="flex items-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-2xl text-base transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Générer une boucle
          </Link>
          <Link href="/login" className="px-8 py-4 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-semibold rounded-2xl text-base transition-colors">
            Créer un compte
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
          {[
            { icon: "🗺️", title: "Itinéraire sur mesure", desc: "Boucles générées selon ta position et ta durée" },
            { icon: "🛣️", title: "Routes sinueuses", desc: "Autoroutes et péages évités, virages privilégiés" },
            { icon: "📱", title: "Navigation directe", desc: "Ouvre dans Google Maps ou exporte en GPX" },
          ].map((f) => (
            <div key={f.title} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-left">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-1 text-sm">{f.title}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-zinc-700 border-t border-zinc-900">
        © 2026 Virolo · Fait pour les motards
      </footer>
    </div>
  );
}
