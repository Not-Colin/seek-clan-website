// app/ranks/page.tsx - FINAL with rank images on the right & rank text retained

'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Image from 'next/image'; // Import the Next.js Image component

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

// This object maps the rank name from the backend to the image file in /public/ranks/
// Make sure your filenames in /public/ranks/ are lowercase and match the values here.
const rankImageMap: { [key: string]: string } = {
  'Clan Owner': '/ranks/owner.png',
  'Deputy Owner': '/ranks/deputy_owner.png',
  'Administrator': '/ranks/bandosian.png',
  'Alternate Account': '/ranks/minion.png',
  'Infernal': '/ranks/infernal.png',
  'Zenyte': '/ranks/zenyte.png',
  'Onyx': '/ranks/onyx.png',
  'Dragonstone': '/ranks/dragonstone.png',
  'Diamond': '/ranks/diamond.png',
  'Ruby': '/ranks/ruby.png',
  'Emerald': '/ranks/emerald.png',
  'Sapphire': '/ranks/sapphire.png',
  'Opal': '/ranks/opal.png',
  'Backpack': '/ranks/backpack.png',
};


export default function RanksPage() {
  const [rankedPlayers, setRankedPlayers] = useState<ClanMemberRanked[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRanks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/get-cached-clan-data', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch ranks');
      const data: ApiClanDataResponse = await response.json();
      setRankedPlayers(Array.isArray(data.rankedPlayers) ? data.rankedPlayers : []);
    } catch (error) {
      console.error('Error fetching ranks:', error);
      setRankedPlayers([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
          <div className="my-6">
            <input
              type="text"
              placeholder="Search by player name..."
              className="w-full sm:flex-grow bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="text-center text-gray-400">Loading ranks...</p>
          ) : filteredPlayers.length === 0 ? (
            <p className="text-center text-gray-400">No matching players found.</p>
          ) : (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlayers.map((player) => {
                  const rankImgSrc = rankImageMap[player.currentRank];

                  return (
                    <div key={player.username} className="bg-slate-700/50 p-6 rounded-lg border border-slate-600">
                      {/* --- START MODIFIED SECTION --- */}

                      {/* Display player name with rank icon on the RIGHT */}
                      <div className="flex items-center mb-2">
                        <h3 className="text-xl font-bold text-orange-400">{player.displayName}</h3>
                        {rankImgSrc && (
                          <Image
                            src={rankImgSrc}
                            alt={`${player.currentRank} Rank`}
                            width={18}
                            height={18}
                            className="ml-2" // margin-left to create space
                          />
                        )}
                      </div>

                      {/* Re-added the text-based rank line as requested */}
                      <p className="text-lg font-semibold text-white mb-4">Rank: {player.currentRank}</p>

                      {/* --- END MODIFIED SECTION --- */}

                      {/* Stats section remains unchanged */}
                      <div className="space-y-1 text-sm text-gray-300">
                          <p>Account Type: <span className="font-semibold capitalize">{player.accountType}</span></p>
                          <p>Hours to Max: <span className="font-semibold">{(player.ttm || 0).toLocaleString()}</span></p>
                          <p>EHB: <span className="font-semibold">{(player.ehb || 0).toLocaleString()}</span></p>
                          <p>EHP: <span className="font-semibold">{(player.ehp || 0).toLocaleString()}</span></p>
                          <p>Total Bounties: <span className="font-semibold">{(player.bounties?.total || 0)}</span></p>
                      </div>

                      {player.nextRankRequirements && player.nextRankRequirements.length > 0 && (
                        <div className="mt-4">
                          <p className="font-semibold text-blue-400 text-sm mb-1">Next Rank Goals:</p>
                          <ul className="list-disc list-inside text-gray-400 text-xs">
                            {player.nextRankRequirements.map((req, i) => <li key={i}>{req}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}