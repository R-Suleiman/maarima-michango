// app/search/page.tsx
'use client';
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import PublicNavbar from '@/components/PublicNavbar';

interface Contribution {
  id: string;
  amount: number;
  contribution_date: string;
  transaction_reference: string;
  projects: {
    name: string;
  } | null;
  members: {
    full_name: string;
  } | null;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      // Fetch contributions joining projects and members where full_name matches
      const { data, error } = await supabase
        .from('contributions')
        .select(`
          id,
          amount,
          contribution_date,
          transaction_reference,
          projects ( name ),
          members ( full_name )
        `)
        .ilike('members.full_name', `%${query}%`);

      if (error) throw error;

      const filteredResults = (data || []).filter(
        (item: any) => item.members !== null
      ) as unknown as Contribution[];

      setResults(filteredResults);
    } catch (err) {
      console.error('Hitilafu ya utafutaji:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <PublicNavbar />

      <main className="flex-1 mx-auto max-w-4xl px-4 py-12 w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-black">🔍 Tafuta Rekodi Zako</h1>
          <p className="mt-2 text-zinc-600">
            Ingiza jina lako hapa chini ili kuona orodha na historia ya michango yako yote.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto mb-10">
          <input
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Andika jina lako kamili..."
            className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-zinc-950 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-md transition-colors"
          >
            {loading ? 'Inatafuta...' : 'Tafuta'}
          </button>
        </form>

        {/* Search Results */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : searched && results.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-zinc-200 p-6">
            <p className="text-zinc-500">Hakuna michango iliyopatikana kwa jina hilo. Tafadhali hakikisha umeandika jina lako kwa usahihi au wasiliana na mshika hazina wetu.</p>
          </div>
        ) : searched ? (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50">
              <h2 className="font-bold text-black text-lg">
                Matokeo ya Utafutaji wa Michango
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Mwanachama</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Mradi</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Kiasi</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Kumbukumbu ya MNO</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Tarehe</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-zinc-150">
                  {results.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-black">
                        {item.members?.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                        {item.projects?.name || 'Mradi usiojulikana'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-950 font-bold">
                        {item.amount.toLocaleString()} TZS
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 font-mono">
                        {item.transaction_reference || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                        {new Date(item.contribution_date).toLocaleDateString('sw-TZ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}