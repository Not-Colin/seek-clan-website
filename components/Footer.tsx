// components/Footer.tsx

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-12">
      <div className="max-w-7xl mx-auto py-8 px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <Link href="/" className="text-2xl font-bold text-orange-400 hover:text-orange-300 transition-colors" style={{ fontFamily: 'var(--font-pacifico)' }}>
              Seek
            </Link>
            <p className="text-sm text-gray-500 mt-1">
              Your Oldschool RuneScape Clan Hub
            </p>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link href="/" className="text-gray-400 hover:text-orange-400 transition-colors">Dashboard</Link>
            <Link href="/bounties" className="text-gray-400 hover:text-orange-400 transition-colors">Bounties</Link>
            <Link href="/ranks" className="text-gray-400 hover:text-orange-400 transition-colors">Ranks</Link>
            <Link href="/privacy-policy" className="text-gray-400 hover:text-orange-400 transition-colors">Privacy Policy</Link>
          </nav>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-gray-600">
          <p>© {currentYear} Seek Clan. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}