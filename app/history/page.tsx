// app/history/page.tsx - WITH WARNING FIXES

'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface HistoryItem {
  id: number;
  created_at: string;
  player_name: string;
  submission_type: string;
  bounty_name: string | null;
  bounty_tier: 'low' | 'medium' | 'high' | null;
  personal_best_category: string | null;
  proof_image_url: string;
  status: 'approved' | 'rejected';
}

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const [totalBountiesClaimed, setTotalBountiesClaimed] = useState(0);
  const [totalPBs, setTotalPBs] = useState(0);
  const [totalRewards, setTotalRewards] = useState('0M GP');

  // Helper function to calculate stats (does not need to be in deps as setters are stable)
  const calculateStats = (items: HistoryItem[]) => {
    let bountyCount = 0, pbCount = 0, rewardValue = 0;
    const approvedItems = items.filter(item => item.status === 'approved');
    approvedItems.forEach(item => {
      if (item.submission_type === 'bounty') {
        bountyCount++;
        if (item.bounty_tier === 'low') rewardValue += 2;
        if (item.bounty_tier === 'medium') rewardValue += 5;
        if (item.bounty_tier === 'high') rewardValue += 10;
      } else if (item.submission_type === 'personal_best') {
        pbCount++;
      }
    });
    setTotalBountiesClaimed(bountyCount);
    setTotalPBs(pbCount);
    setTotalRewards(`${rewardValue}M GP`);
  };

  // Helper function to fetch history (needs calculateStats in deps if defined here)
  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .neq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching history:", error);
    } else if (data) {
      setHistoryItems(data as HistoryItem[]);
      calculateStats(data as HistoryItem[]);
    }
  };

  // initializePage and useEffect dependency fix
  const initializePage = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    await fetchHistory();
    setLoading(false);
  };

  useEffect(() => {
    initializePage();
  }, [initializePage]); // Added initializePage to dependency array

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to permanently delete this submission? This action cannot be undone.")) {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', id);

      if (error) {
        alert(`Error deleting submission: ${error.message}`);
      } else {
        await fetchHistory(); // Re-fetch the history to update the UI
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center text-white">Submission History</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"><div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50"><h3 className="text-gray-400 text-sm font-medium">Total Bounties Claimed</h3><p className="text-2xl font-bold text-white">{totalBountiesClaimed}</p></div><div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50"><h3 className="text-gray-400 text-sm font-medium">Total Personal Bests</h3><p className="text-2xl font-bold text-white">{totalPBs}</p></div><div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50"><h3 className="text-gray-400 text-sm font-medium">Total Rewards Paid Out</h3><p className="text-2xl font-bold text-green-400">{totalRewards}</p></div></div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            {loading ? <p className="text-center text-gray-400">Loading history...</p> : historyItems.length === 0 ? <p className="text-center text-gray-400">No submissions have been processed yet.</p> : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="p-3 text-gray-400 font-medium text-sm">Player</th>
                    <th className="p-3 text-gray-400 font-medium text-sm">Type</th>
                    <th className="p-3 text-gray-400 font-medium text-sm">Details</th>
                    <th className="p-3 text-gray-400 font-medium text-sm">Date</th>
                    <th className="p-3 text-gray-400 font-medium text-sm">Status</th>
                    <th className="p-3 text-gray-400 font-medium text-sm">Proof</th>
                    {user && <th className="p-3 text-gray-400 font-medium text-sm text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {historyItems.map((item) => (
                    <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-700/20">
                      <td className="p-3 text-white">{item.player_name}</td>
                      <td className="p-3 text-gray-300 capitalize">{item.submission_type.replace('_', ' ')}</td>
                      <td className="p-3 text-gray-300">{item.submission_type === 'bounty' ? item.bounty_name : item.personal_best_category}</td>
                      <td className="p-3 text-gray-400 text-sm">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{item.status}</span></td>
                      <td className="p-3">
                         {/* eslint-disable-next-line @next/next/no-img-element */}
                        <a href={item.proof_image_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm font-medium">View</a>
                      </td>
                      {user && (
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-2 py-1 rounded-md text-xs"
                            title="Delete Submission"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}