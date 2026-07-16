// app/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/utils/supabase';

interface Project {
  id: string;
  name: string;
  description: string;
  target_amount: number;
  is_active: boolean;
  created_at: string;
}

export default function HomePage() {
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);

  async function loadHomeStats() {
    setLoading(true);
    // Fetch 3 most recent active projects
    const { data: projData } = await supabase
      .from('projects')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3);

    // Fetch total members count
    const { count } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true });

    if (projData) setRecentProjects(projData);
    if (count) setTotalMembers(count);
    setLoading(false);
  }

  useEffect(() => {
    loadHomeStats();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Banner Header */}
      <header className="bg-emerald-900 text-white py-12 px-4 border-b border-emerald-800 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Logo Container */}
            <div className="relative flex-shrink-0 w-20 h-20 bg-white rounded-2xl border border-emerald-700/50 flex items-center justify-center overflow-hidden shadow-inner">
              {/* Image ya Logo na Fallback placeholder */}
              <Image 
                src="/maarima-logo.png" 
                alt="Logo ya Maarima"
                width={80}
                height={80}
                className="object-contain p-2"
                onError={(e) => {
                  // Fallback ya maandishi/icon nzuri kama logo isipopatikana
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              
            </div>

            <div>
              <span className="bg-emerald-800 text-emerald-200 text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded">
                Madrassa Maarima
              </span>
              <h1 className="text-3xl md:text-4xl font-black mt-1 tracking-tight">Mfumo wa Michango</h1>
              <p className="text-emerald-100/80 text-xs md:text-sm mt-1">
                Fuatilia maendeleo ya miradi yetu na michango yako kwa uwazi na urahisi.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link 
              href="/projects" 
              className="inline-flex items-center gap-1.5 bg-white hover:bg-zinc-150 text-emerald-900 text-xs font-extrabold px-4 py-2.5 rounded-lg transition-all shadow-sm"
            >
              📂 Angalia Miradi Yote
            </Link>
            <Link 
              href="/admin" 
              className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg border border-emerald-700/50 transition-all shadow-sm"
            >
              🔒 Kuingia (Admin Portal)
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Intro/Quick Stats Dashboard */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-2">
            <h2 className="text-lg font-bold text-zinc-800">Karibu Maarima Michango</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Mfumo huu umetengenezwa kusaidia Madrassa ya Maarima kuweka kumbukumbu sahihi za miradi mbalimbali ya maendeleo na michango inayotolewa na wahitimu (alumni), wanafunzi, pamoja na wadau wengineo.
            </p>
          </div>
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm flex flex-col justify-center space-y-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Wanachama Waliosajiliwa</span>
            <span className="text-5xl font-black text-emerald-800">{totalMembers}</span>
            <span className="text-xs text-zinc-500">Wapo tayari kuchangia na kuendeleza Madrassa</span>
          </div>
        </section>

        {/* Recent Projects Cards Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-zinc-900">Miradi ya Hivi Karibuni</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Chagua mradi hapa chini kufuatilia michango na maendeleo yake kwa kina.</p>
            </div>
            <Link 
              href="/projects" 
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Miradi Yote →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-zinc-500 font-semibold">Inapakia miradi...</div>
          ) : recentProjects.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center shadow-sm">
              <h3 className="text-lg font-bold text-zinc-800">Hakuna Miradi Inayoendelea kwa Sasa</h3>
              <p className="text-sm text-zinc-500 mt-1">Tafadhali rudi baadaye kiongozi atakapoweka mradi mpya.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentProjects.map((proj) => (
                <Link 
                  href={`/projects/${proj.id}`}
                  key={proj.id}
                  className="group bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                      Inaendelea
                    </span>
                    <h3 className="font-extrabold text-zinc-950 text-lg group-hover:text-emerald-850 transition-colors">
                      {proj.name}
                    </h3>
                    <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed">
                      {proj.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-650">
                    <span>Lengo:</span>
                    <span className="font-black text-zinc-900">
                      {new Intl.NumberFormat('en-US').format(proj.target_amount)} TSH
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white py-8 text-center text-xs text-zinc-400 mt-16">
        <p>© {new Date().getFullYear()} Maarima Michango System. Imetengenezwa kwa uaminifu na kusaidia maendeleo ya Madrassa ya Maarima.</p>
      </footer>
    </div>
  );
}