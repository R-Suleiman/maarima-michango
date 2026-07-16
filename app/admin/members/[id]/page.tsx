'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  member_type: 'alumni' | 'student' | 'other';
  created_at: string;
}

interface ContributionDetail {
  id: string;
  amount: number;
  contribution_date: string;
  target_month: string | null;
  target_year: number | null;
  projects: {
    id: string;
    name: string;
  } | null;
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

export default function AdminSingleMemberPage() {
  const { id } = useParams();
  const [member, setMember] = useState<Member | null>(null);
  const [contributions, setContributions] = useState<ContributionDetail[]>([]);
  
  // Vichungi
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState('');
  
  const [loading, setLoading] = useState(true);

  async function loadMemberDetails() {
    if (!id) return;
    setLoading(true);

    // 1. Fetch Member Info
    const { data: memberData, error: memberErr } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (memberErr) {
      console.error('Error loading member:', memberErr);
      setLoading(false);
      return;
    }
    setMember(memberData);

    // 2. Fetch Contributions with linked Project details
    const { data: contribData, error: contribErr } = await supabase
      .from('contributions')
      .select(`
        id,
        amount,
        contribution_date,
        target_month,
        target_year,
        projects (id, name)
      `)
      .eq('member_id', id)
      .order('contribution_date', { ascending: false });

    if (!contribErr && contribData) {
      setContributions(contribData as unknown as ContributionDetail[]);
    } else if (contribErr) {
      console.error('Error loading contributions:', contribErr);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadMemberDetails();
  }, [id]);

  // Kakula za Juu (Jumla ya michango yote ya mwanachama)
  const totalContributed = contributions.reduce((sum, item) => sum + item.amount, 0);
  const totalTransactions = contributions.length;
  
  // Orodha ya miradi ya kipekee aliyochangia kwa ajili ya kutengeneza Dropdown Filter
  const uniqueProjectsList = Array.from(
    new Map(
      contributions
        .map((c) => c.projects)
        .filter((p): p is { id: string; name: string } => !!p)
        .map((p) => [p.id, p])
    ).values()
  );

  // Chuja michango kulingana na vigezo vilivyochaguliwa
  const filteredContributions = contributions.filter((item) => {
    // 1. Kuchuja kwa mradi uliochaguliwa
    if (selectedProjectId && item.projects?.id !== selectedProjectId) {
      return false;
    }

    // 2. Kuchuja kwa mwezi uliolengwa
    if (selectedMonthFilter) {
      const targetMonth = item.target_month 
        ? item.target_month 
        : (new Date(item.contribution_date).getMonth() + 1).toString().padStart(2, '0');
      
      if (targetMonth !== selectedMonthFilter) return false;
    }

    // 3. Kuchuja kwa mwaka uliolengwa
    if (selectedYearFilter) {
      const targetYear = item.target_year 
        ? item.target_year.toString()
        : new Date(item.contribution_date).getFullYear().toString();

      if (targetYear !== selectedYearFilter) return false;
    }

    return true;
  });

  // Kokotoa jumla ya pesa ya michango iliyochujwa (k.m. kama mradi mmoja umechaguliwa)
  const filteredTotalAmount = filteredContributions.reduce((sum, item) => sum + item.amount, 0);

  // Kupata jina la mradi uliochaguliwa kwa sasa
  const selectedProjectObj = uniqueProjectsList.find(p => p.id === selectedProjectId);

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-500 font-semibold animate-pulse">
        Inatafuta wasifu na rekodi za mwanachama...
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-zinc-900">Mwanachama Hakuonekana!</h2>
        <p className="text-sm text-zinc-500">Mwanachama unayejaribu kumtafuta hayupo kwenye mfumo wetu.</p>
        <Link
          href="/admin/members"
          className="inline-block bg-zinc-950 text-white text-xs font-bold px-4 py-2 rounded-lg"
        >
          ← Rudi kwenye Orodha
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back navigation and Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-200 pb-5 gap-4">
        <div>
          <Link
            href="/admin/members"
            className="text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors flex items-center gap-1 mb-2"
          >
            ← Rudi Kwenye Orodha
          </Link>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            Wasifu wa: {member.first_name} {member.last_name}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Ukurasa huu unaonyesha muhtasari na historia nzima ya michango ya mwanachama.
          </p>
        </div>

        {/* Member Status Tag */}
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider self-start md:self-auto border ${
            member.member_type === 'student'
              ? 'bg-blue-50 text-blue-700 border-blue-100'
              : member.member_type === 'alumni'
              ? 'bg-purple-50 text-purple-700 border-purple-100'
              : 'bg-zinc-100 text-zinc-700 border-zinc-200'
          }`}
        >
          {member.member_type === 'student'
            ? '🎓 Mwanafunzi'
            : member.member_type === 'alumni'
            ? '💼 Mhitimu'
            : '👥 Mengineyo'}
        </span>
      </div>

      {/* Member Details & Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Contact details Card */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Taarifa Binafsi</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="block text-xs text-zinc-400">Namba ya Simu:</span>
              <span className="font-bold font-mono text-zinc-900">
                {member.phone_number || 'Hana Namba'}
              </span>
            </div>
            <div>
              <span className="block text-xs text-zinc-400">Alisajiliwa Tarehe:</span>
              <span className="font-bold text-zinc-900">
                {new Date(member.created_at).toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Total Contributed Card */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-semibold">Jumla Aliyochangia</span>
          <div>
            <p className="text-2xl font-black text-emerald-800">
              {new Intl.NumberFormat('en-US').format(totalContributed)} TSH
            </p>
            <p className="text-[10px] text-zinc-400">Kwenye miradi yote tanzu</p>
          </div>
        </div>

        {/* Transactions Card */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-semibold">Idadi ya Malipo</span>
          <div>
            <p className="text-2xl font-black text-zinc-900">{totalTransactions}</p>
            <p className="text-[10px] text-zinc-400">Jumla ya miamala iliyorekodiwa</p>
          </div>
        </div>

        {/* Projects Contributed to Card */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-semibold">Miradi Aliyochangia</span>
          <div>
            <p className="text-2xl font-black text-blue-900">{uniqueProjectsList.length}</p>
            <p className="text-[10px] text-zinc-400">Idadi ya miradi ya kipekee</p>
          </div>
        </div>
      </div>

      {/* Sehemu ya Historia ya Michango na Vichungi */}
      <div className="space-y-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900">Mchujo wa Michango ya Mwanachama</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Chagua vigezo kuona michango na kuhesabu jumla zake.</p>
            </div>
            
            {/* Project Filter Dropdown */}
            <div className="flex flex-col gap-1 w-full md:w-80">
              <label className="text-xs font-bold text-zinc-500 uppercase">Chuja kwa Mradi:</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-semibold"
              >
                <option value="">-- Miradi Yote Aliyochangia --</option>
                {uniqueProjectsList.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Filters UI & Reset Option */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-zinc-500 uppercase">Mchujo wa Kipindi (Target):</span>
              
              {/* Month Filter */}
              <select
                value={selectedMonthFilter}
                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:border-emerald-500 outline-none"
              >
                <option value="">-- Miezi Yote --</option>
                {MIEZI.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>

              {/* Year Filter */}
              <select
                value={selectedYearFilter}
                onChange={(e) => setSelectedYearFilter(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:border-emerald-500 outline-none"
              >
                <option value="">-- Miaka Yote --</option>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = (new Date().getFullYear() - 2 + i).toString();
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>

            {/* Reset Button */}
            {(selectedProjectId || selectedMonthFilter || selectedYearFilter) && (
              <button
                onClick={() => {
                  setSelectedProjectId('');
                  setSelectedMonthFilter('');
                  setSelectedYearFilter('');
                }}
                className="text-xs text-red-500 hover:text-red-700 font-semibold"
              >
                Safi (Reset Filters)
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Total Box (Kiasi cha mradi au vichungi vilivyochaguliwa) */}
        {(selectedProjectId || selectedMonthFilter || selectedYearFilter) && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 shadow-sm">
            <div className="text-sm">
              <span className="font-semibold text-emerald-900">Jumla kwa mchujo wa sasa: </span>
              <span className="text-zinc-650">
                {selectedProjectObj ? `[${selectedProjectObj.name}]` : "Miradi yote"}
                {selectedMonthFilter && ` - Mwezi: ${MIEZI.find(m => m.value === selectedMonthFilter)?.label}`}
                {selectedYearFilter && ` - Mwaka: ${selectedYearFilter}`}
              </span>
            </div>
            <div className="text-lg font-black text-emerald-800">
              {new Intl.NumberFormat('en-US').format(filteredTotalAmount)} TSH
            </div>
          </div>
        )}

        {/* Table of Contributions */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          {filteredContributions.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 text-sm">
              {selectedProjectId || selectedMonthFilter || selectedYearFilter
                ? 'Hakuna michango inayooana na vigezo vyako vya mchujo wa sasa.' 
                : 'Mwanachama huyu bado hajachangia mradi wowote.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider text-xs">
                    <th className="p-4">Mradi Aliochangia</th>
                    <th className="p-4">Lengo la Kipindi</th>
                    <th className="p-4">Tarehe ya Malipo Halisi</th>
                    <th className="p-4 text-right">Kiasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 text-zinc-800">
                  {filteredContributions.map((item) => {
                    const dateObj = new Date(item.contribution_date);
                    
                    // Kupata mwezi na mwaka uliolengwa
                    let displayPeriod = "";
                    if (item.target_month && item.target_year) {
                      const matchMonth = MIEZI.find(m => m.value === item.target_month);
                      displayPeriod = `${matchMonth?.label || ''}, ${item.target_year}`;
                    } else {
                      displayPeriod = `${MIEZI[dateObj.getMonth()].label}, ${dateObj.getFullYear()}`;
                    }

                    return (
                      <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="p-4 font-bold text-zinc-900">
                          {item.projects?.name || 'Mradi Usiojulikana'}
                        </td>
                        <td className="p-4 text-xs font-bold text-zinc-950">
                          <div className="flex items-center gap-1.5">
                            <span>📅 {displayPeriod}</span>
                            {item.target_month && (
                              <span className="bg-amber-50 text-amber-800 text-[9px] uppercase px-1 rounded border border-amber-200">
                                Kipindi Maalum
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-xs text-zinc-500">
                          {dateObj.toLocaleDateString('sw-TZ', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-4 text-right font-black text-emerald-800 text-base">
                          {new Intl.NumberFormat('en-US').format(item.amount)} TSH
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}