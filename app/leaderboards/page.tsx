// app/leaderboards/page.tsx - FINAL with active member filtering

'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabaseClient';

// --- PRESET LIST OF PB CATEGORIES ---
const pbCategories = [
  'All Personal Bests',
  'Challenge Mode Chambers of Xeric',
  'Chambers of Xeric',
  'Fight Caves',
  'Fortis Colosseum',
  'Inferno',
  'Theatre of Blood',
  'Theatre of Blood: Hard Mode',
  'Tombs of Amascut: Expert Mode',
  'Tombs of Amascut',
];

// --- INTERFACES ---
interface Submission {
  id: number;
  player_name: string;
  submission_type: string;
  bounty_tier: 'low' | 'medium' | 'high' | null;
  personal_best_category: string | null;
  personal_best_time: string | null;
  proof_image_url: string;
  is_archived: boolean;
  status: string;
}

interface BountyHunterStat {
  name: string;
  low: number;
  medium: number;
  high: number;
  totalBounties: number;
  totalGP: number;
}

// --- NEW INTERFACE for the clan data we'll fetch ---
interface ClanData {
  rankedPlayers: { username: string; }[];
}

export default function LeaderboardsPage() {
  const [activeTab, setActiveTab] = useState('bountyHunters');
  const [bountyHunters, setBountyHunters] = useState<BountyHunterStat[]>([]);
  const [personalBests, setPersonalBests] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPbCategory, setSelectedPbCategory] = useState(pbCategories[0]);

  // --- MODIFIED useEffect to fetch both submissions and active roster ---
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLoading(true);

      try {
        // Use Promise.all to fetch both data sources concurrently
        const [submissionsResponse, clanDataResponse] = await Promise.all([
          supabase.from('submissions').select('*').eq('status', 'approved').eq('is_archived', false),
          fetch('/api/get-cached-clan-data')
        ]);

        const { data: submissionsData, error: submissionsError } = submissionsResponse;
        if (submissionsError) throw submissionsError;

        if (!clanDataResponse.ok) throw new Error('Failed to fetch clan roster');
        const clanData: ClanData = await clanDataResponse.json();

        // --- NEW: Create a Set of active members for efficient filtering ---
        const activeClanMembers = new Set(clanData.rankedPlayers.map(p => p.username.toLowerCase()));

        if (submissionsData) {
          // --- Process Bounty Hunters with filtering ---
          const playerStats: { [key: string]: BountyHunterStat } = {};

          submissionsData
            .filter(sub => sub.submission_type === 'bounty' && activeClanMembers.has(sub.player_name.toLowerCase()))
            .forEach(sub => {
              if (!playerStats[sub.player_name]) {
                playerStats[sub.player_name] = { name: sub.player_name, low: 0, medium: 0, high: 0, totalBounties: 0, totalGP: 0 };
              }
              const stats = playerStats[sub.player_name];
              const tier = sub.bounty_tier;

              const isValidTier = (t: string | null): t is 'low' | 'medium' | 'high' => t === 'low' || t === 'medium' || t === 'high';
              if (isValidTier(tier)) {
                stats[tier]++;
              }
              stats.totalBounties++;
              stats.totalGP += tier === 'low' ? 2 : tier === 'medium' ? 5 : 10;
            });

          setBountyHunters(Object.values(playerStats).sort((a, b) => b.totalGP - a.totalGP));

          // --- Process Personal Bests with filtering ---
          const activePersonalBests = submissionsData.filter(sub =>
            sub.submission_type === 'personal_best' && activeClanMembers.has(sub.player_name.toLowerCase())
          );
          setPersonalBests(activePersonalBests);
        }

      } catch (error) {
        console.error("Error fetching leaderboards:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  // --- HELPER FUNCTION TO CONVERT TIME STRING TO SECONDS FOR SORTING (Unchanged) ---
  const timeToSeconds = (time: string | null): number => {
    if (!time) return Infinity;
    const parts = time.split(':');
    let seconds = 0;
    if (parts.length === 2) {
      seconds += parseInt(parts[0], 10) * 60;
      seconds += parseFloat(parts[1]);
    } else if (parts.length === 1) {
      seconds += parseFloat(parts[0]);
    }
    return seconds || Infinity;
  };

  // --- FILTER AND SORT THE PBs TO BE DISPLAYED (Unchanged) ---
  const filteredAndSortedPBs = personalBests
    .filter(pb => selectedPbCategory === 'All Personal Bests' || pb.personal_best_category === selectedPbCategory)
    .sort((a, b) => timeToSeconds(a.personal_best_time) - timeToSeconds(b.personal_best_time));

  // --- JSX RENDER (Unchanged) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center text-white">Leaderboards</h1>
          <div className="flex justify-center mb-6"><div className="bg-slate-800/50 p-1 rounded-lg flex space-x-1"><button onClick={() => setActiveTab('bountyHunters')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'bountyHunters' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-slate-700'}`}>Bounty Hunters</button><button onClick={() => setActiveTab('personalBests')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'personalBests' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-slate-700'}`}>Personal Bests</button></div></div>

          {loading ? (<p className="text-center text-gray-400">Loading...</p>) : (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              {activeTab === 'bountyHunters' ? (
                bountyHunters.length === 0 ? <p className="text-center text-gray-400">No approved bounties yet from active members.</p> : (<table className="w-full text-left"><thead><tr className="border-b border-slate-700"><th className="p-3 text-gray-400 font-medium text-sm">Rank</th><th className="p-3 text-gray-400 font-medium text-sm">Player</th><th className="p-3 text-gray-400 font-medium text-sm">Low</th><th className="p-3 text-gray-400 font-medium text-sm">Medium</th><th className="p-3 text-gray-400 font-medium text-sm">High</th><th className="p-3 text-gray-400 font-medium text-sm">Total GP Earned</th></tr></thead><tbody>{bountyHunters.map((player, index) => (<tr key={player.name} className="border-b border-slate-800 hover:bg-slate-700/20"><td className="p-3 text-white font-bold">#{index + 1}</td><td className="p-3 text-white">{player.name}</td><td className="p-3 text-gray-300">{player.low}</td><td className="p-3 text-gray-300">{player.medium}</td><td className="p-3 text-gray-300">{player.high}</td><td className="p-3 text-green-400 font-medium">{player.totalGP}M GP</td></tr>))}</tbody></table>)
              ) : (
                <>
                  <div className="mb-4">
                    <label htmlFor="pbFilter" className="text-sm font-medium text-gray-300 mr-2">Filter by Category:</label>
                    <select
                      id="pbFilter"
                      value={selectedPbCategory}
                      onChange={(e) => setSelectedPbCategory(e.target.value)}
                      className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                    >
                      {pbCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  {filteredAndSortedPBs.length === 0 ? <p className="text-center text-gray-400 py-4">No approved records from active members for this category.</p> : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="p-3 text-gray-400 font-medium text-sm">Rank</th>
                          <th className="p-3 text-gray-400 font-medium text-sm">Player</th>
                          <th className="p-3 text-gray-400 font-medium text-sm">Category</th>
                          <th className="p-3 text-gray-400 font-medium text-sm">Time</th>
                          <th className="p-3 text-gray-400 font-medium text-sm">Proof</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAndSortedPBs.map((pb, index) => (
                           <tr key={pb.id} className="border-b border-slate-800 hover:bg-slate-700/20">
                            <td className="p-3 text-white font-bold">#{index + 1}</td>
                            <td className="p-3 text-white">{pb.player_name}</td>
                            <td className="p-3 text-gray-300">{pb.personal_best_category}</td>
                            <td className="p-3 text-orange-400 font-bold">{pb.personal_best_time}</td>
                            <td className="p-3"><a href={pb.proof_image_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm">View Proof</a></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}