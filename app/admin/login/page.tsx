'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  // Redirect to admin dashboard if already logged in
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/admin/dashboard');
      }
    }
    checkSession();
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
  
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(), // trim spaces
        password: password,
      });   
  
      if (error) {
        console.error("Supabase Auth Error Details:", error);
        setErrorMsg(`Hitilafu: ${error.message} (Status: ${error.status})`);
        setLoading(false);
      } else {
        console.log("Login Success! Session data:", data);
        router.push('/admin/dashboard');
      }
    } catch (err) {
      console.error("Unexpected login error:", err);
      setErrorMsg("Kuna hitilafu isiyotarajiwa imetokea.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="max-w-md w-full space-y-8 bg-zinc-900 p-8 rounded-xl border border-zinc-850 shadow-2xl">
        <div className="text-center">
          <span className="text-4xl">🕌</span>
          <h2 className="mt-4 text-3xl font-extrabold text-white">Ingia Utawalani</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Mfumo wa Michango ya Maarima Madrassa
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {errorMsg && (
            <div className="p-3 rounded-md text-sm bg-red-950/50 border border-red-500/30 text-red-400">
              {errorMsg}
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-1">
                Barua Pepe (Email)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                placeholder="admin@maarima.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-1">
                Nenosiri (Password)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-md text-black bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-400 transition-colors"
            >
              {loading ? 'Inaingia...' : 'Ingia Sasa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}