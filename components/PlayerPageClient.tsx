// components/PlayerPageClient.tsx

'use client'; // This component is interactive, so it's a client component.

import { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Image from 'next/image';
import { PlayerDetails } from '@wise-old-man/utils';

// --- Helper Functions & Components ---
const formatName = (name: string): string => name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
const getKCTier = (kc: number) => {
    if (kc >= 1500) return { tier: 7, color: 'text-red-400' };
    if (kc >= 1000) return { tier: 6, color: 'text-purple-400' };
    if (kc >= 500) return { tier: 5, color: 'text-cyan-400' };
    if (kc >= 250) return { tier: 4, color: 'text-blue-400' };
    if (kc >= 100) return { tier: 3, color: 'text-green-400' };
    if (kc >= 50) return { tier: 2, color: 'text-yellow-400' };
    if (kc > 0) return { tier: 1, color: 'text-gray-400' };
    return { tier: 0, color: 'text-gray-600' };
};
const StatCard = ({ label, value, unit = '' }: { label: string, value: number | string | undefined, unit?: string }) => (
  <div className="bg-slate-700/50 p-4 rounded-lg text-center"><p className="text-sm text-gray-400">{label}</p><p className="text-2xl font-bold text-white">{value !== undefined ? value.toLocaleString() : 'N/A'}{value !== undefined && unit && <span className="text-base font-normal ml-1">{unit}</span>}</p></div>
);
const PlaystyleDonut = ({ ehp, ehb }: { ehp: number, ehb: number }) => {
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
const TopSkillsPanel = ({ skills }: { skills: any }) => {
    const topSkills = Object.entries(skills).filter(([name]) => name !== 'overall').sort(([, a]: [string, any], [, b]: [string, any]) => (b.experience ?? 0) - (a.experience ?? 0)).slice(0, 3);
    return (<div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700"><h3 className="text-xl font-semibold text-orange-400 mb-4 border-b-2 border-orange-500/30 pb-2">Top 3 Skills</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{topSkills.map(([name, data]: [string, any]) => (<div key={name} className="bg-slate-700/50 p-4 rounded-lg text-center"><Image src={`/ranks/skills/${name}.png`} alt={name} width={32} height={32} className="mx-auto mb-2" /><p className="font-bold text-white capitalize">{formatName(name)}</p><p className="text-2xl text-yellow-400">{data.level}</p><p className="text-xs text-gray-500">{(data.experience ?? 0).toLocaleString()} XP</p></div>))}</div></div>);
};
const GlobalCompetitorPanel = ({ bosses }: { bosses: any }) => {
    const topRankedBosses = Object.entries(bosses).filter(([, data]: [string, any]) => data.rank && data.rank > 0).sort(([, a]: [string, any], [, b]: [string, any]) => a.rank - b.rank).slice(0, 3);
    if (topRankedBosses.length === 0) return null;
    return (<div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 h-full"><h3 className="text-xl font-semibold text-orange-400 mb-2">Global Competitor Rankings</h3><p className="text-xs text-gray-500 mb-4">Sorted by best global rank on Wise Old Man.</p><div className="space-y-3">{topRankedBosses.map(([name, data]: [string, any]) => (<div key={name} className="bg-slate-700/50 p-4 rounded-lg"><div className="flex justify-between items-center"><p className="font-bold text-white">{formatName(name)}</p><p className="font-semibold text-cyan-400">Ranked #{data.rank.toLocaleString()} Globally</p></div><p className="text-sm text-gray-400 mt-1">({(data.kills ?? 0).toLocaleString()} Kills)</p></div>))}</div></div>);
};
const ClueScrollTracker = ({ activities }: { activities: any }) => {
    const clueTiers = [ { name: 'Easy', key: 'clue_scrolls_easy' }, { name: 'Medium', key: 'clue_scrolls_medium' }, { name: 'Hard', key: 'clue_scrolls_hard' }, { name: 'Elite', key: 'clue_scrolls_elite' }, { name: 'Master', key: 'clue_scrolls_master' }, { name: 'All', key: 'clue_scrolls_all' }, ];
    const completedClues = clueTiers.map(tier => ({ name: tier.name, score: activities[tier.key]?.score || 0 })).filter(clue => clue.score > 0);
    if (completedClues.length === 0) return null;
    return (<div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700"><h3 className="text-xl font-semibold text-orange-400 mb-4 border-b-2 border-orange-500/30 pb-2">Clue Scroll Completions</h3><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">{completedClues.map(clue => (<div key={clue.name} className="bg-slate-700/50 p-4 rounded-lg text-center"><Image src={`/ranks/clues/${clue.name.toLowerCase()}.png`} alt={`${clue.name} Clue`} width={28} height={28} className="mx-auto mb-2"/><p className="text-sm font-bold text-white">{clue.name}</p><p className="text-lg text-yellow-400">{clue.score.toLocaleString()}</p></div>))}</div></div>);
};
const RaidTiers = ({ bosses }: { bosses: any }) => {
    const raidKeys = [ 'tombs_of_amascut_expert_mode', 'tombs_of_amascut', 'theatre_of_blood_hard_mode', 'theatre_of_blood', 'chambers_of_xeric_challenge_mode', 'chambers_of_xeric' ];
    const raidData = raidKeys.map(key => ({ key, name: formatName(key), kc: bosses[key]?.kills ?? 0, img: `/ranks/raids/${key}.png` })).filter(raid => raid.kc > 0);
    if (raidData.length === 0) return null;
    return (<div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700"><h3 className="text-xl font-semibold text-orange-400 mb-4 border-b-2 border-orange-500/30 pb-2">Raid Tiers</h3><div className="space-y-4">{raidData.map(raid => { const { tier, color } = getKCTier(raid.kc); return (<div key={raid.key} className="relative h-24 w-full rounded-lg overflow-hidden border border-slate-700 group"><Image src={raid.img} alt={raid.name} layout="fill" objectFit="cover" className="opacity-20 group-hover:opacity-30 transition-opacity duration-300"/><div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-transparent p-4 flex flex-col justify-center"><p className="text-lg font-bold text-white tracking-wide">{raid.name}</p><p className={`text-3xl font-black ${color}`} style={{ textShadow: '0 2px 5px rgba(0,0,0,0.5)' }}>Tier {tier}</p></div></div>); })}</div></div>);
};


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
            {snapshotData?.bosses && <RaidTiers bosses={snapshotData.bosses} />}
            {snapshotData?.skills && <TopSkillsPanel skills={snapshotData.skills} />}
            {snapshotData?.activities && <ClueScrollTracker activities={snapshotData.activities} />}
          </div>
        )}
      </div>
    </main>
  );
}