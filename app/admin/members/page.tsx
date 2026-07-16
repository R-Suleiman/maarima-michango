// app/admin/members/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  member_type: 'alumni' | 'student' | 'other';
  created_at: string;
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [memberType, setMemberType] = useState<'alumni' | 'student' | 'other'>('student');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch Members
  async function fetchMembers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching members:', error);
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  // Add Member
  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      setMessage({ type: 'error', text: 'Tafadhali jaza majina yote mawili!' });
      return;
    }

    if (memberType !== 'student' && !phoneNumber.trim()) {
      setMessage({ type: 'error', text: 'Namba ya simu ni lazima kwa Wahitimu na Wengineo!' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const finalPhone = phoneNumber.trim() === '' ? null : phoneNumber.trim();

    const { error } = await supabase.from('members').insert([
      {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: finalPhone,
        member_type: memberType,
      },
    ]);

    if (error) {
      setMessage({ type: 'error', text: 'Imeshindwa kusajili mwanachama: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Mwanachama amesajiliwa kikamilifu!' });
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      fetchMembers();
      // Close modal after brief delay to show success message
      setTimeout(() => {
        setIsModalOpen(false);
        setMessage(null);
      }, 1500);
    }
    setSubmitting(false);
  }

  // Filter members list based on search query
  const filteredMembers = members.filter((member) => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           (member.phone_number && member.phone_number.includes(searchQuery));
  });

  function handleDownloadMembersExcel() {
    if (members.length === 0) {
      alert("Hakuna data ya wanachama ya kupakua!");
      return;
    }

    // Header kwa ajili ya Excel
    let xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="sTitle"><Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#065F46"/></Style>
    <Style ss:ID="sHeader">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#065F46" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="sData"><Font ss:FontName="Calibri" ss:Size="11"/></Style>
  </Styles>
  <Worksheet ss:Name="Wanachama">
    <Table>
      <Column ss:Width="200"/><Column ss:Width="150"/><Column ss:Width="120"/><Column ss:Width="150"/>
      <Row ss:Height="25"><Cell ss:StyleID="sTitle"><Data ss:Type="String">ORODHA YA WANACHAMA WA MAARIMA</Data></Cell></Row>
      <Row ss:Height="20">
        <Cell ss:StyleID="sHeader"><Data ss:Type="String">Jina Kamili</Data></Cell>
        <Cell ss:StyleID="sHeader"><Data ss:Type="String">Namba ya Simu</Data></Cell>
        <Cell ss:StyleID="sHeader"><Data ss:Type="String">Kundi</Data></Cell>
        <Cell ss:StyleID="sHeader"><Data ss:Type="String">Tarehe ya Usajili</Data></Cell>
      </Row>`;

    members.forEach((m) => {
      const typeLabel = m.member_type === 'student' ? 'Mwanafunzi' : m.member_type === 'alumni' ? 'Mhitimu' : 'Mengineyo';
      xmlContent += `
      <Row>
        <Cell ss:StyleID="sData"><Data ss:Type="String">${m.first_name} ${m.last_name}</Data></Cell>
        <Cell ss:StyleID="sData"><Data ss:Type="String">${m.phone_number || '-'}</Data></Cell>
        <Cell ss:StyleID="sData"><Data ss:Type="String">${typeLabel}</Data></Cell>
        <Cell ss:StyleID="sData"><Data ss:Type="String">${new Date(m.created_at).toLocaleDateString()}</Data></Cell>
      </Row>`;
    });

    xmlContent += `</Table></Worksheet></Workbook>`;

    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Orodha_ya_Wanachama_Maarima.xls";
    link.click();
  }

  return (
    <div className="space-y-6">
      {/* Header with action button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-200 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Wanachama</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Sajili na usimamie taarifa za wanachama, wahitimu, na wanafunzi wa Maarima.
          </p>
        </div>
        <button
            onClick={handleDownloadMembersExcel}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-lg border border-emerald-200 transition-all"
          >
            📥 Pakua Orodha (Excel)
          </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-sm self-start md:self-auto"
        >
          ➕ Sajili Mwanachama Mpya
        </button>
      </div>

      {/* Search and Quick Reload */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tafuta mwanachama kwa jina au namba ya simu..."
            className="w-full rounded-lg border border-zinc-300 bg-white pl-3 pr-10 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
          />
          <span className="absolute right-3 top-2.5 text-zinc-400 text-sm">🔍</span>
        </div>
        <button
          onClick={fetchMembers}
          className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 border border-zinc-200 bg-white px-3 py-2.5 rounded-lg shadow-sm"
        >
          🔄 Booresha Orodha
        </button>
      </div>

      {/* Members List Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-zinc-500">Inapakia wanachama...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">
            {searchQuery ? 'Hakuna mwanachama aliyepatikana kwa utafutaji huo.' : 'Hakuna wanachama waliosajiliwa bado.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold uppercase tracking-wider text-xs">
                  <th className="p-4">Jina Kamili</th>
                  <th className="p-4">Namba ya Simu</th>
                  <th className="p-4">Kundi (Type)</th>
                  <th className="p-4">Tarehe ya Usajili</th>
                  <th className="p-4 text-right">Kitendo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 text-zinc-800">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="p-4 font-bold text-zinc-950">
                      {member.first_name} {member.last_name}
                    </td>
                    <td className="p-4 font-mono text-zinc-650">
                      {member.phone_number ? member.phone_number : <span className="text-zinc-400 italic text-xs">Hana Namba</span>}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                          member.member_type === 'student'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : member.member_type === 'alumni'
                            ? 'bg-purple-50 text-purple-700 border border-purple-100'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        {member.member_type === 'student'
                          ? 'Mwanafunzi'
                          : member.member_type === 'alumni'
                          ? 'Mhitimu'
                          : 'Mengineyo'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-zinc-500">
                      {new Date(member.created_at).toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/members/${member.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-all"
                      >
                        👤 Angalia Wasifu
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* POPUP REGISTRATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-zinc-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <h2 className="text-lg font-extrabold text-zinc-900">Sajili Mwanachama Mpya</h2>
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
            <form onSubmit={handleAddMember} className="p-5 space-y-4">
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

              {/* Aina ya Mwanachama Selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Aina ya Mwanachama *
                </label>
                <select
                  value={memberType}
                  onChange={(e) => setMemberType(e.target.value as any)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="student">Mwanafunzi (Student)</option>
                  <option value="alumni">Mhitimu (Alumni)</option>
                  <option value="other">Mengineyo (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Jina la Kwanza *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Mf. Juma"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Jina la Mwisho *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Mf. Ali"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Namba ya Simu {memberType === 'student' ? '(Si Lazima)' : '*'}
                </label>
                <input
                  type="text"
                  required={memberType !== 'student'}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={memberType === 'student' ? "Mwanafunzi hana namba ya simu" : "Mf. 0712345678"}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-zinc-400"
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