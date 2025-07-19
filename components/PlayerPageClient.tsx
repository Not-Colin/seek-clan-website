// components/PlayerPageClient.tsx

'use client'; // This component is interactive, so it's a client component.

import { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Image from 'next/image';
import { PlayerDetails } from '@wise-old-man/utils';

// --- Helper Functions & Components ---
const formatName = (name: string): string => name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
const getKCTier = (kc: number): { tier: number; label: string; color: string } => {
  if (kc >= 1201) return { tier: 5, label: 'Grandmaster', color: 'text-red-400' };
  if (kc >= 801) return { tier: 4, label: 'Master', color: 'text-purple-400' };
  if (kc >= 401) return { tier: 3, label: 'Veteran', color: 'text-blue-400' };
  if (kc >= 101) return { tier: 2, label: 'Experienced', color: 'text-green-400' };
  if (kc > 0) return { tier: 1, label: 'Getting Started', color: 'text-gray-400' };
  return { tier: 0, label: 'Not ranked', color: 'text-gray-500' };
};
const getCATierStyle = (tier: string): { label: string; color: string } => {
    const tierLower = tier.toLowerCase();
    switch (tierLower) {
        case 'grandmaster': return { label: 'Grandmaster', color: 'bg-red-500/20 text-red-300 border-red-500/50' };
        case 'master': return { label: 'Master', color: 'bg-purple-500/20 text-purple-300 border-purple-500/50' };
        case 'elite': return { label: 'Elite', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' };
        case 'hard': return { label: 'Hard', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' };
        case 'medium': return { label: 'Medium', color: 'bg-green-500/20 text-green-300 border-green-500/50' };
        case 'easy': return { label: 'Easy', color: 'bg-gray-500/20 text-gray-300 border-gray-500/50' };
        default: return { label: 'Unranked', color: 'bg-slate-700 text-slate-400 border-slate-600' };
    }
};
const StatCard = ({ label, value, unit = '' }: { label: string, value: number | string | undefined, unit?: string }) => (
  <div className="bg-slate-700/50 p-4 rounded-lg text-center"><p className="text-sm text-gray-400">{label}</p><p className="text-2xl font-bold text-white">{value !== undefined ? value.toLocaleString() : 'N/A'}{value !== undefined && unit && <span className="text-base font-normal ml-1">{unit}</span>}</p></div>
);
const PlaystyleVisualizer = ({ ehp, ehb }: { ehp: number, ehb: number }) => {
    const total = ehp + ehb; if (total === 0) return null; const ehpPercent = (ehp / total) * 100; const ehbPercent = (ehb / total) * 100;
    const dominantStyle = ehpPercent >= ehbPercent ? 'Skiller' : 'Bosser';
    const dominantPercent = ehpPercent >= ehbPercent ? ehpPercent : ehbPercent;
    const dominantColorClass = ehpPercent >= ehbPercent ? 'text-blue-400' : 'text-red-400';
    const conicGradient = { backgroundImage: `conic-gradient(#3b82f6 ${ehpPercent}%, #ef4444 ${ehpPercent}%)` };
    return (<div className="bg-slate-800/50 rounded-lg p-6 h-full flex flex-col justify-center"><h3 className="text-xl font-semibold text-orange-400 mb-4 text-center">Playstyle Breakdown</h3><div className="relative flex items-center justify-center w-56 h-56 mx-auto"><div style={conicGradient} className="rounded-full w-full h-full shadow-inner"></div><div className="absolute bg-slate-800 w-40 h-40 rounded-full flex flex-col items-center justify-center text-center"><p className={`text-lg font-bold ${dominantColorClass}`}>{dominantStyle}</p><p className="text-3xl font-bold text-white">{dominantPercent.toFixed(1)}%</p></div></div><div className="flex justify-between text-sm mt-4 px-4"><p className="text-blue-400"><span className="font-bold">{ehp.toLocaleString()}</span> EHP</p><p className="text-red-400"><span className="font-bold">{ehb.toLocaleString()}</span> EHB</p></div></div>);
};
const BossTierCard = ({ name, kc }: { name: string, kc: number }) => {
    const { tier, label, color } = getKCTier(kc);
    return (<div className="bg-slate-700/50 p-4 rounded-lg flex justify-between items-center"><div><p className="font-bold text-white">{formatName(name)}</p><p className="text-sm text-gray-400">{kc.toLocaleString()} Kills</p></div><div className="text-right"><p className={`font-bold ${color}`}>{label}</p><p className="text-xs text-gray-500">Mastery Tier {tier}</p></div></div>);
};
const CollectionLogTracker = ({ obtained, total }: { obtained: number, total: number }) => {
    if (total === 0) return null; const percentage = (obtained / total) * 100;
    return (<div className="bg-slate-800/50 rounded-lg p-6"><h3 className="text-xl font-semibold text-orange-400 mb-4">Completionist Tracker</h3><div className="flex justify-between items-center mb-2"><p className="text-sm text-gray-300">Collection Log Progress</p><p className="font-bold text-white">{percentage.toFixed(2)}%</p></div><div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden"><div style={{ width: `${percentage}%` }} className="bg-green-500 h-4 rounded-full transition-all duration-500"></div></div><p className="text-right text-sm mt-2 text-gray-400">{obtained.toLocaleString()} / {total.toLocaleString()} slots filled</p></div>);
};
const CombatAchievements = ({ tier, tasksCompleted }: { tier: string, tasksCompleted: number }) => {
    const { label, color } = getCATierStyle(tier);
    return (<div className="bg-slate-800/50 rounded-lg p-6"><div className="flex justify-between items-center"><h3 className="text-xl font-semibold text-orange-400">Combat Achievements</h3><span className={`px-3 py-1 text-sm font-bold rounded-full border ${color}`}>{label}</span></div><p className="text-center text-sm mt-4 text-gray-400">{tasksCompleted.toLocaleString()} tasks completed</p></div>);
};

// This component now accepts a simple `playerId` string as a prop.
export default function PlayerPageClient({ playerId }: { playerId: string }) {
  const [player, setPlayer] = useState<PlayerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const ehbRank = searchParams.get('ehbRank');

  useEffect(() => {
    if (!playerId) return;
    const fetchPlayerDetails = async () => {
      setLoading(true); setError('');
      try {
        const response = await fetch(`/api/get-player-details/${playerId}`);
        if (!response.ok) throw new Error('Player data not found. It may need to be refreshed by an admin.');
        const data: PlayerDetails = await response.json();
        setPlayer(data);
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetchPlayerDetails();
  }, [playerId]);

  const topBosses = player?.latestSnapshot?.data?.bosses ?
    Object.entries(player.latestSnapshot.data.bosses)
      .sort(([, a], [, b]) => (b.kills ?? -1) - (a.kills ?? -1))
      .slice(0, 3)
      .filter(([, data]) => (data.kills ?? 0) > 0)
    : [];

  const snapshotData = player?.latestSnapshot?.data;

  return (
    <main className="px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {loading && <p className="text-center text-gray-400">Loading player stats...</p>}
        {error && <p className="text-center text-red-400">{error}</p>}
        {player && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white">{player.displayName}</h1>
              <p className="text-lg text-gray-400 capitalize">{player.type} - Level {player.combatLevel}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard label="Total EHB" value={Math.round(player.ehb)} />
                {ehbRank && <StatCard label="Clan EHB Rank" value={`#${ehbRank}`} />}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                <div className="w-full">
                    <PlaystyleDonut ehp={Math.round(player.ehp)} ehb={Math.round(player.ehb)} />
                </div>
                <div className="w-full">
                    {snapshotData?.bosses && <GlobalCompetitorPanel bosses={snapshotData.bosses} />}
                </div>
            </div>
            {snapshotData?.skills && <TopSkillsPanel skills={snapshotData.skills} />}
            {snapshotData?.activities && <ClueScrollTracker activities={snapshotData.activities} />}
            {/* The PetShowcase component and its render call have been removed */}
            {topBosses.length > 0 && (
              <div className="bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-orange-400 mb-4">Top 3 Boss Mastery</h3>
                <div className="space-y-3">{topBosses.map(([name, data]) => (<BossTierCard key={name} name={name} kc={data.kills!} />))}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}