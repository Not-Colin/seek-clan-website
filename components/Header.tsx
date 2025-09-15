// components/Header.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false); // State for the mobile menu

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUser();

    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_OUT' && pathname.startsWith('/admin')) {
        router.push('/');
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [pathname, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsOpen(false); // Close menu on logout
    router.push('/');
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', href: '/' },
    { id: 'bounties', label: 'Current Bounties', href: '/bounties' },
    { id: 'leaderboards', label: 'Leaderboards', href: '/leaderboards' },
    { id: 'ranks', label: 'Current Ranks', href: '/ranks' },
    { id: 'submit', label: 'Submit Achievement', href: '/submit' },
    { id: 'history', label: 'History', href: '/history' },
    { id: 'tradelog', label: 'Payout Log', href: '/tradelog' },
  ];

  return (
    <header className="bg-slate-900 border-b border-orange-500/20 sticky top-0 z-50 backdrop-blur-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Side: Logo and Desktop Nav */}
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className="text-3xl font-bold text-orange-400 hover:text-orange-300 transition-colors"
              style={{ fontFamily: 'var(--font-pacifico)' }}
              onClick={() => setIsOpen(false)} // Close menu if logo is clicked
            >
              Seek
            </Link>
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-1">
              {tabs.map((tab) => (
                <Link key={tab.id} href={tab.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    pathname === tab.href
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25'
                      : 'text-gray-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
              {user && (
                 <Link href="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    pathname === '/admin'
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25'
                      : 'text-gray-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>

          {/* Right Side: Desktop Buttons and Mobile Hamburger */}
          <div className="flex items-center space-x-4">
            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              {user ? (
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors" title="Logout">
                  <i className="ri-logout-box-r-line text-xl"></i>
                </button>
              ) : (
                <Link href="/admin" className="text-gray-400 hover:text-orange-400 transition-colors" title="Admin Login">
                  <i className="ri-user-line text-xl"></i>
                </Link>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="lg:hidden">
              <button onClick={() => setIsOpen(!isOpen)} className="text-gray-300 hover:text-white focus:outline-none" aria-label="Toggle menu">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {isOpen && (
          <nav className="lg:hidden pt-4 pb-2 space-y-1">
            {tabs.map((tab) => (
              <Link key={tab.id} href={tab.href}
                onClick={() => setIsOpen(false)} // Close menu on link click
                className={`block px-3 py-2 rounded-lg text-base font-medium ${
                  pathname === tab.href
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </Link>
            ))}
            {/* --- Mobile Auth Links --- */}
            <div className="border-t border-slate-700/50 mt-4 pt-4 space-y-2">
                {user ? (
                    <>
                    <Link href="/admin" onClick={() => setIsOpen(false)}
                        className={`block px-3 py-2 rounded-lg text-base font-medium ${ pathname === '/admin' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:text-white hover:bg-slate-800'}`}>
                        Admin Panel
                    </Link>
                    <button onClick={handleLogout} className="w-full text-left block px-3 py-2 rounded-lg text-base font-medium text-red-400 hover:text-white hover:bg-slate-800">
                        Logout
                    </button>
                    </>
                ) : (
                    <Link href="/admin" onClick={() => setIsOpen(false)}
                        className={`block px-3 py-2 rounded-lg text-base font-medium ${ pathname === '/admin' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:text-white hover:bg-slate-800'}`}>
                        Admin Login
                    </Link>
                )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}