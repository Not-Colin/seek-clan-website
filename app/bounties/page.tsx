// app/bounties/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link'; // <-- 1. IMPORT THE LINK COMPONENT

interface Bounty {
  id: number;
  name: string;
  tier: 'low' | 'medium' | 'high';
  image_url: string;
}

export default function BountiesPage() {
  const [activeBounties, setActiveBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBounties = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('bounties')
        .select('*')
        .eq('is_active', true)
        .order('tier', { ascending: false });

      if (error) {
        console.error('Error fetching active bounties:', error);
      } else {
        setActiveBounties(data as Bounty[]);
      }
      setLoading(false);
    };

    fetchBounties();
  }, []);

  const tierDetails = {
    high: { reward: '10M GP', color: 'border-red-500/50 bg-red-500/10' },
    medium: { reward: '5M GP', color: 'border-yellow-500/50 bg-yellow-500/10' },
    low: { reward: '2M GP', color: 'border-green-500/50 bg-green-500/10' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">Current Bounties</h1>
            <p className="text-gray-400">Click a bounty to submit your drop!</p>
          </div>

          {loading ? (
            <p className="text-center text-gray-400">Loading bounties...</p>
          ) : activeBounties.length === 0 ? (
            <p className="text-center text-gray-400">No active bounties at the moment. Check back later!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeBounties.map((bounty) => (
                // --- 2. WRAP THE CARD IN A LINK ---
                <Link
                  key={bounty.id}
                  href={`/submit?bounty=${encodeURIComponent(bounty.name)}`}
                  className="hover:scale-105 transition-transform duration-200"
                >
                  <div className={`rounded-xl border ${tierDetails[bounty.tier].color} overflow-hidden flex flex-col h-full`}>
                    <img
                      src={bounty.image_url}
                      alt={bounty.name}
                      className="w-full"
                    />
                    <div className="p-6 flex-grow flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-bold text-white">{bounty.name}</h3>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ${tierDetails[bounty.tier].color}`}>
                          {tierDetails[bounty.tier].reward}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 capitalize">{bounty.tier} Tier Bounty</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

           {/* Bounty Rules Section */}
           <div className="mt-20 pt-10 border-t border-slate-700/50">
             {/* ... your rules JSX ... */}
           </div>
        </div>
      </main>
    </div>
  );
}