'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  member_type: string;
}

interface Project {
  id: string;
  name: string;
  is_active: boolean;
}

interface Contribution {
  id: string;
  amount: number;
  contribution_date: string;
  target_month: string | null;
  target_year: number | null;
  created_at: string;
  member_id: string;
  project_id?: string; // Tumeongeza hii kwa ajili ya kuhariri kirahisi
  members: {
    id: string;
    first_name: string;
    last_name: string;
    member_type: string;
  } | null;
  projects: {
    id?: string;
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

export default function AdminContributionsPage() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  
  const [activeProjectsOnly, setActiveProjectsOnly] = useState<Project[]>([]);
  const [allProjectsForFilter, setAllProjectsForFilter] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editContributionId, setEditContributionId] = useState<string | null>(null); // null inamaanisha "Mchango Mpya"
  
  const [memberId, setMemberId] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  
  const [projectId, setProjectId] = useState('');
  const [amount, setAmount] = useState('');
  const [contributionDate, setContributionDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Kipengele cha kuchagua mwezi unaolengwa na mchango (Target Period)
  const [isMonthlyProject, setIsMonthlyProject] = useState(false);
  const [targetMonth, setTargetMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [targetYear, setTargetYear] = useState(new Date().getFullYear().toString());

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Table Filters & Search
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState(''); 
  const [selectedYearFilter, setSelectedYearFilter] = useState('');   

  // Fetch data
  async function loadData() {
    setLoading(true);

    const { data: membersData } = await supabase
      .from('members')
      .select('id, first_name, last_name, phone_number, member_type')
      .order('first_name', { ascending: true });
    setMembers(membersData || []);

    const { data: activeProj } = await supabase
      .from('projects')
      .select('id, name, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });
    setActiveProjectsOnly(activeProj || []);

    const { data: allProj } = await supabase
      .from('projects')
      .select('id, name, is_active')
      .order('name', { ascending: true });
    setAllProjectsForFilter(allProj || []);

    const { data: contribsData, error } = await supabase
      .from('contributions')
      .select(`
        id,
        amount,
        contribution_date,
        target_month,
        target_year,
        created_at,
        member_id,
        project_id,
        members (id, first_name, last_name, member_type),
        projects (id, name)
      `)
      .order('contribution_date', { ascending: false });

    if (error) {
      console.error('Error fetching contributions:', error);
    } else {
      setContributions(contribsData as unknown as Contribution[] || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredMembersForSelect = members.filter((m) => {
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    const phone = m.phone_number ? m.phone_number : '';
    return (
      fullName.includes(memberSearchQuery.toLowerCase()) ||
      phone.includes(memberSearchQuery)
    );
  });

  const selectedMemberObj = members.find((m) => m.id === memberId);

  // Kufungua modal kwa ajili ya Kuhariri (Edit Mode)
  function handleOpenEditModal(contrib: Contribution) {
    setMessage(null);
    setEditContributionId(contrib.id);
    setMemberId(contrib.member_id);
    setProjectId(contrib.project_id || contrib.projects?.id || '');
    setAmount(contrib.amount.toString());
    setContributionDate(contrib.contribution_date);
    
    if (contrib.target_month && contrib.target_year) {
      setIsMonthlyProject(true);
      setTargetMonth(contrib.target_month);
      setTargetYear(contrib.target_year.toString());
    } else {
      setIsMonthlyProject(false);
    }
    
    setIsModalOpen(true);
  }

  // Kufungua modal kwa ajili ya Mchango Mpya (Add Mode)
  function handleOpenAddModal() {
    setMessage(null);
    setEditContributionId(null);
    setMemberId('');
    setMemberSearchQuery('');
    setProjectId('');
    setAmount('');
    setContributionDate(new Date().toISOString().split('T')[0]);
    setIsMonthlyProject(false);
    setIsModalOpen(true);
  }

  // Hifadhi / Hariri Mchango (Submit Handler)
  async function handleSubmitContribution(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId || !projectId || !amount) {
      setMessage({ type: 'error', text: 'Tafadhali jaza sehemu zote zenye nyota (*)' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const contributionPayload = {
      member_id: memberId,
      project_id: projectId,
      amount: parseFloat(amount),
      contribution_date: contributionDate,
      target_month: isMonthlyProject ? targetMonth : null,
      target_year: isMonthlyProject ? parseInt(targetYear) : null,
    };

    let resultError = null;

    if (editContributionId) {
      // Sasisha (Update) uliopo
      const { error } = await supabase
        .from('contributions')
        .update(contributionPayload)
        .eq('id', editContributionId);
      resultError = error;
    } else {
      // Ingiza (Insert) mpya
      const { error } = await supabase
        .from('contributions')
        .insert([contributionPayload]);
      resultError = error;
    }

    if (resultError) {
      setMessage({ type: 'error', text: 'Imeshindwa kuhifadhi: ' + resultError.message });
    } else {
      setMessage({ 
        type: 'success', 
        text: editContributionId ? 'Mchango umerekebishwa kikamilifu!' : 'Mchango umerekodiwa kikamilifu!' 
      });
      loadData();
      
      setTimeout(() => {
        setIsModalOpen(false);
        setMessage(null);
        setEditContributionId(null);
      }, 1500);
    }
    setSubmitting(false);
  }

  // Kufuta Mchango (Delete Handler)
  async function handleDeleteContribution(id: string) {
    const confirmDelete = window.confirm(
      "Je, una uhakika unataka kufuta mchango huu kabisa? Kitendo hiki hakiwezi kurudishwa!"
    );
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('contributions')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Imeshindwa kufuta mchango: " + error.message);
    } else {
      alert("Mchango umefutwa kwa mafanikio.");
      loadData();
    }
  }

  // Mchujo (Filtering)
  const filteredContributions = contributions.filter((contrib) => {
    if (selectedProjectFilter && contrib.projects?.name !== selectedProjectFilter) {
      return false;
    }
    if (tableSearchQuery && contrib.members) {
      const fullName = `${contrib.members.first_name} ${contrib.members.last_name}`.toLowerCase();
      if (!fullName.includes(tableSearchQuery.toLowerCase())) {
        return false;
      }
    } else if (tableSearchQuery && !contrib.members) {
      return false;
    }

    if (selectedMonthFilter) {
      const contribMonth = contrib.target_month 
        ? contrib.target_month 
        : (new Date(contrib.contribution_date).getMonth() + 1).toString().padStart(2, '0');
      
      if (contribMonth !== selectedMonthFilter) return false;
    }

    if (selectedYearFilter) {
      const contribYear = contrib.target_year 
        ? contrib.target_year.toString()
        : new Date(contrib.contribution_date).getFullYear().toString();

      if (contribYear !== selectedYearFilter) return false;
    }

    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-200 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Kumbukumbu za Michango</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Rekodi, hariri na ufute michango kwa usalama na uwazi katika miradi yote ya Maarima.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2.5 rounded-lg shadow-sm transition-all duration-150 shrink-0 self-start md:self-auto"
        >
          <span>➕</span> Rekodi Mchango Mpya
        </button>
      </div>

      {/* POPUP MODAL (Inatumika kurekodi MPYA au KUHARIRI iliyopo) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xl max-w-lg w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-150 bg-zinc-50">
              <h2 className="text-lg font-bold text-zinc-900">
                {editContributionId ? '✏️ Hariri Mchango' : 'Rekodi Mchango Mpya'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-650 transition-colors p-1 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitContribution} className="p-6 space-y-4">
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

              {/* Mwanachama Dropdown */}
              <div className="relative">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Mwanachama *
                </label>
                <div 
                  onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 cursor-pointer flex justify-between items-center hover:border-zinc-400"
                >
                  <span className={selectedMemberObj ? 'text-zinc-900 font-medium' : 'text-zinc-400'}>
                    {selectedMemberObj 
                      ? `${selectedMemberObj.first_name} ${selectedMemberObj.last_name} (${selectedMemberObj.phone_number || 'No Phone'})`
                      : '-- Chagua Mwanachama --'
                    }
                  </span>
                  <span className="text-zinc-400 text-xs">▼</span>
                </div>

                {isMemberDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-md shadow-lg max-h-64 overflow-y-auto flex flex-col p-2">
                    <input
                      type="text"
                      placeholder="Andika jina au tafuta..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full rounded border border-zinc-200 px-3 py-2 mb-2 text-xs focus:border-emerald-500 focus:outline-none"
                    />
                    <div className="overflow-y-auto divide-y divide-zinc-100">
                      {filteredMembersForSelect.length === 0 ? (
                        <div className="py-2.5 text-center text-xs text-zinc-400">Hakuna mwanachama aliyepatikana</div>
                      ) : (
                        filteredMembersForSelect.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => {
                              setMemberId(m.id);
                              setIsMemberDropdownOpen(false);
                            }}
                            className={`p-2.5 text-xs text-left cursor-pointer rounded hover:bg-zinc-50 transition-colors ${
                              memberId === m.id ? 'bg-emerald-50 font-bold text-emerald-800' : 'text-zinc-700'
                            }`}
                          >
                            👤 {m.first_name} {m.last_name} ({m.phone_number || 'Haina namba'})
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mradi Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Mradi wa Michango *
                </label>
                <select
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 outline-none font-medium"
                >
                  <option value="">-- Chagua Mradi --</option>
                  {/* Katika hali ya Kuhariri tunaonyesha miradi yote, hali ya kuongeza tunapewa tu ile hai */}
                  {(editContributionId ? allProjectsForFilter : activeProjectsOnly).map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} {!project.is_active && '(Umefungwa)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* TOGGLE: Kipindi Maalum */}
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-700 block">Je, ni Mchango wa Mwezi maalum?</span>
                  <span className="text-[10px] text-zinc-500">Inaruhusu kupanga mwezi mchango unapoenda kufidia (mfano late payment).</span>
                </div>
                <input
                  type="checkbox"
                  checked={isMonthlyProject}
                  onChange={(e) => setIsMonthlyProject(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 border-zinc-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Kipindi kinacholipiwa */}
              {isMonthlyProject && (
                <div className="grid grid-cols-2 gap-4 bg-emerald-50/40 p-3 rounded-lg border border-emerald-200/50 animate-in slide-in-from-top-1 duration-150">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                      Mwezi unaolipiwa
                    </label>
                    <select
                      value={targetMonth}
                      onChange={(e) => setTargetMonth(e.target.value)}
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-emerald-500 font-semibold"
                    >
                      {MIEZI.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                      Mwaka unaolipiwa
                    </label>
                    <select
                      value={targetYear}
                      onChange={(e) => setTargetYear(e.target.value)}
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-emerald-500 font-semibold"
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = (new Date().getFullYear() - 2 + i).toString();
                        return <option key={year} value={year}>{year}</option>;
                      })}
                    </select>
                  </div>
                </div>
              )}

              {/* Tarehe ya Kupokelea (Actual Receipt Date) */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Tarehe ya Kupokea Fedha *
                </label>
                <input
                  type="date"
                  required
                  value={contributionDate}
                  onChange={(e) => setContributionDate(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 outline-none font-medium"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Kiwango cha Fedha (TSH) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Mf. 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 outline-none font-bold"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-150">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs px-4 py-2 rounded-lg"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2 rounded-lg disabled:bg-zinc-400"
                >
                  {submitting ? 'Inahifadhi...' : editContributionId ? 'Hifadhi Marekebisho' : 'Hifadhi Mchango'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Jedwali na Vichungi */}
      <div className="space-y-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm space-y-3">
          
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-zinc-400 text-sm">🔍</span>
              <input
                type="text"
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                placeholder="Tafuta mchango kwa jina la mchangiaji..."
                className="w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="w-full lg:w-64">
              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 outline-none font-medium"
              >
                <option value="">-- Miradi Vyote --</option>
                {allProjectsForFilter.map((proj) => (
                  <option key={proj.id} value={proj.name}>
                    {proj.name} {!proj.is_active && '(Umefungwa)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-100">
            <span className="text-xs font-bold text-zinc-500 uppercase">Mchujo wa Kipindi:</span>
            
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

            {(selectedProjectFilter || selectedMonthFilter || selectedYearFilter || tableSearchQuery) && (
              <button
                onClick={() => {
                  setSelectedProjectFilter('');
                  setSelectedMonthFilter('');
                  setSelectedYearFilter('');
                  setTableSearchQuery('');
                }}
                className="text-xs text-red-500 hover:text-red-700 font-semibold"
              >
                Safi (Reset Filters)
              </button>
            )}

            <button 
              onClick={loadData} 
              className="ml-auto p-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-250 rounded-lg text-sm shrink-0"
              title="Refresh"
            >
              🔄 Refresh
            </button>
          </div>

        </div>

        {/* Jedwali la Michango */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-20 text-center text-zinc-500 font-semibold">Inapakia michango...</div>
          ) : filteredContributions.length === 0 ? (
            <div className="py-20 text-center text-zinc-400 text-sm">
              Hakuna michango inayooana na vigezo vyako vya sasa.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider text-xs">
                    <th className="p-4">Mwanachama</th>
                    <th className="p-4">Kundi</th>
                    <th className="p-4">Mradi</th>
                    <th className="p-4">Kiasi (TSH)</th>
                    <th className="p-4">Lengo la Kipindi / Tarehe Halisi</th>
                    <th className="p-4 text-center">Kitendo (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 text-zinc-800">
                  {filteredContributions.map((contrib) => {
                    const dateObj = new Date(contrib.contribution_date);
                    
                    let displayPeriod = "";
                    if (contrib.target_month && contrib.target_year) {
                      const matchMonth = MIEZI.find(m => m.value === contrib.target_month);
                      displayPeriod = `${matchMonth?.label || ''}, ${contrib.target_year}`;
                    } else {
                      displayPeriod = `${MIEZI[dateObj.getMonth()].label}, ${dateObj.getFullYear()}`;
                    }

                    return (
                      <tr key={contrib.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="p-4 font-bold text-zinc-900">
                          {contrib.members ? (
                            <Link 
                              href={`/admin/members/${contrib.members.id}`}
                              className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors flex items-center gap-1"
                            >
                              👤 {contrib.members.first_name} {contrib.members.last_name}
                            </Link>
                          ) : (
                            <span className="text-zinc-400 italic">Mwanachama Aliyefutwa</span>
                          )}
                        </td>
                        <td className="p-4">
                          {contrib.members && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                contrib.members.member_type === 'student'
                                  ? 'bg-blue-50 text-blue-700'
                                  : contrib.members.member_type === 'alumni'
                                  ? 'bg-purple-50 text-purple-700'
                                  : 'bg-zinc-150 text-zinc-700'
                              }`}
                            >
                              {contrib.members.member_type === 'student' ? 'Mwanafunzi' : contrib.members.member_type === 'alumni' ? 'Mhitimu' : 'Mengineyo'}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="bg-zinc-100 text-zinc-800 px-2.5 py-0.5 rounded text-xs font-semibold">
                            {contrib.projects ? contrib.projects.name : 'N/A'}
                          </span>
                        </td>
                        <td className="p-4 font-black text-emerald-800 text-base">
                          {new Intl.NumberFormat('en-US').format(contrib.amount)} TSH
                        </td>
                        <td className="p-4 text-xs whitespace-nowrap">
                          <div className="font-bold text-zinc-900 flex items-center gap-1">
                            📅 {displayPeriod}
                            {contrib.target_month && (
                              <span className="bg-amber-50 text-amber-800 text-[9px] uppercase px-1 rounded border border-amber-200">
                                Kipindi Maalum
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">
                            Imepokelewa: {dateObj.toLocaleDateString('sw-TZ', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEditModal(contrib)}
                              className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
                              title="Hariri mchango huu"
                            >
                              ✏️ Hariri
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteContribution(contrib.id)}
                              className="px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-250 rounded transition-colors"
                              title="Futa mchango huu kabisa"
                            >
                              🗑️ Futa
                            </button>
                          </div>
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