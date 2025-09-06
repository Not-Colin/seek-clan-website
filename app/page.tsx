// app/page.tsx - FINAL with <img> Revert and Linting Fix

'use client';

import Header from '../components/Header';
import DataCard from '../components/DataCard';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
// We are no longer using the Next.js Image component in this file.
// import Image from 'next/image';

// --- Interfaces & Helpers ---
interface SpotlightPlayer { id: number; displayName: string; currentRank: string; imageUrl: string; }
const rankImageMap: { [key: string]: string } = { 'Clan Owner': '/ranks/owner.png', 'Deputy Owner': '/ranks/deputy_owner.png', 'Administrator': '/ranks/bandosian.png', 'Alternate Account': '/ranks/minion.png', 'Infernal': '/ranks/infernal.png', 'Zenyte': '/ranks/zenyte.png', 'Onyx': '/ranks/onyx.png', 'Dragonstone': '/ranks/dragonstone.png', 'Diamond': '/ranks/diamond.png', 'Ruby': '/ranks/ruby.png', 'Emerald': '/ranks/emerald.png', 'Sapphire': '/ranks/sapphire.png', 'Opal': '/ranks/opal.png', 'Backpack': '/ranks/backpack.png' };

// --- Player Spotlight Card Component ---
const PlayerSpotlightCard = ({ player }: { player: SpotlightPlayer; }) => {
  const profileUrl = `/players/${player.id}?clanRank=${encodeURIComponent(player.currentRank)}`;

  return (
      <Link href={profileUrl} className="block group">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl transition-all duration-300 group-hover:border-orange-500/50 group-hover:scale-105 shadow-lg overflow-hidden">
          <div className="relative p-4 h-[300px]">
            {/* --- REVERTED TO <img> TAG TO FIX RUNTIME ERROR --- */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={player.imageUrl}
              alt={`Character model for ${player.displayName}`}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-auto h-auto max-h-[280px]"
              loading="lazy"
            />
          </div>
        </div>
      </Link>
  );
};

// --- Main Page Component ---
interface Achievement { id: number; player_name: string; submission_type: 'bounty' | 'personal_best'; bounty_name: string | null; personal_best_category: string | null; personal_best_time: string | null; bounty_image_url: string | null; created_at: string; }
const getTimeAgo = (dateString: string) => { if (!dateString) return ''; const now = new Date(); const date = new Date(dateString); const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000); if (diffInSeconds < 60) return 'Just now'; const diffInMinutes = Math.floor(diffInSeconds / 60); if (diffInMinutes < 60) return `${diffInMinutes}m ago`; const diffInHours = Math.floor(diffInMinutes / 60); if (diffInHours < 24) return `${diffInHours}h ago`; const diffInDays = Math.floor(diffInHours / 24); return `${diffInDays}d ago`; };
const getOptimizedImageUrl = (url: string | null) => { if (!url) return ''; return `${url}?width=400`; };

