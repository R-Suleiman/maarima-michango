// components/PublicNavbar.tsx
import Link from 'next/link';

export default function PublicNavbar() {
  return (
    <nav className="border-b border-zinc-800 bg-black text-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <Link href="/" className="text-xl font-bold text-emerald-500 flex items-center gap-2">
            🕌 Maarima Michango
          </Link>
          <div className="flex space-x-6 items-center">
            <Link href="/" className="text-zinc-300 hover:text-emerald-400 font-medium transition-colors">
              Mwanzo
            </Link>
            <Link href="/search" className="text-zinc-300 hover:text-emerald-400 font-medium transition-colors">
              Rekodi Zangu
            </Link>
            <Link href="/admin" className="text-xs bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-md font-medium transition-colors">
              Utawala (Admin)
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}