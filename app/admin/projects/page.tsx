// app/admin/projects/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

interface Project {
  id: string;
  name: string;
  type: 'one_time' | 'monthly_recurring';
  target_amount: number;
  description: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'one_time' | 'monthly_recurring'>('one_time');
  const [targetAmount, setTargetAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch Projects
  async function fetchProjects() {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  // Add New Project
  async function handleAddProject(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !targetAmount) return;

    setSubmitting(true);
    setMessage(null);

    const { error } = await supabase.from('projects').insert([
      {
        name: name.trim(),
        type: type,
        target_amount: parseFloat(targetAmount),
        description: description.trim(),
        is_active: true,
      },
    ]);

    if (error) {
      setMessage({ type: 'error', text: 'Imeshindwa kusajili mradi: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Mradi umesajiliwa kikamilifu!' });
      setName('');
      setType('one_time');
      setTargetAmount('');
      setDescription('');
      fetchProjects();
      
      // Funga modal baada ya sekunde 1.5 kuonyesha ujumbe wa mafanikio
      setTimeout(() => {
        setIsModalOpen(false);
        setMessage(null);
      }, 1500);
    }
    setSubmitting(false);
  }

  // Toggle Project is_active
  async function toggleProjectStatus(id: string, currentStatus: boolean, e: React.MouseEvent) {
    e.preventDefault(); // Kuzuia isifungue link wakati wa kubonyeza kitufe
    const { error } = await supabase
      .from('projects')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      alert('Imeshindwa kubadili hali ya mradi');
    } else {
      fetchProjects();
    }
  }

  // Chuja miradi kulingana na utafutaji (Search Query)
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header na Kitufe cha kuongeza mradi */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-200 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Miradi ya Maendeleo</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Unda na usimamie miradi mbalimbali ya michango ya Madrassa.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-sm self-start md:self-auto"
        >
          ➕ Sajili Mradi Mpya
        </button>
      </div>

      {/* Search na Refresh */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tafuta mradi kwa jina au maelezo..."
            className="w-full rounded-lg border border-zinc-300 bg-white pl-3 pr-10 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
          />
          <span className="absolute right-3 top-2.5 text-zinc-400 text-sm">🔍</span>
        </div>
        <button
          onClick={fetchProjects}
          className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 border border-zinc-200 bg-white px-3 py-2.5 rounded-lg shadow-sm w-full md:w-auto justify-center"
        >
          🔄 Booresha Orodha
        </button>
      </div>

      {/* Grid ya Miradi */}
      {loading ? (
        <div className="py-20 text-center text-zinc-500 font-semibold">Inapakia miradi...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl py-20 text-center text-zinc-500">
          {searchQuery ? 'Hakuna mradi uliopatikana kwa utafutaji huo.' : 'Hakuna mradi uliosajiliwa kwa sasa.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-zinc-300 transition-all">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-zinc-900 text-base leading-tight line-clamp-1">{project.name}</h3>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider shrink-0 ${
                      project.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-zinc-100 text-zinc-650 border-zinc-200'
                    }`}
                  >
                    {project.is_active ? 'Hadi Sasa' : 'Imefungwa'}
                  </span>
                </div>

                <div className="flex gap-2 mt-2">
                  <span className="inline-block text-[10px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded font-medium">
                    {project.type === 'one_time' ? 'Mara Moja (One-Time)' : 'Kila Mwezi (Monthly)'}
                  </span>
                </div>
                
                <p className="text-xs text-zinc-500 mt-3 line-clamp-2 min-h-[2rem]">
                  {project.description || 'Hakuna maelezo yaliyowekwa.'}
                </p>

                <div className="mt-4 pt-3 border-t border-zinc-100">
                  <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-bold">Lengo la Mradi</span>
                  <span className="text-lg font-black text-zinc-950">
                    {new Intl.NumberFormat('en-US').format(project.target_amount)} TSH
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                <button
                  onClick={(e) => toggleProjectStatus(project.id, project.is_active, e)}
                  className={`text-[10px] font-bold py-1.5 px-2.5 rounded-lg border transition-colors shrink-0 ${
                    project.is_active
                      ? 'border-red-150 text-red-700 hover:bg-red-50/50'
                      : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {project.is_active ? 'Funga Mradi 🔴' : 'Fungua Mradi 🟢'}
                </button>

                <Link
                  href={`/admin/projects/${project.id}`}
                  className="inline-flex items-center text-[10px] font-bold text-white bg-emerald-900 hover:bg-emerald-800 px-3 py-2 rounded-lg transition-all"
                >
                  👁️ Angalia Mradi
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POPUP REGISTRATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-zinc-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <h2 className="text-lg font-extrabold text-zinc-900">Sajili Mradi Mpya</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setMessage(null);
                }}
                className="text-zinc-400 hover:text-zinc-650 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleAddProject} className="p-5 space-y-4">
              {message && (
                <div
                  className={`p-3 rounded-lg text-sm border ${
                    message.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Jina la Mradi (Name) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mf. Ujenzi wa Madrassa"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Aina ya Mradi (Type) *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="one_time">Mchango wa Mara Moja (One-time)</option>
                  <option value="monthly_recurring">Kila Mwezi (Monthly Recurring)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Lengo la Fedha (Target Amount - TSH) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="Mf. 5000000"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Maelezo ya Mradi (Description)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Maelezo mafupi..."
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-150 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setMessage(null);
                  }}
                  className="px-4 py-2 text-xs font-bold border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-900 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors disabled:bg-zinc-400"
                >
                  {submitting ? 'Inahifadhi...' : 'Sajili'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}