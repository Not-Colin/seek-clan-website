'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
// --- FIX #1: Import the 'Boss' type from the library ---
import { PlayerDetails, Boss } from '@wise-old-man/utils';

// This is the definitive order for displaying the PB leaderboards
const pbCategories = [
  'Inferno', 'Fortis Colosseum', 'Fight Caves', 'Tombs of Amascut: Expert Mode', 'Tombs of Amascut',
  'Theatre of Blood: Hard Mode', 'Theatre of Blood', 'Challenge Mode Chambers of Xeric', 'Chambers of Xeric',
];

// --- FIX #2: Explicitly type the bossOptions array ---
// This tells TypeScript that every 'key' is a valid Boss name.
const bossOptions: { key: Boss; name: string }[] = [
    { key: 'tombs_of_amascut', name: 'Tombs of Amascut' },
    { key: 'theatre_of_blood', name: 'Theatre of Blood' },
    { key: 'chambers_of_xeric', name: 'Chambers of Xeric' },
    { key: 'vorkath', name: 'Vorkath' },
    { key: 'zulrah', name: 'Zulrah' },
    { key: 'corporeal_beast', name: 'Corporeal Beast' },
    { key: 'nex', name: 'Nex' },
    { key: 'the_gauntlet', name: 'The Gauntlet' },
    { key: 'the_corrupted_gauntlet', name: 'The Corrupted Gauntlet' },
    { key: 'general_graardor', name: 'General Graardor' },
    { key: 'commander_zilyana', name: 'Commander Zilyana' },
    { key: 'kree_arra', name: 'Kree\'arra' },
    { key: 'kril_tsutsaroth', name: 'K\'ril Tsutsaroth' },
];

// --- Interface Definitions ---
interface Submission { id: number; player_name: string; submission_type: string; bounty_tier: 'low' | 'medium' | 'high' | null; personal_best_category: string | null; personal_best_time: string | null; proof_image_url: string; is_archived: boolean; status: string; }
interface BountyHunterStat { id: number; name: string; low: number; medium: number; high: number; totalBounties: number; totalGP: number; }
interface ClanData { rankedPlayers: { id: number; displayName: string; }[]; }

// --- Reusable Components (unchanged) ---
const PbCategorySection = ({ category, records }: { category: string; records: Submission[] }) => ( <div className="mb-10"> <h3 className="text-xl font-semibold text-orange-400 mb-4 border-b-2 border-orange-500/30 pb-2">{category}</h3> <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-slate-700"><th className="p-3 text-gray-400 font-medium text-sm w-16">Rank</th><th className="p-3 text-gray-400 font-medium text-sm">Player</th><th className="p-3 text-gray-400 font-medium text-sm">Time</th><th className="p-3 text-gray-400 font-medium text-sm text-center">Proof</th></tr></thead><tbody>{records.map((pb, index) => (<tr key={pb.id} className="border-b border-slate-800 hover:bg-slate-700/20"><td className="p-3 text-white font-bold text-lg">#{index + 1}</td><td className="p-3 text-white font-semibold">{pb.player_name}</td><td className="p-3 text-orange-400 font-bold text-lg">{pb.personal_best_time}</td><td className="p-3 text-center"><a href={pb.proof_image_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm font-medium">View</a></td></tr>))}</tbody></table></div></div>);
const BountyHunterCard = ({ player, rank }: { player: BountyHunterStat; rank: number }) => ( <Link href={`/players/${player.id}`} className="block transition-transform duration-200 hover:scale-[1.02] focus:scale-[1.02]"><div className={`bg-slate-800/70 p-4 rounded-xl border-l-4 border-slate-600 flex flex-col sm:flex-row items-center gap-4`}><div className="flex items-center justify-center w-20 flex-shrink-0"><span className={`text-4xl font-black text-orange-400`}>{rank}</span></div><div className="flex-grow text-center sm:text-left"><p className="text-xl font-bold text-white">{player.name}</p><p className="text-lg font-semibold text-green-400">{player.totalGP}M GP Earned</p></div><div className="flex items-center justify-center gap-6 bg-slate-900/50 p-3 rounded-lg flex-shrink-0"><div className="text-center"><p className="text-sm font-medium text-blue-400">Low</p><p className="text-xl font-bold text-white">{player.low}</p></div><div className="text-center"><p className="text-sm font-medium text-purple-400">Medium</p><p className="text-xl font-bold text-white">{player.medium}</p></div><div className="text-center"><p className="text-sm font-medium text-red-400">High</p><p className="text-xl font-bold text-white">{player.high}</p></div></div></div></Link>);
const ClanTotalKcCard = ({ boss }: { boss: { key: string; name: string; totalKc: number } }) => ( <div className="bg-slate-800/70 p-6 rounded-xl text-center border border-slate-700/50 flex flex-col justify-center"> <p className="text-lg font-bold text-white leading-tight mb-2">{boss.name}</p> <p className="text-4xl font-black text-orange-300 tracking-tighter">{boss.totalKc.toLocaleString()}</p> <p className="text-xs text-gray-500 uppercase">Total Clan Kills</p> </div>);

