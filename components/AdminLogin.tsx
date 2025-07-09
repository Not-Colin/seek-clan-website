// components/AdminLogin.tsx

'use client';

import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Corrected import path for supabase
import Link from 'next/link'; // IMPORTANT: Make sure Link is imported

interface AdminLoginProps {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Securely sign in using Supabase Auth
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (authError) {
      setError(authError.message);
    } else {
      onLogin();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 w-full max-w-md relative">
        {/* --- NEW: "Back to Dashboard" Button/Link --- */}
        {/* This link is now part of the flow, centered, and visually distinct */}
        <Link
          href="/"
          className="block text-center mx-auto mb-8 py-2 px-4 border border-slate-700 rounded-lg text-gray-300 hover:bg-slate-700/50 transition-colors text-sm font-medium"
        >
          Back to Dashboard
        </Link>

        {/* Adjusted margin-top removed as the link above provides spacing */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Access</h1>
          <p className="text-gray-400">Login to access the admin panel</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-white font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 text-sm"
                placeholder="Enter admin email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-white font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 text-sm"
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:bg-gray-500"
            >
              {loading ? 'Logging In...' : 'Login'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Contact clan leadership for admin access
          </p>
        </div>
      </div>
    </div>
  );
}