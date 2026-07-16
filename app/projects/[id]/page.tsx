'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';

interface Project {
  id: string;
  name: string;
  description: string;
  target_amount: number;
  is_active: boolean;
  type: 'one_time' | 'monthly_recurring'; // Sasa inatumia Enum kutoka kwenye DB
  created_at: string;
}

interface Contribution {
  amount: number;
  contribution_date: string;
  target_month: string | null;
  target_year: number | null;
  members: {
    first_name: string;
    last_name: string;
    member_type: string;
  } | null;
}

interface MemberSummary {
  fullName: string;
  memberType: string;
  totalContributed: number;
  installments: { amount: number; date: string; targetMonth: string | null; targetYear: number | null }[];
}

const MIEZI = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Machi' },
  { value: '04', label: 'Aprili' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Julai' },
  { value: '08', label: 'Agosti' },
  { value: '09', label: 'Septemba' },
  { value: '10', label: 'Oktoba' },
  { value: '11', label: 'Novemba' },
  { value: '12', label: 'Desemba' },
];

export default function SingleProjectPage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Vichujio vya muda
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState('');

  async function loadProjectDetails() {
    if (!id) return;
    setLoading(true);

    // 1. Fetch current project details
    const { data: projData, error: projErr } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projErr) {
      console.error('Error loading project details:', projErr);
      setLoading(false);
      return;
    }
    setProject(projData);

    // 2. Fetch contributions
    const { data: contribData, error: contribErr } = await supabase
      .from('contributions')
      .select(`
        amount,
        contribution_date,
        target_month,
        target_year,
        members (first_name, last_name, member_type)
      `)
      .eq('project_id', id);

    if (!contribErr && contribData) {
      setContributions(contribData as unknown as Contribution[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProjectDetails();
  }, [id]);

  // Je, mradi huu ni wa kila mwezi?
  const isMonthlyProject = project?.type === 'monthly_recurring';

  // --- Mchujo wa Kipindi (Unafanya kazi kama mradi ni wa kila mwezi tu) ---
  const filteredContributions = contributions.filter((contrib) => {
    if (!isMonthlyProject) return true;

    // 1. Filter kwa Target Month
    if (selectedMonthFilter) {
      const targetMonth = contrib.target_month 
        ? contrib.target_month 
        : (new Date(contrib.contribution_date).getMonth() + 1).toString().padStart(2, '0');
      
      if (targetMonth !== selectedMonthFilter) return false;
    }

    // 2. Filter kwa Target Year
    if (selectedYearFilter) {
      const targetYear = contrib.target_year 
        ? contrib.target_year.toString()
        : new Date(contrib.contribution_date).getFullYear().toString();

      if (targetYear !== selectedYearFilter) return false;
    }

    return true;
  });

  // Kokotoa takwimu
  const totalCollected = filteredContributions.reduce((sum, item) => sum + item.amount, 0);
  const targetAmount = project?.target_amount || 0;
  const progressPercentage = targetAmount > 0 ? Math.min(Math.round((totalCollected / targetAmount) * 100), 100) : 0;

  // Group installments by member
  const memberSummaries: MemberSummary[] = [];

  filteredContributions.forEach((contrib) => {
    const firstName = contrib.members?.first_name || 'Mchangiaji';
    const lastName = contrib.members?.last_name || 'Anonymous';
    const type = contrib.members?.member_type || 'other';
    const name = `${firstName} ${lastName}`.trim();

    let existing = memberSummaries.find((m) => m.fullName.toLowerCase() === name.toLowerCase());

    if (!existing) {
      existing = {
        fullName: name,
        memberType: type === 'student' ? 'Mwanafunzi' : type === 'alumni' ? 'Mhitimu' : 'Mengineyo',
        totalContributed: 0,
        installments: [],
      };
      memberSummaries.push(existing);
    }

    existing.totalContributed += contrib.amount;
    existing.installments.push({
      amount: contrib.amount,
      date: contrib.contribution_date,
      targetMonth: contrib.target_month,
      targetYear: contrib.target_year,
    });
  });

  // Panga kwa michango mikubwa zaidi juu
  memberSummaries.sort((a, b) => b.totalContributed - a.totalContributed);

  // Search filter
  const filteredMembers = memberSummaries.filter((m) =>
    m.fullName.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-500 font-semibold text-sm animate-pulse">Inatafuta taarifa za mradi na michango...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-black text-zinc-950">Mradi Haupo!</h1>
        <p className="text-zinc-500 text-sm max-w-md">Mradi unaojaribu kuufungua haupatikani.</p>
        <Link href="/" className="bg-emerald-900 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-lg text-sm">
          Rudi Nyumbani
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="bg-emerald-900 text-white py-8 px-4 border-b border-emerald-800 shadow-md">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-emerald-200 hover:text-white text-xs font-bold uppercase tracking-wider">
              ← Nyumbani
            </Link>
            <span className="text-emerald-500">/</span>
            <Link href="/projects" className="text-emerald-200 hover:text-white text-xs font-bold uppercase tracking-wider">
              Miradi
            </Link>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-black tracking-tight">{project.name}</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                isMonthlyProject 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {isMonthlyProject ? '🔄 Kila Mwezi' : '🎯 Mara Moja'}
              </span>
            </div>
            <p className="text-emerald-100/80 text-sm mt-1 max-w-3xl leading-relaxed">{project.description}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        
        {/* KICHUJIO CHA MUDA: Kinaonekana TU kama mradi ni wa kila mwezi ('monthly_recurring') */}
        {isMonthlyProject && (
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider">Mchujo Mkuu wa Kipindi (Mwezi / Mwaka)</h3>
                <p className="text-xs text-zinc-400">Kubadilisha vichujio hivi kutabadilisha hesabu ya jumla ya mradi na jedwali la michango.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Month Dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase">Mwezi unaolengwa:</label>
                  <select
                    value={selectedMonthFilter}
                    onChange={(e) => setSelectedMonthFilter(e.target.value)}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:border-emerald-500 outline-none font-semibold"
                  >
                    <option value="">-- Miezi Yote --</option>
                    {MIEZI.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                {/* Year Dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase">Mwaka unaolengwa:</label>
                  <select
                    value={selectedYearFilter}
                    onChange={(e) => setSelectedYearFilter(e.target.value)}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:border-emerald-500 outline-none font-semibold"
                  >
                    <option value="">-- Miaka Yote --</option>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = (new Date().getFullYear() - 2 + i).toString();
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                </div>

                {/* Reset Button */}
                {(selectedMonthFilter || selectedYearFilter) && (
                  <button
                    onClick={() => {
                      setSelectedMonthFilter('');
                      setSelectedYearFilter('');
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-bold self-end mb-1"
                  >
                    Futa Mchujo (Reset)
                  </button>
                )}
              </div>
            </div>

            {/* Kisanduku cha taarifa ya mchujo */}
            {(selectedMonthFilter || selectedYearFilter) && (
              <div className="bg-emerald-50 text-emerald-900 text-xs p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
                <span>
                  👉 Takwimu zilizoonyeshwa chini ni za: <strong>
                    {selectedMonthFilter ? MIEZI.find(m => m.value === selectedMonthFilter)?.label : 'Miezi yote'}
                    {selectedYearFilter ? `, ${selectedYearFilter}` : ', Miaka yote'}
                  </strong>
                </span>
                <span className="text-[10px] uppercase font-bold bg-emerald-200 px-1.5 py-0.5 rounded">Mchujo Umewashwa</span>
              </div>
            )}
          </div>
        )}

        {/* Progress Metrics Panel */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-150">
          <div className="p-6 space-y-1">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Kiasi Kilichopatikana</span>
            <p className="text-3xl font-black text-emerald-800">
              {new Intl.NumberFormat('en-US').format(totalCollected)} TSH
            </p>
            <p className="text-xs text-zinc-400">
              {isMonthlyProject && (selectedMonthFilter || selectedYearFilter)
                ? 'Katika kipindi kilichochaguliwa hapo juu.' 
                : 'Jumla ya fedha zilizochangwa kwenye mradi huu.'}
            </p>
          </div>

          <div className="p-6 space-y-1">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Lengo la Mradi</span>
            <p className="text-3xl font-black text-zinc-900">
              {new Intl.NumberFormat('en-US').format(targetAmount)} TSH
            </p>
            <p className="text-xs text-zinc-400">Fedha zinazohitajika kukamilisha mradi mzima.</p>
          </div>

          <div className="p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Maendeleo ya Malengo</span>
              <span className="text-sm font-black text-emerald-800">{progressPercentage}%</span>
            </div>
            
            <div className="w-full bg-zinc-100 h-3.5 rounded-full mt-2 overflow-hidden border border-zinc-200">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">Takwimu hizi hujihuisha moja kwa moja.</p>
          </div>
        </div>

        {/* Member Installments search list */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">Wachangiaji wa Mradi ({filteredMembers.length})</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Tafuta jina kuona michango yao yote na tarehe zake.</p>
            </div>

            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="Tafuta kwa jina la mchangiaji..."
                className="w-full rounded-lg border border-zinc-300 bg-white pl-3 pr-10 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
              <span className="absolute right-3 top-2.5 text-zinc-400 text-sm">🔍</span>
            </div>
          </div>

          {/* Table list */}
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            {filteredMembers.length === 0 ? (
              <div className="py-20 text-center text-zinc-500">
                {memberSearchQuery 
                  ? 'Hakuna mchangiaji aliyepatikana kwa jina hilo.' 
                  : (selectedMonthFilter || selectedYearFilter)
                    ? 'Hakuna michango iliyofanyika katika kipindi hiki cha muda.'
                    : 'Bado hakuna mchango uliowekwa kwa mradi huu.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider text-xs">
                      <th className="p-4">Mwanachama</th>
                      <th className="p-4">Kundi</th>
                      <th className="p-4">Awamu Ulizolipa (Installments)</th>
                      <th className="p-4 text-right">Jumla ya Mchango</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150 text-zinc-800">
                    {filteredMembers.map((summary, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="p-4 font-bold text-zinc-900">{summary.fullName}</td>
                        <td className="p-4">
                          <span className="bg-zinc-100 text-zinc-700 px-2.5 py-0.5 rounded text-xs font-semibold">
                            {summary.memberType}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            {summary.installments.map((inst, index) => {
                              // Tafuta kipindi kilicholengwa kama ni mradi wa kila mwezi
                              let displayPeriod = "";
                              if (isMonthlyProject) {
                                if (inst.targetMonth && inst.targetYear) {
                                  const matchMonth = MIEZI.find(m => m.value === inst.targetMonth);
                                  displayPeriod = `📅 ${matchMonth?.label || ''} ${inst.targetYear}`;
                                } else {
                                  const dObj = new Date(inst.date);
                                  displayPeriod = `📅 ${MIEZI[dObj.getMonth()].label} ${dObj.getFullYear()}`;
                                }
                              } else {
                                // Kama si wa kila mwezi, onyesha tarehe halisi ya malipo
                                displayPeriod = new Date(inst.date).toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' });
                              }

                              return (
                                <span 
                                  key={index} 
                                  className="inline-flex flex-col bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1 text-left text-[11px] leading-tight"
                                >
                                  <span className="font-bold text-emerald-800">
                                    {new Intl.NumberFormat('en-US').format(inst.amount)} TSH
                                  </span>
                                  <span className="text-zinc-400 text-[10px] mt-0.5">
                                    {displayPeriod}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-4 text-right font-black text-emerald-700 text-base">
                          {new Intl.NumberFormat('en-US').format(summary.totalContributed)} TSH
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}