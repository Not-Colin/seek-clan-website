// app/tradelog/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabaseClient';

interface LoggedTrade {
  id: number;
  created_at: string;
  player_name: string;
  bounty_name: string | null;
  bounty_tier: 'low' | 'medium' | 'high' | null;
  proof_image_url: string; // The original proof
  trade_proof_url: string; // The trade proof
}

export default function TradeLogPage() {
  const [loggedTrades, setLoggedTrades] = useState<LoggedTrade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLoggedTrades = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('status', 'approved')
      .eq('submission_type', 'bounty')
      .not('trade_proof_url', 'is', null) // Only fetch submissions that have a trade proof
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching logged trades:", error);
    } else {
      setLoggedTrades(data as LoggedTrade[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLoggedTrades();
  }, [fetchLoggedTrades]);

  const getRewardValue = (tier: string | null) => {
    if (tier === 'low') return '2M GP';
    if (tier === 'medium') return '5M GP';
    if (tier === 'high') return '10M GP';
    return 'N/A';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center text-white">Bounty Payout Log</h1>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-2 md:p-6">
            {loading ? <p className="text-center text-gray-400">Loading trade log...</p> : loggedTrades.length === 0 ? <p className="text-center text-gray-400">No bounties have been paid out yet.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="p-3 text-gray-400 font-medium text-sm">Player</th>
                      <th className="p-3 text-gray-400 font-medium text-sm">Bounty</th>
                      <th className="p-3 text-gray-400 font-medium text-sm">Reward</th>
                      <th className="p-3 text-gray-400 font-medium text-sm">Date Claimed</th>
                      <th className="p-3 text-gray-400 font-medium text-sm text-center">Proof</th>
                      <th className="p-3 text-gray-400 font-medium text-sm text-center">Trade Proof</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loggedTrades.map((trade) => (
                      <tr key={trade.id} className="border-b border-slate-800 hover:bg-slate-700/20">
                        <td className="p-3 text-white">{trade.player_name}</td>
                        <td className="p-3 text-gray-300">{trade.bounty_name}</td>
                        <td className="p-3 text-green-400 font-semibold">{getRewardValue(trade.bounty_tier)}</td>
                        <td className="p-3 text-gray-400 text-sm">{new Date(trade.created_at).toLocaleDateString()}</td>
                        <td className="p-3 text-center">
                          <a href={trade.proof_image_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm font-medium">View Claim</a>
                        </td>
                        <td className="p-3 text-center">
                          <a href={trade.trade_proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm font-medium">View Trade</a>
                        </td>
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