export default function Home() {
  const [clanData, setClanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [spotlightPlayers, setSpotlightPlayers] = useState<SpotlightPlayer[]>([]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [clanDataRes, playersWithImagesRes] = await Promise.all([
        fetch('/api/get-cached-clan-data'),
        supabase
          .from('player_details')
          .select('wom_player_id, runeprofile_image_url')
          .eq('has_runeprofile', true)
          .not('runeprofile_image_url', 'is', null)
      ]);

      if (!clanDataRes.ok) throw new Error('Failed to fetch clan data');
      const data = await clanDataRes.json();
      setClanData(data);

      const { data: playersWithImages, error: playersWithImagesError } = playersWithImagesRes;
      if (playersWithImagesError) throw playersWithImagesError;

      if (data.rankedPlayers?.length > 0 && playersWithImages?.length > 0) {
        const playersWithImagesSet = new Set(playersWithImages.map(p => p.wom_player_id));
        const validSpotlightCandidates = data.rankedPlayers.filter((p: any) => playersWithImagesSet.has(p.id));
        const imageUrlMap = new Map(playersWithImages.map(p => [p.wom_player_id, p.runeprofile_image_url]));
        const shuffled = validSpotlightCandidates.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3);
        const finalSpotlightPlayers = selected.map((player: any) => ({
          id: player.id,
          imageUrl: imageUrlMap.get(player.id)!,
          displayName: player.displayName,
          currentRank: player.currentRank,
        }));
        setSpotlightPlayers(finalSpotlightPlayers);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const activeBounties = clanData?.activeBountiesCount || 0;
  const totalMembers = clanData?.totalMembers || 0;
  const totalBountiesClaimed = clanData?.totalBountiesClaimed || 0;
  const totalRewards = `${clanData?.totalRewardsPaidInMillions || 0}M GP`;
  const latestAchievements = clanData?.submissions?.filter((sub: any) => sub.status === 'approved' && ((sub.submission_type === 'bounty' && sub.bounty_image_url) || (sub.submission_type === 'personal_best'))).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center"><h1 className="text-4xl font-bold text-white mb-2">Welcome to <span className="text-orange-400" style={{ fontFamily: 'var(--font-pacifico)' }}>Seek</span></h1><p className="text-gray-400 text-lg">Your Oldschool RuneScape Clan Hub</p></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Link href="/bounties" className="block hover:scale-105 transition-transform duration-200"><DataCard title="Active Bounties" value={activeBounties} icon="ri-sword-line" className="bg-orange-800/20 backdrop-blur-sm border border-orange-500/30 hover:border-orange-400/50" iconBgClass="bg-orange-600/20" iconClass="text-orange-400"/></Link>
            <DataCard title="Total Members" value={totalMembers} icon="ri-user-line" iconBgClass="bg-blue-600/20" iconClass="text-blue-400" />
            <DataCard title="Total Bounties Claimed" value={totalBountiesClaimed} icon="ri-trophy-line" iconBgClass="bg-yellow-600/20" iconClass="text-yellow-400" />
            <Link href="/tradelog" className="block hover:scale-105 transition-transform duration-200"><DataCard title="Total Rewards Paid" value={totalRewards} icon="ri-coin-line" className="bg-green-800/20 backdrop-blur-sm border border-green-500/30 hover:border-green-400/50" iconBgClass="bg-green-600/20" iconClass="text-green-400"/></Link>
          </div>

          {!loading && spotlightPlayers.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-orange-400 mb-6 text-center tracking-wide">Player Showcase</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {spotlightPlayers.map((player) => (
                  <PlayerSpotlightCard key={player.id} player={player} />
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-3xl font-bold text-orange-400 mb-6 text-center tracking-wide">Latest Achievements</h2>
            {loading ? <p className="text-center text-gray-400">Loading achievements...</p> : latestAchievements.length === 0 ? <p className="text-center text-gray-400">No recent achievements have been claimed.</p> : (
              <div className="overflow-x-auto hide-scrollbar -mx-6 px-6 pb-2">
                <div className="flex space-x-6">
                    {latestAchievements.map((ach: any) => {
                      if (ach.submission_type === 'bounty') {
                        return (
                          <div key={ach.id} className="group relative w-64 flex-shrink-0 rounded-xl overflow-hidden border border-slate-700/50 shadow-lg transition-all duration-300">
                             {/* --- REVERTED TO <img> TAG TO FIX RUNTIME ERROR --- */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={getOptimizedImageUrl(ach.bounty_image_url)} alt={ach.bounty_name || 'Bounty image'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                            <div className="absolute -left-16 top-9 w-56 transform -rotate-45 bg-red-500 text-center text-white font-bold py-1 shadow-lg">CLAIMED</div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white"><h4 className="font-bold text-base leading-tight">{ach.player_name}</h4><p className="text-sm text-gray-300 truncate">{ach.bounty_name}</p></div>
                          </div>
                        );
                      } else {
                        return (
                          <div key={ach.id} className="w-64 flex-shrink-0 rounded-xl border border-slate-700/50 shadow-lg bg-slate-800 p-6 flex flex-col text-center">
                            <div className="flex-grow flex flex-col items-center justify-center">
                              <i className="ri-medal-line text-7xl text-yellow-400 mb-4"></i>
                              <h3 className="font-bold text-white text-lg leading-tight mb-3 text-center">{ach.personal_best_category}</h3>
                              {ach.personal_best_time && (<div className="flex items-center justify-center gap-2 mb-4"><i className="ri-timer-line text-lg text-orange-400"></i><p className="text-2xl font-bold text-white tracking-wider">{ach.personal_best_time}</p></div>)}
                              <p className="text-sm text-slate-400">{getTimeAgo(ach.created_at)}</p>
                            </div>
                            <div className="border-t border-slate-700 pt-3"><p className="text-lg font-semibold text-white truncate">{ach.player_name}</p></div>
                          </div>
                        );
                      }
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}