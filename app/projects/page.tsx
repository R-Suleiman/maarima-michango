// app/projects/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

interface Project {
  id: string;
  name: string;
  description: string;
  target_amount: number;
  is_active: boolean;
  created_at: string;
}

export default function AllProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 6;

  async function loadAllProjects() {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProjects(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadAllProjects();
  }, []);

  // Filtering & Pagination logic
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="bg-emerald-900 text-white py-8 px-4 border-b border-emerald-800 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/" className="text-emerald-200 hover:text-white text-xs font-bold uppercase tracking-wider">
              ← Rudi Nyumbani
            </Link>
            <h1 className="text-3xl font-black mt-1 tracking-tight">Orodha ya Miradi Yote</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-3">
          <span className="text-zinc-400 text-lg pl-1">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page
            }}
            placeholder="Tafuta mradi wowote kwa jina au maelezo yake..."
            className="w-full bg-transparent border-none text-sm text-zinc-900 focus:outline-none placeholder:text-zinc-400"
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-500 font-semibold">Inapakia orodha ya miradi yote...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center shadow-sm text-zinc-500">
            Hakuna mradi unaoendana na utafutaji wako.
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentProjects.map((proj) => (
                <Link 
                  href={`/projects/${proj.id}`}
                  key={proj.id}
                  className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      proj.is_active 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                        : 'bg-zinc-100 text-zinc-500 border-zinc-250'
                    }`}>
                      {proj.is_active ? 'Inaendelea' : 'Umekamilika'}
                    </span>
                    <h3 className="font-extrabold text-zinc-950 text-lg">{proj.name}</h3>
                    <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed">{proj.description}</p>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white px-4 py-3 border border-zinc-200 rounded-xl shadow-sm text-sm">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="px-4 py-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-transparent text-zinc-700 font-bold transition-colors"
                >
                  ◀ Nyuma
                </button>
                <span className="text-xs font-bold text-zinc-500">
                  Ukurasa {currentPage} kati ya {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="px-4 py-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-transparent text-zinc-700 font-bold transition-colors"
                >
                  Mbele ▶
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}