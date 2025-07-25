// app/players/[id]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { PlayerDetails} from '@wise-old-man/utils';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';

// --- Interfaces ---
interface Submission { id: number; created_at: string; personal_best_category: string | null; personal_best_time: string | null; proof_image_url: string; }
const pbCategories = [ 'All Personal Bests', 'Challenge Mode Chambers of Xeric', 'Chambers of Xeric', 'Fight Caves', 'Fortis Colosseum', 'Inferno', 'Theatre of Blood', 'Theatre of Blood: Hard Mode', 'Tombs of Amascut: Expert Mode', 'Tombs of Amascut' ];

// --- THIS IS THE FIX ---
// The rankImageMap constant was missing from this file. It has been added back.
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

// --- Helper Functions & Components ---
const formatName = (name: string) => name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
const StatCard = ({ label, value }: { label: string, value: number | string | undefined }) => (
  <div className="bg-slate-700/50 p-4 rounded-lg text-center border border-slate-700 shadow-lg">
    <p className="text-sm text-gray-400">{label}</p>
    <p className="text-2xl font-bold text-white tracking-wider">{value !== undefined ? value.toLocaleString() : 'N/A'}</p>
  </div>
);
const PlaystyleDonut = ({ ehp, ehb }: { ehp: number, ehb: number }) => {
    const total = ehp + ehb; if (total === 0) return null; const ehpPercent = (ehp / total) * 100; const ehbPercent = (ehb / total) * 100;
    const dominantStyle = ehpPercent >= ehbPercent ? 'Skiller' : 'Bosser';
    const dominantPercent = ehpPercent >= ehbPercent ? ehpPercent : ehbPercent;
    const dominantColorClass = ehpPercent >= ehbPercent ? 'text-blue-400' : 'text-red-400';
    const conicGradient = { backgroundImage: `conic-gradient(#3b82f6 ${ehpPercent}%, #ef4444 ${ehpPercent}%)` };
    return (<div className="bg-slate-800/50 rounded-lg p-6 h-full flex flex-col justify-center border border-slate-700"><h3 className="text-xl font-semibold text-orange-400 mb-4 text-center">Playstyle Breakdown</h3><div className="relative flex items-center justify-center w-56 h-56 mx-auto"><div style={conicGradient} className="rounded-full w-full h-full shadow-inner"></div><div className="absolute bg-slate-800 w-40 h-40 rounded-full flex flex-col items-center justify-center text-center"><p className={`text-lg font-bold ${dominantColorClass}`}>{dominantStyle}</p><p className="text-3xl font-bold text-white">{dominantPercent.toFixed(1)}%</p></div></div><div className="flex justify-between text-sm mt-4 px-4"><p className="text-blue-400"><span className="font-bold">{ehp.toLocaleString()}</span> EHP</p><p className="text-red-400"><span className="font-bold">{ehb.toLocaleString()}</span> EHB</p></div></div>);
};
const RaidTiers = ({ bosses }: { bosses: any }) => {
    const raidKeys = [ 'tombs_of_amascut_expert_mode', 'tombs_of_amascut', 'theatre_of_blood_hard_mode', 'theatre_of_blood', 'chambers_of_xeric_challenge_mode', 'chambers_of_xeric' ];
    const raidData = raidKeys.map(key => ({ key, name: formatName(key), kc: bosses[key]?.kills ?? 0, img: `/ranks/raids/${key}.png` })).filter(raid => raid.kc > 0);
    if (raidData.length === 0) return null;
    return (<div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700"><h3 className="text-xl font-semibold text-orange-400 mb-4 border-b-2 border-orange-500/30 pb-2">Raid Tiers</h3><div className="space-y-4">{raidData.map(raid => { const { tier, color } = getKCTier(raid.kc); return (<div key={raid.key} className="relative h-24 w-full rounded-lg overflow-hidden border border-slate-700 group"><Image src={raid.img} alt={raid.name} layout="fill" objectFit="cover" className="opacity-20 group-hover:opacity-30 transition-opacity duration-300"/><div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-transparent p-4 flex flex-col justify-center"><p className="text-lg font-bold text-white tracking-wide">{raid.name}</p><p className={`text-3xl font-black ${color}`} style={{ textShadow: '0 2px 5px rgba(0,0,0,0.5)' }}>Tier {tier}</p></div></div>); })}</div></div>);
};
const PersonalBestsSection = ({ submissions }: { submissions: Submission[] }) => {
    const [category, setCategory] = useState(pbCategories[0]);
    const timeToSeconds = (time: string | null): number => {
        if (!time) return Infinity; const parts = time.split(':'); let seconds = 0;
        if (parts.length === 2) { seconds += parseInt(parts[0], 10) * 60; seconds += parseFloat(parts[1]); }
        else if (parts.length === 1) { seconds += parseFloat(parts[0]); }
        return seconds || Infinity;
    };
    const filteredPBs = submissions.filter(pb => category === 'All Personal Bests' || pb.personal_best_category === category).sort((a, b) => timeToSeconds(a.personal_best_time) - timeToSeconds(b.personal_best_time));
    return (<div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700"><h3 className="text-xl font-semibold text-orange-400 mb-4 border-b-2 border-orange-500/30 pb-2">Personal Bests</h3><div className="mb-4"><select id="pbFilter" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500">{pbCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div><div className="overflow-x-auto"><table className="w-full text-left text-sm whitespace-nowrap"><thead><tr className="border-b border-slate-700"><th className="p-2 text-gray-400 font-medium">Rank</th><th className="p-2 text-gray-400 font-medium">Time</th><th className="p-2 text-gray-400 font-medium">Date</th><th className="p-2 text-gray-400 font-medium">Proof</th></tr></thead><tbody>{filteredPBs.length === 0 ? (<tr><td colSpan={4} className="text-center p-4 text-gray-500">No records for this category.</td></tr>) : (filteredPBs.map((pb, index) => (<tr key={pb.id} className="border-b border-slate-800"><td className="p-2 font-bold text-yellow-400">#{index + 1}</td><td className="p-2 text-white font-medium">{pb.personal_best_time}</td><td className="p-2 text-gray-400">{new Date(pb.created_at).toLocaleDateString()}</td><td className="p-2 text-center"><a href={pb.proof_image_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-medium">Proof</a></td></tr>)))}</tbody></table></div></div>);
};
const ClueScrollTracker = ({ activities }: { activities: any }) => {
    const clueTiers = [ { name: 'Easy', key: 'clue_scrolls_easy' }, { name: 'Medium', key: 'clue_scrolls_medium' }, { name: 'Hard', key: 'clue_scrolls_hard' }, { name: 'Elite', key: 'clue_scrolls_elite' }, { name: 'Master', key: 'clue_scrolls_master' }, { name: 'All', key: 'clue_scrolls_all' }, ];
    const completedClues = clueTiers.map(tier => ({ name: tier.name, score: activities[tier.key]?.score || 0 })).filter(clue => clue.score > 0);
    if (completedClues.length === 0) return null;
    return (<div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700"><h3 className="text-xl font-semibold text-orange-400 mb-4 border-b-2 border-orange-500/30 pb-2">Clue Scroll Completions</h3><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">{completedClues.map(clue => (<div key={clue.name} className="bg-slate-700/50 p-4 rounded-lg text-center"><Image src={`/ranks/clues/${clue.name.toLowerCase()}.png`} alt={`${clue.name} Clue`} width={28} height={28} className="mx-auto mb-2"/><p className="text-sm font-bold text-white">{clue.name}</p><p className="text-lg text-yellow-400">{clue.score.toLocaleString()}</p></div>))}</div></div>);
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

export default function PlayerDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const playerId = Array.isArray(params.id) ? params.id[0] : params.id;
  const ehbRank = searchParams.get('ehbRank');
  const clanRank = searchParams.get('clanRank');

  const [player, setPlayer] = useState<PlayerDetails | null>(null);
  const [personalBests, setPersonalBests] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!playerId) return;
    const fetchAllPlayerData = async () => {
      setLoading(true); setError('');
      try {
        const [detailsRes, submissionsRes] = await Promise.all([
            fetch(`/api/get-player-details/${playerId}`),
            fetch(`/api/get-player-submissions/${playerId}`)
        ]);
        if (!detailsRes.ok) throw new Error('Player data not found. Refresh may be needed by an admin.');
        const detailsData: PlayerDetails = await detailsRes.json();
        setPlayer(detailsData);
        if (submissionsRes.ok) {
            const submissionsData: Submission[] = await submissionsRes.json();
            setPersonalBests(submissionsData);
        }
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetchAllPlayerData();
  }, [playerId]);

  const snapshotData = player?.latestSnapshot?.data;
  // --- THIS IS THE FIX ---
  // The rankImageSrc variable was missing and has been re-added.
  const rankImageSrc = clanRank ? rankImageMap[decodeURIComponent(clanRank)] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Header />
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {loading && <p className="text-center text-gray-400">Loading player stats...</p>}
          {error && <p className="text-center text-red-400">{error}</p>}
          {player && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3">
                    {rankImageSrc && <Image src={rankImageSrc} alt={clanRank!} width={32} height={32} title={`Clan Rank: ${clanRank!}`} />}
                    <h1 className="text-4xl font-bold text-white tracking-wide" style={{ textShadow: '0 2px 15px rgba(255,165,0,0.3)' }}>{player.displayName}</h1>
                </div>
                 <div className="flex items-center justify-center gap-6 mt-2 text-lg text-gray-400">
                    <span className="capitalize">{player.type}</span>
                    <div className="flex items-center gap-2">
                        <Image src="/icons/combatlvl.png" alt="Combat Level" width={20} height={20} />
                        <span>{player.combatLevel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Image src="/icons/skilltotal.png" alt="Total Level" width={20} height={20} />
                        <span>{snapshotData?.skills?.overall?.level ?? 'N/A'}</span>
                    </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                <div className="w-full">
                    <PlaystyleDonut ehp={Math.round(player.ehp)} ehb={Math.round(player.ehb)} />
                </div>
                <div className="w-full">
                    {snapshotData?.bosses && <GlobalCompetitorPanel bosses={snapshotData.bosses} />}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StatCard label="Total EHB" value={Math.round(player.ehb)} />
                  {ehbRank && <StatCard label="Clan EHB Rank" value={ehbRank} />}
              </div>
              {snapshotData?.bosses && <RaidTiers bosses={snapshotData.bosses} />}
              {snapshotData?.skills && <TopSkillsPanel skills={snapshotData.skills} />}
              {snapshotData?.activities && <ClueScrollTracker activities={snapshotData.activities} />}
              {!loading && <PersonalBestsSection submissions={personalBests} />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}