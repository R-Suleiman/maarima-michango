import './globals.css';
import PublicNavbar from '@/components/PublicNavbar';

export const metadata = {
  title: 'Maarima Michango',
  description: 'Madrassa Maarima Record Management System',
  icons: {
    icon: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}