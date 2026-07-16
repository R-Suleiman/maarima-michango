'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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

interface ContributionWithMember {
  id: string;
  amount: number;
  contribution_date: string;
  target_month: string | null;
  target_year: number | null;
  member_id: string;
  members: {
    id: string;
    first_name: string;
    last_name: string;
    member_type: 'alumni' | 'student' | 'other';
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

export default function AdminSingleProjectPage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [contributions, setContributions] = useState<ContributionWithMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Vichungi vya Muda vya Jedwali (Time Filters)
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState('');

  const [loading, setLoading] = useState(true);

  async function loadProjectDetails() {
    if (!id) return;
    setLoading(true);

    // 1. Fetch Project Info
    const { data: projectData, error: projectErr } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectErr) {
      console.error('Error loading project:', projectErr);
      setLoading(false);
      return;
    }
    setProject(projectData);

    // 2. Fetch Contributions pamoja na target_month na target_year
    const { data: contribData, error: contribErr } = await supabase
      .from('contributions')
      .select(`
        id,
        amount,
        contribution_date,
        target_month,
        target_year,
        member_id,
        members (
          id,
          first_name,
          last_name,
          member_type
        )
      `)
      .eq('project_id', id)
      .order('contribution_date', { ascending: false });

    if (!contribErr && contribData) {
      setContributions(contribData as unknown as ContributionWithMember[]);
    } else if (contribErr) {
      console.error('Error loading contributions:', contribErr);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProjectDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-500 font-extrabold animate-pulse">
        Inapakia taarifa na michango ya mradi huu...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-black text-zinc-900">Mradi Haupo!</h2>
        <p className="text-sm text-zinc-500 font-semibold">Mradi unaotafuta haukupatikana kwenye mfumo wetu.</p>
        <Link
          href="/admin/projects"
          className="inline-block bg-zinc-950 hover:bg-zinc-900 text-white text-xs font-black px-5 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          ← Rudi kwenye Miradi
        </Link>
      </div>
    );
  }

  // Je, mradi ni wa kila mwezi?
  const isMonthlyProject = project.type === 'monthly_recurring';

  // Chuja michango kwa jina, mwezi na mwaka husika (Vichujio vya muda vinafanya kazi kwa mradi wa kila mwezi TU)
  const filteredContributions = contributions.filter((item) => {
    // 1. Kuchuja kwa Jina la Mwanachama
    if (searchQuery && item.members) {
      const fullName = `${item.members.first_name} ${item.members.last_name}`.toLowerCase();
      if (!fullName.includes(searchQuery.toLowerCase())) {
        return false;
      }
    } else if (searchQuery && !item.members) {
      return false;
    }

    // Vichujio vya mwezi na mwaka vifanye kazi tu kama mradi ni 'monthly_recurring'
    if (isMonthlyProject) {
      // 2. Kuchuja kwa Mwezi uliolengwa
      if (selectedMonthFilter) {
        const contribMonth = item.target_month 
          ? item.target_month 
          : (new Date(item.contribution_date).getMonth() + 1).toString().padStart(2, '0');
        
        if (contribMonth !== selectedMonthFilter) return false;
      }

      // 3. Kuchuja kwa Mwaka uliolengwa
      if (selectedYearFilter) {
        const contribYear = item.target_year 
          ? item.target_year.toString()
          : new Date(item.contribution_date).getFullYear().toString();

        if (contribYear !== selectedYearFilter) return false;
      }
    }

    return true;
  });

  // Hisabati za Michango kulingana na mchujo uliopo
  const totalRaised = filteredContributions.reduce((sum, item) => sum + item.amount, 0);
  const progressPercentage = Math.min(Math.round((totalRaised / project.target_amount) * 100), 100);
  const totalContributors = new Set(filteredContributions.map((c) => c.members?.first_name + ' ' + c.members?.last_name)).size;

