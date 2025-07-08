// app/leaderboards/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabaseClient';

interface Submission { id: number; player_name: string; submission_type: string; bounty_tier: 'low' | 'medium' | 'high'; personal_best_category: string; personal_best_time: string; proof_image_url: string; is_archived: boolean; }
interface BountyHunterStat { name: string; low: number; medium: number; high: number; totalBounties: number; totalGP: number; }

export default function LeaderboardsPage() {
  const [activeTab, setActiveTab] = useState('bountyHunters');
  const [bountyHunters, setBountyHunters] = useState<BountyHunterStat[]>([]);
  const [personalBests, setPersonalBests] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLoading(true);

      // --- ADD .eq('is_archived', false) TO THE QUERY ---
      const { data, error } = await supabase.from('submissions').select('*').eq('status', 'approved').eq('is_archived', false);

      if (error) {
        console.error("Error fetching leaderboards:", error);
      } else if (data) {
        // --- The rest of the processing logic is unchanged ---
        const bountySubmissions = data.filter(s => s.submission_type === 'bounty');
        const playerStats: { [key: string]: BountyHunterStat } = {};
        bountySubmissions.forEach(sub => {
          if (!playerStats[sub.player_name]) playerStats[sub.player_name] = { name: sub.player_name, low: 0, medium: 0, high: 0, totalBounties: 0, totalGP: 0 };
          const stats = playerStats[sub.player_name];
          stats[sub.bounty_tier]++;
          stats.totalBounties++;
          stats.totalGP += sub.bounty_tier === 'low' ? 2 : sub.bounty_tier === 'medium' ? 5 : 10;
        });
        setBountyHunters(Object.values(playerStats).sort((a, b) => b.totalGP - a.totalGP));

        const pbSubmissions = data.filter(s => s.submission_type === 'personal_best');
        setPersonalBests(pbSubmissions);
      }
      setLoading(false);
    };

    fetchLeaderboardData();
  }, []);

  return (
    // ...The entire return() JSX block remains unchanged...
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"><Header /><main className="px-6 py-8"><div className="max-w-7xl mx-auto"><h1 className="text-3xl font-bold mb-6 text-center text-white">Leaderboards</h1><div className="flex justify-center mb-6"><div className="bg-slate-800/50 p-1 rounded-lg flex space-x-1"><button onClick={() => setActiveTab('bountyHunters')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'bountyHunters' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-slate-700'}`}>Bounty Hunters</button><button onClick={() => setActiveTab('personalBests')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'personalBests' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-slate-700'}`}>Personal Bests</button></div></div>{loading ? (<p className="text-center text-gray-400">Loading leaderboards...</p>) : (<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">{activeTab === 'bountyHunters' ? (bountyHunters.length === 0 ? <p className="text-center text-gray-400">No approved bounties yet.</p> : (<table className="w-full text-left"><thead><tr className="border-b border-slate-700"><th className="p-3 text-gray-400 font-medium text-sm">Rank</th><th className="p-3 text-gray-400 font-medium text-sm">Player</th><th className="p-3 text-gray-400 font-medium text-sm">Low</th><th className="p-3 text-gray-400 font-medium text-sm">Medium</th><th className="p-3 text-gray-400 font-medium text-sm">High</th><th className="p-3 text-gray-400 font-medium text-sm">Total GP Earned</th></tr></thead><tbody>{bountyHunters.map((player, index) => (<tr key={player.name} className="border-b border-slate-800 hover:bg-slate-700/20"><td className="p-3 text-white font-bold">#{index + 1}</td><td className="p-3 text-white">{player.name}</td><td className="p-3 text-gray-300">{player.low}</td><td className="p-3 text-gray-300">{player.medium}</td><td className="p-3 text-gray-300">{player.high}</td><td className="p-3 text-green-400 font-medium">{player.totalGP}M GP</td></tr>))}</tbody></table>)) : (personalBests.length === 0 ? <p className="text-center text-gray-400">No approved personal bests yet.</p> : (<table className="w-full text-left"><thead><tr className="border-b border-slate-700"><th className="p-3 text-gray-400 font-medium text-sm">Player</th><th className="p-3 text-gray-400 font-medium text-sm">Category</th><th className="p-3 text-gray-400 font-medium text-sm">Time</th><th className="p-3 text-gray-400 font-medium text-sm">Proof</th></tr></thead><tbody>{personalBests.map((pb) => (<tr key={pb.id} className="border-b border-slate-800 hover:bg-slate-700/20"><td className="p-3 text-white">{pb.player_name}</td><td className="p-3 text-gray-300">{pb.personal_best_category}</td><td className="p-3 text-orange-400">{pb.personal_best_time}</td><td className="p-3"><a href={pb.proof_image_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm font-medium">View Proof</a></td></tr>))}</tbody></table>))}</div>)}</div></main></div>
  );
}