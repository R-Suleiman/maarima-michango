'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function AdminSidebar() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col justify-between p-6">
      <div>
        <h2 className="text-xl font-bold text-emerald-400 mb-8 border-b border-slate-800 pb-4">
          Admin Portal
        </h2>
        <nav className="flex flex-col space-y-4">
          <Link href="/admin" className="hover:text-emerald-400 transition-colors">
            📊 Admin Dashboard
          </Link>
          <Link href="/admin/members" className="hover:text-emerald-400 transition-colors">
            👥 Manage Members
          </Link>
          <Link href="/admin/projects" className="hover:text-emerald-400 transition-colors">
            📂 Manage Projects
          </Link>
          <Link href="/admin/contributions" className="hover:text-emerald-400 transition-colors">
            ✍️ Record Contribution
          </Link>
        </nav>
      </div>
      <div>
        <button 
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 py-2 rounded font-medium transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}