 // (Styled XML Spreadsheet for Excel)
 function handleDownloadExcel() {
  if (!project) {
    alert("Data ya mradi bado inapakia, tafadhali subiri kidogo!");
    return;
  }
  
  if (filteredContributions.length === 0) {
    alert("Hakuna data ya kuzalishia ripoti kwa sasa kulingana na mchujo uliopo!");
    return;
  }

  // Kama mradi ni wa kila mwezi, lazima wachague mwezi na mwaka kabla ya kutoa ripoti
  if (isMonthlyProject && (!selectedMonthFilter || !selectedYearFilter)) {
    alert("Tafadhali chagua mwezi na mwaka uliolengwa kwenye vichujio kwanza ili kuzalisha ripoti ya mwezi husika!");
    return;
  }

  // JUMULISHA MICHANGO KWA KILA MWANACHAMA (Group and Aggregate)
  const aggregatedData: { 
    [key: string]: { 
      name: string; 
      type: string; 
      totalAmount: number;
    } 
  } = {};

  filteredContributions.forEach((item) => {
    const memberId = item.members?.id || 'deleted-member';
    const firstName = item.members?.first_name || 'Aliyefutwa';
    const lastName = item.members?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const memberTypeSwahili = 
      item.members?.member_type === 'student' ? 'Mwanafunzi' :
      item.members?.member_type === 'alumni' ? 'Mhitimu' : 'Mengineyo';

    if (!aggregatedData[memberId]) {
      aggregatedData[memberId] = {
        name: fullName,
        type: memberTypeSwahili,
        totalAmount: 0,
      };
    }
    aggregatedData[memberId].totalAmount += item.amount;
  });

  const reportRows = Object.values(aggregatedData);

  const projectNameClean = project.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const mweziJina = MIEZI.find(m => m.value === selectedMonthFilter)?.label || '';
  const kipindiChaguliwa = isMonthlyProject ? `${mweziJina} - ${selectedYearFilter}` : 'Jumla ya Mradi';
  const tareheTengenezwa = `${new Date().toLocaleDateString('sw-TZ')} ${new Date().toLocaleTimeString('sw-TZ')}`;

  // Tengeneza muundo wa XML kwa ajili ya Excel wenye Rangi na Mitindo (Styles)
  let xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:html="http://www.w3.org/TR/REC-html40">
<Styles>
  <Style ss:ID="Default" ss:Name="Normal">
    <Alignment ss:Vertical="Bottom"/>
    <Borders/>
    <Font ss:FontName="Calibri" x:CharSet="1" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
    <Interior/>
    <NumberFormat/>
    <Protection/>
  </Style>
  
  <Style ss:ID="sTitle">
    <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#065F46"/>
  </Style>
  
  <Style ss:ID="sMetaLabel">
    <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#4B5563"/>
  </Style>
  <Style ss:ID="sMetaValue">
    <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#1F2937"/>
  </Style>

  <Style ss:ID="sHeader">
    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
    <Borders>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/>
    </Borders>
    <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
    <Interior ss:Color="#065F46" ss:Pattern="Solid"/>
  </Style>

  <Style ss:ID="sDataName">
    <Alignment ss:Vertical="Center"/>
    <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#111827"/>
  </Style>
  <Style ss:ID="sDataType">
    <Alignment ss:Vertical="Center"/>
    <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#4B5563"/>
  </Style>
  <Style ss:ID="sDataAmount">
    <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
    <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#047857"/>
    <NumberFormat ss:Format="#,##0"/>
  </Style>
  
  <Style ss:ID="sTotalRow">
    <Alignment ss:Vertical="Center"/>
    <Borders>
      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#065F46"/>
      <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#065F46"/>
    </Borders>
    <Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#065F46"/>
    <Interior ss:Color="#ECFDF5" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sTotalAmount">
    <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
    <Borders>
      <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#065F46"/>
      <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#065F46"/>
    </Borders>
    <Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#065F46"/>
    <Interior ss:Color="#ECFDF5" ss:Pattern="Solid"/>
    <NumberFormat ss:Format="#,##0"/>
  </Style>
</Styles>

<Worksheet ss:Name="Ripoti ya Michango">
  <Table ss:ExpandedColumnCount="3" ss:ExpandedRowCount="${reportRows.length + 11}" x:FullColumns="1" x:FullRows="1">
    <Column ss:Width="250"/>
    <Column ss:Width="150"/>
    <Column ss:Width="180"/>
    
    <Row ss:Height="25">
      <Cell ss:StyleID="sTitle"><Data ss:Type="String">RIPOTI YA MICHANGO - MADRASSA MAARIMA</Data></Cell>
    </Row>
    <Row ss:Height="5"></Row> <Row>
      <Cell ss:StyleID="sMetaLabel"><Data ss:Type="String">Mradi:</Data></Cell>
      <Cell ss:StyleID="sMetaValue" ss:MergeAcross="1"><Data ss:Type="String">${projectNameClean}</Data></Cell>
    </Row>
    <Row>
      <Cell ss:StyleID="sMetaLabel"><Data ss:Type="String">Aina:</Data></Cell>
      <Cell ss:StyleID="sMetaValue" ss:MergeAcross="1"><Data ss:Type="String">${isMonthlyProject ? 'Kila Mwezi (Monthly)' : 'Mara Moja (One-Time)'}</Data></Cell>
    </Row>
    <Row>
      <Cell ss:StyleID="sMetaLabel"><Data ss:Type="String">Kipindi:</Data></Cell>
      <Cell ss:StyleID="sMetaValue" ss:MergeAcross="1"><Data ss:Type="String">${kipindiChaguliwa}</Data></Cell>
    </Row>
    <Row>
      <Cell ss:StyleID="sMetaLabel"><Data ss:Type="String">Imetengenezwa:</Data></Cell>
      <Cell ss:StyleID="sMetaValue" ss:MergeAcross="1"><Data ss:Type="String">${tareheTengenezwa}</Data></Cell>
    </Row>
    <Row ss:Height="15"></Row> <Row ss:Height="24">
      <Cell ss:StyleID="sHeader"><Data ss:Type="String">Jina la Mwanachama</Data></Cell>
      <Cell ss:StyleID="sHeader"><Data ss:Type="String">Kundi la Mwanachama</Data></Cell>
      <Cell ss:StyleID="sHeader"><Data ss:Type="String">Kiasi Kilichochambiwa (TSH)</Data></Cell>
    </Row>
`;

  // Jaza Mistari ya Data
  reportRows.forEach((row) => {
    const cleanName = row.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    xmlContent += `
    <Row ss:Height="20">
      <Cell ss:StyleID="sDataName"><Data ss:Type="String">${cleanName}</Data></Cell>
      <Cell ss:StyleID="sDataType"><Data ss:Type="String">${row.type}</Data></Cell>
      <Cell ss:StyleID="sDataAmount"><Data ss:Type="Number">${row.totalAmount}</Data></Cell>
    </Row>`;
  });

  // Ongeza Mstari wa Jumla ya Pesa Chini (Total Row)
  xmlContent += `
    <Row ss:Height="22">
      <Cell ss:StyleID="sTotalRow"><Data ss:Type="String">JUMLA KUU</Data></Cell>
      <Cell ss:StyleID="sTotalRow"><Data ss:Type="String"></Data></Cell>
      <Cell ss:StyleID="sTotalAmount"><Data ss:Type="Number">${totalRaised}</Data></Cell>
    </Row>
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
    <Selected/>
    <ProtectObjects>False</ProtectObjects>
    <ProtectScenarios>False</ProtectScenarios>
  </WorksheetOptions>
</Worksheet>
</Workbook>`;

  // Pakua faili kama .xls ili Excel ifungue moja kwa moja ikiwa imepambwa
  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  const cleanProjectNameForFile = project.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const fileName = isMonthlyProject 
    ? `ripoti_${cleanProjectNameForFile}_${selectedMonthFilter}_${selectedYearFilter}.xls`
    : `ripoti_${cleanProjectNameForFile}_jumla.xls`;

  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

  return (
    <div className="space-y-8">
      {/* Back Button & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-200 pb-5 gap-4">
        <div>
          <Link
            href="/admin/projects"
            className="text-xs font-extrabold text-zinc-500 hover:text-zinc-800 transition-colors flex items-center gap-1 mb-2"
          >
            ← Rudi Kwenye Miradi
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
              {project.name}
            </h1>
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase border ${
              isMonthlyProject 
                ? 'bg-emerald-100 text-emerald-900 border-emerald-200' 
                : 'bg-blue-100 text-blue-900 border-blue-200'
            }`}>
              {isMonthlyProject ? '🔄 Kila Mwezi' : '🎯 Mara Moja'}
            </span>
          </div>
          <p className="text-sm font-semibold text-zinc-500 mt-1">
            {project.description || 'Hakuna maelezo ya mradi huu yaliyoandikwa.'}
          </p>
        </div>

