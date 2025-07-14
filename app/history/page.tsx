// app/history/page.tsx - Updated to remove redundant stats card

'use client';

import { useState, useEffect, useCallback } from 'react';
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

  // State for the two remaining cards
  const [totalBountiesClaimed, setTotalBountiesClaimed] = useState(0);
  const [totalPBs, setTotalPBs] = useState(0);
  // "totalRewards" state has been removed.

  // Simplified helper function to calculate stats
  const calculateStats = useCallback((items: HistoryItem[]) => {
    let bountyCount = 0;
    let pbCount = 0;

    const approvedItems = items.filter(item => item.status === 'approved');

    approvedItems.forEach(item => {
      if (item.submission_type === 'bounty') {
        bountyCount++;
      } else if (item.submission_type === 'personal_best') {
        pbCount++;
      }
    });

    setTotalBountiesClaimed(bountyCount);
    setTotalPBs(pbCount);
  }, []); // Dependencies are stable setters, so this is fine

  const fetchHistoryAndStats = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .neq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching history:", error);
    } else if (data) {
      setHistoryItems(data as HistoryItem[]);
      calculateStats(data as HistoryItem[]); // Calculate stats based on fetched data
    }
    setLoading(false);
  }, [calculateStats]); // Depends on the stable calculateStats function

  useEffect(() => {
    // Also fetch user session to determine if delete button should be shown
    const initializePage = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        await fetchHistoryAndStats();
    };
    initializePage();
  }, [fetchHistoryAndStats]);

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to permanently delete this submission? This action cannot be undone.")) {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', id);

      if (error) {
        alert(`Error deleting submission: ${error.message}`);
      } else {
        // Re-fetch the history to update the UI
        await fetchHistoryAndStats();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center text-white">Submission History</h1>

          {/* --- UPDATED GRID LAYOUT --- */}
          {/* Changed from md:grid-cols-3 to md:grid-cols-2 to fill the space. */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
              <h3 className="text-gray-400 text-sm font-medium">Total Bounties Claimed</h3>
              <p className="text-2xl font-bold text-white">{totalBountiesClaimed}</p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
              <h3 className="text-gray-400 text-sm font-medium">Total Personal Bests</h3>
              <p className="text-2xl font-bold text-white">{totalPBs}</p>
            </div>
            {/* "Total Rewards Paid Out" card has been removed */}
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-2 md:p-6">
            {loading ? <p className="text-center text-gray-400">Loading history...</p> : historyItems.length === 0 ? <p className="text-center text-gray-400">No submissions have been processed yet.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="p-3 text-gray-400 font-medium text-sm">Player</th>
                      <th className="p-3 text-gray-400 font-medium text-sm">Type</th>
                      <th className="p-3 text-gray-400 font-medium text-sm">Details</th>
                      <th className="p-3 text-gray-400 font-medium text-sm">Date</th>
                      <th className="p-3 text-gray-400 font-medium text-sm">Status</th>
                      <th className="p-3 text-gray-400 font-medium text-sm text-center">Proof</th>
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
                        <td className="p-3 text-center">
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
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}