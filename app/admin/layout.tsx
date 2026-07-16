'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State kwa ajili ya toggle kwenye mobile
  const router = useRouter();
  const pathname = usePathname();

  // Kufunga sidebar kila wakati njia (path) inapobadilika kwenye mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If we are on the login page, let it render normally
      if (pathname === '/admin/login') {
        setLoading(false);
        return;
      }

      if (!session) {
        // Not logged in: Redirect to login page
        setAuthenticated(false);
        router.push('/admin/login');
      } else {
        // Logged in: Grant access
        setAuthenticated(true);
      }
      setLoading(false);
    }

    checkAuth();
  }, [pathname, router]);

  // Logout function
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/admin/login');
  }

  // Show a dark loading screen while verifying session status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // If on login page, just render the child login page directly without the sidebar wrapper
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // If authenticated, render the administrative control panel with the sidebar
  if (authenticated) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-zinc-50 relative">
        
        {/* MOBILE TOP BAR - Inaonyesha Kitufe cha Toggle kwenye Simu tu */}
        <div className="md:hidden bg-black text-white flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-emerald-500">🕌 Maarima</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-zinc-300 hover:text-white focus:outline-none text-xl"
            aria-label="Toggle Sidebar"
          >
            {isSidebarOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Admin Sidebar */}
        <aside 
          className={`
            fixed inset-y-0 left-0 z-40 w-64 bg-black text-white flex flex-col justify-between border-r border-zinc-800 transform transition-transform duration-200 ease-in-out
            md:translate-x-0 md:static md:h-screen
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-0 hidden md:flex'}
          `}
        >
          <div>
            {/* LOGO AREA / HEADER WA SIDEBAR */}
            <div className="p-6 border-b border-zinc-800 flex flex-col items-center text-center">
              
              <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center mb-3 text-2xl">
              <div className="mb-3">
                  <img 
                    src="/maarima-logo.png" 
                    alt="Maarima Logo" 
                    className="h-20 w-20 object-contain"
                  />
                </div>
              </div>

              <Link href="/" className="text-xl font-bold text-emerald-500 block hover:text-emerald-400 transition-colors">
                Maarima Admin
              </Link>
              <p className="text-xs text-zinc-400 mt-1">Utawala wa Michango</p>
            </div>

            <nav className="p-4 space-y-2">
              <Link href="/admin/dashboard">
                <div  className={`block px-4 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                  pathname === '/admin/dashboard'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`}>
                  🏠 Dashboard
                </div>
              </Link>
              <Link href="/admin/members">
                <div className={`block px-4 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                  pathname === '/admin/members'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`}>
                  👥 Wanachama
                </div>
              </Link>
              
              <Link href="/admin/projects">
                <div className={`block px-4 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                  pathname === '/admin/projects'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`}>
                  📂 Miradi ya Maendeleo
                </div>
              </Link>

              <Link
                href="/admin/contributions"
                className={`block px-4 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                  pathname === '/admin/contributions'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                💰 Kuingiza Michango
              </Link>
            </nav>
          </div>

          {/* Sidebar Footer (Logout Button) */}
          <div className="p-4 border-t border-zinc-800">
            <button
              onClick={handleLogout}
              className="w-full bg-zinc-900 hover:bg-zinc-850 text-red-400 border border-red-500/10 py-2 rounded-md text-xs font-bold transition-colors"
            >
              🚪 Ondoka (Logout)
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay (Gusa nje ya sidebar ili kuifunga kwenye simu) */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)} 
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto h-screen">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return null;
}