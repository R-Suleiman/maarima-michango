'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

interface Project {
  id: string;
  name: string;
  target_amount: number;
  is_active: boolean;
}

interface Contribution {
  id: string;
  amount: number;
  contribution_date: string;
  members: {
    first_name: string;
    last_name: string;
  } | null;
  projects: {
    name: string;
  } | null;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [totalContributions, setTotalContributions] = useState(0);
  const [recentContributions, setRecentContributions] = useState<Contribution[]>([]);
  const [projectTotals, setProjectTotals] = useState<{ [key: string]: number }>({});

  async function loadDashboardData() {
    setLoading(true);
    try {
      // 1. Pata idadi ya Wanachama wote
      const { count: membersCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });
      setTotalMembers(membersCount || 0);

      // 2. Pata Miradi Hai pekee
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, target_amount, is_active')
        .eq('is_active', true);
      setActiveProjects(projectsData || []);

      // 3. Pata Jumla ya michango yote iliyowahi kutolewa na orodha ya michango ya hivi karibuni
      const { data: contribsData } = await supabase
        .from('contributions')
        .select(`
          id,
          amount,
          contribution_date,
          project_id,
          members (first_name, last_name),
          projects (name)
        `)
        .order('contribution_date', { ascending: false });

      if (contribsData) {
        // Kokotoa Jumla Kuu ya Michango yote
        const sum = contribsData.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        setTotalContributions(sum);

        // Orodha ya michango 5 ya mwisho kabisa (Recent Activity)
        setRecentContributions((contribsData as unknown as Contribution[]).slice(0, 5));

        // Piga hesabu ya mchango kwa kila mradi tofauti (kwa ajili ya progress bars)
        const totals: { [key: string]: number } = {};
        contribsData.forEach((c) => {
          if (c.project_id) {
            totals[c.project_id] = (totals[c.project_id] || 0) + (c.amount || 0);
          }
        });
        setProjectTotals(totals);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-500">
        Inapakia takwimu za mfumo...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Kichwa cha Ukurasa */}
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Muhtasari wa Mfumo</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Karibu kwenye jopo la usimamizi wa michango ya Maarima.
        </p>
      </div>

      {/* CARD STATS - Maboksi ya Takwimu */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Jumla ya Michango */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Jumla ya Michango</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">
              {new Intl.NumberFormat('en-US').format(totalContributions)} TSH
            </span>
          </div>
          <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-xl shadow-sm">
            💰
          </div>
        </div>

        {/* Wanachama */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Wanachama Waliosajiliwa</span>
            <span className="text-2xl font-black text-zinc-900 mt-1 block">
              {totalMembers}
            </span>
          </div>
          <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xl shadow-sm">
            👥
          </div>
        </div>

        {/* Miradi Hai */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Miradi Hai</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              {activeProjects.length}
            </span>
          </div>
          <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center text-xl shadow-sm">
            📂
          </div>
        </div>

      </div>

      {/* SEHEMU YA CHINI (Pande Mbili: Maendeleo ya Miradi vs Michango ya Karibuni) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 1. Maendeleo ya Miradi Hai (Project Progress) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
            <h2 className="text-base font-bold text-zinc-900">Maendeleo ya Miradi Hai</h2>
            <Link href="/admin/projects" className="text-xs text-emerald-600 hover:underline font-semibold">
              Kamilisha/Hariri Miradi &rarr;
            </Link>
          </div>

          {activeProjects.length === 0 ? (
            <p className="text-sm text-zinc-400 py-6 text-center">Hakuna mradi hai kwa sasa.</p>
          ) : (
            <div className="space-y-6">
              {activeProjects.map((project) => {
                const collected = projectTotals[project.id] || 0;
                const target = project.target_amount;
                // Kokotoa asilimia (Max 100%)
                const percentage = target > 0 ? Math.min(Math.round((collected / target) * 100), 100) : 0;

                return (
                  <div key={project.id} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-zinc-800">{project.name}</span>
                      <span className="font-bold text-emerald-700">{percentage}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-100 rounded-full h-3.5 overflow-hidden border border-zinc-200/50">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Zilizokusanywa: <b>{new Intl.NumberFormat('en-US').format(collected)} TSH</b></span>
                      <span>Lengo: {new Intl.NumberFormat('en-US').format(target)} TSH</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Michango ya Hivi Karibuni (Recent Contributions) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
            <h2 className="text-base font-bold text-zinc-900">Michango ya Karibuni</h2>
            <Link href="/admin/contributions" className="text-xs text-emerald-600 hover:underline font-semibold">
              Ona Yote &rarr;
            </Link>
          </div>

          {recentContributions.length === 0 ? (
            <p className="text-sm text-zinc-400 py-6 text-center">Hakuna michango iliyorekodiwa bado.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {recentContributions.map((contrib) => (
                <div key={contrib.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-bold text-zinc-950 block">
                      👤 {contrib.members ? `${contrib.members.first_name} ${contrib.members.last_name}` : 'Mwanachama Aliyefutwa'}
                    </span>
                    <span className="text-xs text-zinc-400">
                      Mradi: <b className="text-zinc-650">{contrib.projects ? contrib.projects.name : 'N/A'}</b>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-700 block">
                      +{new Intl.NumberFormat('en-US').format(contrib.amount)} TSH
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(contrib.contribution_date).toLocaleDateString('sw-TZ', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}