export default function LeaderboardsPage() {
  const [activeTab, setActiveTab] = useState('bountyHunters');
  const [bountyHunters, setBountyHunters] = useState<BountyHunterStat[]>([]);
  const [personalBests, setPersonalBests] = useState<Submission[]>([]);
  const [allPlayerDetails, setAllPlayerDetails] = useState<PlayerDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLoading(true);
      try {
        const [submissionsResponse, clanDataResponse, allDetailsResponse] = await Promise.all([
          supabase.from('submissions').select('*').eq('status', 'approved').eq('is_archived', false),
          fetch('/api/get-cached-clan-data'),
          fetch('/api/get-all-player-details')
        ]);

        const { data: submissionsData, error: submissionsError } = submissionsResponse;
        if (submissionsError) throw submissionsError;
        if (!clanDataResponse.ok) throw new Error('Failed to fetch clan roster');
        const clanData: ClanData = await clanDataResponse.json();
        const activeClanMembers = new Set(clanData.rankedPlayers.map(p => p.displayName.toLowerCase()));
        const playerNameToIdMap = new Map<string, number>();
        clanData.rankedPlayers.forEach(p => playerNameToIdMap.set(p.displayName.toLowerCase(), p.id));

        if (submissionsData) {
          const playerStats: { [key: string]: BountyHunterStat } = {};
          submissionsData.filter(sub => sub.submission_type === 'bounty' && activeClanMembers.has(sub.player_name.toLowerCase())).forEach(sub => {
            const playerNameLower = sub.player_name.toLowerCase();
            if (!playerStats[sub.player_name]) {
              const playerId = playerNameToIdMap.get(playerNameLower);
              if (playerId) playerStats[sub.player_name] = { id: playerId, name: sub.player_name, low: 0, medium: 0, high: 0, totalBounties: 0, totalGP: 0 };
            }
            const stats = playerStats[sub.player_name];
            if (stats) {
              const tier = sub.bounty_tier;
              if (tier === 'low' || tier === 'medium' || tier === 'high') {
                stats.totalBounties++;
                switch (tier) {
                  case 'low': stats.low++; stats.totalGP += 2; break;
                  case 'medium': stats.medium++; stats.totalGP += 5; break;
                  case 'high': stats.high++; stats.totalGP += 10; break;
                }
              }
            }
          });
          setBountyHunters(Object.values(playerStats).sort((a, b) => b.totalGP - a.totalGP));
          const activePersonalBests = submissionsData.filter(sub => sub.submission_type === 'personal_best' && activeClanMembers.has(sub.player_name.toLowerCase()));
          setPersonalBests(activePersonalBests);
        }

        if (!allDetailsResponse.ok) throw new Error('Failed to fetch player details');
        const allDetailsData: PlayerDetails[] = await allDetailsResponse.json();
        setAllPlayerDetails(allDetailsData);

      } catch (error) { console.error("Error fetching leaderboards:", error);
      } finally { setLoading(false); }
    };
    fetchLeaderboardData();
  }, []);

  const timeToSeconds = (time: string | null): number => {
    if (!time) return Infinity; const parts = time.split(':'); let seconds = 0;
    if (parts.length === 3) { seconds += parseInt(parts[0], 10) * 3600; seconds += parseInt(parts[1], 10) * 60; seconds += parseFloat(parts[2]); }
    else if (parts.length === 2) { seconds += parseInt(parts[0], 10) * 60; seconds += parseFloat(parts[1]); }
    else if (parts.length === 1) { seconds += parseFloat(parts[0]); }
    return seconds || Infinity;
  };

  const groupedAndSortedPBs = useMemo(() => {
    const grouped: { [category: string]: Submission[] } = {};
    personalBests.forEach(pb => { if (pb.personal_best_category) { if (!grouped[pb.personal_best_category]) { grouped[pb.personal_best_category] = []; } grouped[pb.personal_best_category].push(pb); } });
    for (const category in grouped) { grouped[category].sort((a, b) => timeToSeconds(a.personal_best_time) - timeToSeconds(b.personal_best_time)); }
    return grouped;
  }, [personalBests]);

  const clanBossTotals = useMemo(() => {
    if (allPlayerDetails.length === 0) return [];
    return bossOptions.map(boss => {
      const totalKc = allPlayerDetails.reduce((total, player) => {
        // This line now type-checks correctly because TypeScript knows boss.key is a valid Boss
        const kc = player.latestSnapshot?.data.bosses[boss.key]?.kills ?? 0;
        return total + (kc > 0 ? kc : 0);
      }, 0);
      return { key: boss.key, name: boss.name, totalKc };
    }).filter(boss => boss.totalKc > 0);
  }, [allPlayerDetails]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center text-white">Leaderboards</h1>
          <div className="flex justify-center mb-6">
            <div className="bg-slate-800/50 p-1 rounded-lg flex space-x-1">
              <button onClick={() => setActiveTab('bountyHunters')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'bountyHunters' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-slate-700'}`}>Bounty Hunters</button>
              <button onClick={() => setActiveTab('personalBests')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'personalBests' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-slate-700'}`}>Personal Bests</button>
              <button onClick={() => setActiveTab('killCounts')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'killCounts' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-slate-700'}`}>Clan Totals</button>
            </div>
          </div>

          {loading ? (<p className="text-center text-gray-400">Loading...</p>) : (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              {activeTab === 'bountyHunters' ? (
                bountyHunters.length === 0 ? <p className="text-center text-gray-400">No approved bounties yet from active members.</p> : (<div className="space-y-4">{bountyHunters.map((player, index) => (<BountyHunterCard key={player.name} player={player} rank={index + 1} />))}</div>)
              ) : activeTab === 'personalBests' ? (
                <div>{pbCategories.map(category => { const records = groupedAndSortedPBs[category]; if (!records || records.length === 0) return null; return <PbCategorySection key={category} category={category} records={records} />; })} {Object.keys(groupedAndSortedPBs).length === 0 && (<p className="text-center text-gray-400 py-4">No approved personal best records from active members.</p>)}</div>
              ) : ( // Clan Totals Tab Content
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-6 text-center">Total Clan Kill Counts</h3>
                  {clanBossTotals.length === 0 ? (
                    <p className="text-center text-gray-400 py-4">No boss kill logs found for any clan members.</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {clanBossTotals.map((boss) => (
                        <ClanTotalKcCard key={boss.key} boss={boss} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}