        <div className="flex flex-row items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase border ${
              project.is_active
                ? 'bg-emerald-50 text-emerald-900 border-emerald-100'
                : 'bg-zinc-100 text-zinc-900 border-zinc-200'
            }`}
          >
            {project.is_active ? '🟢 Unatenda (Active)' : '🔴 Umefungwa (Closed)'}
          </span>
        </div>
      </div>

      {/* VICHUJIO VYA MUDA: (Vinaonekana kwa miradi yote, kitufe kikiwa upande wa kulia) */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-extrabold text-zinc-800 uppercase tracking-wider">
              {isMonthlyProject ? 'Mchujo Mkuu wa Kipindi na Ripoti' : 'Uzalishaji wa Ripoti ya Mradi'}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 font-semibold">
              {isMonthlyProject 
                ? 'Lazima uchague Mwezi na Mwaka ili kuwezesha upakuaji wa faili la ripoti la Excel.'
                : 'Pakua ripoti ya michango yote ya jumla kwa wanachama waliochangia mradi huu.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isMonthlyProject && (
              <>
                {/* Month Dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase">Mwezi uliolengwa:</label>
                  <select
                    value={selectedMonthFilter}
                    onChange={(e) => setSelectedMonthFilter(e.target.value)}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-950 focus:border-emerald-500 outline-none font-extrabold"
                  >
                    <option value="">-- Chagua Mwezi --</option>
                    {MIEZI.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                {/* Year Dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase">Mwaka uliolengwa:</label>
                  <select
                    value={selectedYearFilter}
                    onChange={(e) => setSelectedYearFilter(e.target.value)}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-950 focus:border-emerald-500 outline-none font-extrabold"
                  >
                    <option value="">-- Chagua Mwaka --</option>
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
                    className="text-xs text-red-600 hover:text-red-700 font-extrabold self-end mb-1.5"
                  >
                    Futa Mchujo (Reset)
                  </button>
                )}
              </>
            )}

            {/* EXCEL EXPORT BUTTON */}
            <button
              onClick={handleDownloadExcel}
              disabled={isMonthlyProject && (!selectedMonthFilter || !selectedYearFilter)}
              className={`inline-flex items-center gap-2 text-xs font-black px-4 py-2.5 rounded-lg transition-all shadow-sm self-end ${
                isMonthlyProject && (!selectedMonthFilter || !selectedYearFilter)
                  ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
                  : 'bg-emerald-800 hover:bg-emerald-900 text-white border border-emerald-700 active:scale-95'
              }`}
            >
              📥 Pakua Ripoti ya Excel (.CSV)
            </button>
          </div>
        </div>

        {/* Maonyo ya maelekezo au habari ya mchujo */}
        {isMonthlyProject ? (
          (!selectedMonthFilter || !selectedYearFilter) ? (
            <div className="bg-amber-50 text-amber-900 text-xs p-2.5 rounded-lg border border-amber-200 flex items-center font-bold">
              <span>⚠️ Kumbuka: Tafadhali chagua mwezi na mwaka hapo juu ili kuwezesha kitufe cha kupakua Excel.</span>
            </div>
          ) : (
            <div className="bg-emerald-50 text-emerald-900 text-xs p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between">
              <span className="font-bold">
                👉 Ripoti na takwimu hapa chini zimechujwa kwa ajili ya: <strong className="text-emerald-950">
                  {MIEZI.find(m => m.value === selectedMonthFilter)?.label}, Mwaka {selectedYearFilter}
                </strong>
              </span>
              <span className="text-[10px] uppercase font-black bg-emerald-200 px-2 py-0.5 rounded text-emerald-950">Mchujo Umewashwa</span>
            </div>
          )
        ) : null}
      </div>

      {/* Muhtasari wa Maendeleo ya Pesa (Progress Tracking) */}
      <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-zinc-400 block text-xs font-black uppercase">Kiasi Kilichopatikana</span>
            <span className="text-2xl font-black text-emerald-800">
              {new Intl.NumberFormat('en-US').format(totalRaised)} TSH
            </span>
          </div>
          <div className="text-right">
            <span className="text-zinc-400 block text-xs font-black uppercase">Lengo la Mradi</span>
            <span className="text-2xl font-black text-zinc-900">
              {new Intl.NumberFormat('en-US').format(project.target_amount)} TSH
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-zinc-100 h-3.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-500 font-extrabold">
            <span>{progressPercentage}% Imefikiwa</span>
            <span>{new Intl.NumberFormat('en-US').format(Math.max(project.target_amount - totalRaised, 0))} TSH zilizobaki</span>
          </div>
        </div>
      </div>

      {/* Kadi za Takwimu */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-black text-zinc-400 uppercase tracking-wider">Jumla ya Awamu za Malipo</span>
          <div>
            <p className="text-2xl font-black text-zinc-950">{filteredContributions.length}</p>
            <p className="text-[10px] text-zinc-400 font-bold">Idadi ya miamala kwenye kipindi hiki</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-black text-zinc-400 uppercase tracking-wider">Idadi ya Wachangiaji</span>
          <div>
            <p className="text-2xl font-black text-emerald-800">{totalContributors}</p>
            <p className="text-[10px] text-zinc-400 font-black">Wanachama wa kipekee waliochangia</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-black text-zinc-400 uppercase tracking-wider">Aina ya Mradi</span>
          <div>
            <p className="text-xl font-black text-purple-900 uppercase tracking-wide">
              {isMonthlyProject ? '🔄 KILA MWEZI' : '🎯 MARA MOJA'}
            </p>
            <p className="text-[10px] text-zinc-400 font-bold">Muda wa mzunguko wa michango</p>
          </div>
        </div>
      </div>

      {/* Sehemu ya Historia ya Michango na Vichungi vya Chini */}
      <div className="space-y-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-zinc-900">Orodha ya Michango</h3>
              <p className="text-xs text-zinc-400 font-bold">Tafuta kwa jina la mchangiaji au kuona michango yao yote.</p>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tafuta mchangiaji kwa jina..."
                className="w-full rounded-lg border border-zinc-300 bg-white pl-3 pr-10 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-semibold"
              />
              <span className="absolute right-3 top-2.5 text-zinc-400 text-sm">🔍</span>
            </div>
          </div>
        </div>

        {/* Jedwali la Michango */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          {filteredContributions.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 text-sm font-bold">
              {searchQuery || selectedMonthFilter || selectedYearFilter
                ? 'Hakuna michango inayooana na vigezo vyako vya sasa.' 
                : 'Hakuna mwanachama aliyewahi kuchangia mradi huu bado.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-black uppercase tracking-wider text-xs">
                    <th className="p-4">Mwanachama</th>
                    <th className="p-4">Kundi</th>
                    <th className="p-4">Tarehe ya Malipo Halisi</th>
                    <th className="p-4 text-right">Kiasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 text-zinc-800">
                  {filteredContributions.map((item) => {
                    const dateObj = new Date(item.contribution_date);

                    return (
                      <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="p-4 font-black text-zinc-900">
                          {item.members ? (
                            <Link 
                              href={`/admin/members/${item.members.id}`}
                              className="text-emerald-800 hover:text-emerald-950 hover:underline transition-colors flex items-center gap-1"
                            >
                              👤 {item.members.first_name} {item.members.last_name}
                            </Link>
                          ) : (
                            <span className="text-zinc-400 italic font-bold">Mwanachama Aliyefutwa</span>
                          )}
                        </td>
                        <td className="p-4">
                          {item.members && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                item.members.member_type === 'student'
                                  ? 'bg-blue-50 text-blue-700'
                                  : item.members.member_type === 'alumni'
                                  ? 'bg-purple-50 text-purple-700'
                                  : 'bg-zinc-150 text-zinc-700'
                              }`}
                            >
                              {item.members.member_type === 'student'
                                ? 'Mwanafunzi'
                                : item.members.member_type === 'alumni'
                                ? 'Mhitimu'
                                : 'Mengineyo'}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-xs text-zinc-500 font-semibold">
                          {dateObj.toLocaleDateString('sw-TZ', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-4 text-right font-black text-emerald-850 text-base">
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