// app/ranks/page.tsx - Restored useCallback to fix loading issue

'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';

interface ClanMemberRanked {
  username: string;
  displayName: string;
  ehb: number;
  ehp: number;
  accountType: string;
  ttm: number;
  bounties: { low: number; medium: number; high: number; total: number; };
  currentRank: string;
  rankOrder: number;
  requirementsMet: string[];
  nextRankRequirements: string[];
}

interface ApiClanDataResponse {
  rankedPlayers: ClanMemberRanked[];
}

export default function RanksPage() {
  const [rankedPlayers, setRankedPlayers] = useState<ClanMemberRanked[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // CORRECTED: Restored useCallback to make the function reference stable
  const fetchRanks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/get-cached-clan-data');
      if (!response.ok) {
        throw new Error(`Failed to fetch ranks: ${response.statusText}`);
      }
      const data: ApiClanDataResponse = await response.json();
      setRankedPlayers(Array.isArray(data.rankedPlayers) ? data.rankedPlayers : []);
    } catch (error) {
      console.error('Error fetching ranks:', error);
      setRankedPlayers([]);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array is correct here as it has no external dependencies

  // CORRECTED: useEffect now depends on the stable fetchRanks function
  useEffect(() => {
    fetchRanks();
  }, [fetchRanks]);

  const filteredPlayers = (rankedPlayers || []).filter(player =>
    (player.displayName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Header />
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center text-white">Clan Ranks</h1>
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by player name..."
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {loading ? (
            <p className="text-center text-gray-400">Loading ranks...</p>
          ) : filteredPlayers.length === 0 ? (
            <p className="text-center text-gray-400">No matching players found or no ranks computed yet.</p>
          ) : (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlayers.map((player) => (
                  <div key={player.username} className="bg-slate-700/50 p-6 rounded-lg border border-slate-600">
                    <h3 className="text-xl font-bold text-orange-400 mb-2">{player.displayName}</h3>
                    <p className="text-lg font-semibold text-white mb-4">Rank: {player.currentRank}</p>
                    <div className="space-y-1 text-sm text-gray-300">
                      <p>Account Type: <span className="font-semibold capitalize">{player.accountType}</span></p>
                      <p>Hours to Max: <span className="font-semibold">{(player.ttm || 0).toLocaleString()}</span></p>
                      <p>EHB: <span className="font-semibold">{(player.ehb || 0).toLocaleString()}</span></p>
                      <p>EHP: <span className="font-semibold">{(player.ehp || 0).toLocaleString()}</span></p>
                      <p>Total Bounties: <span className="font-semibold">{(player.bounties?.total || 0)}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}