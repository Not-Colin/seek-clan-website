// components/Header.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient'; // Import Supabase client
import type { User } from '@supabase/supabase-js'; // Import User type

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null); // State to track login status

  // This effect runs once to check if a user session exists
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUser();

    // Listen for changes in auth state (e.g., login, logout) and update the UI
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Cleanup the listener when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // The onAuthStateChange listener will automatically update the user state to null
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', href: '/' },
    { id: 'bounties', label: 'Current Bounties', href: '/bounties' },
    { id: 'leaderboards', label: 'Leaderboards', href: '/leaderboards' },
    { id: 'submit', label: 'Submit Achievement', href: '/submit' },
    { id: 'history', label: 'History', href: '/history' },
  ];

  return (
    <header className="bg-slate-900 border-b border-orange-500/20 sticky top-0 z-50 backdrop-blur-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-3xl font-bold text-orange-400 hover:text-orange-300 transition-colors" style={{ fontFamily: 'var(--font-pacifico)' }}>
              Seek
            </Link>
            <nav className="hidden lg:flex space-x-1">
              {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    pathname === tab.href
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25'
                      : 'text-gray-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
              {/* If user is logged in, show the Admin tab */}
              {user && (
                 <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
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

          <div className="flex items-center space-x-4">
            {/* The Bell Icon is now removed */}

            {/* --- NEW: Conditional Login/Logout Button --- */}
            {user ? (
              // If user is logged in, show a Logout button
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <i className="ri-logout-box-r-line text-xl"></i>
              </button>
            ) : (
              // If user is not logged in, show a link to the admin page
              <Link
                href="/admin"
                className="flex items-center space-x-2 text-gray-400 hover:text-orange-400 transition-colors"
                title="Admin Login"
              >
                <i className="ri-user-line text-xl"></i>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}