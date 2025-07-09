// app/page.tsx - FINAL CORRECTED CODE (VERIFIED)

'use client';

import Header from '../components/Header';
import DataCard from '../components/DataCard';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

// Define types for our data
interface Submission {
  id: number;
  created_at: string;
  player_name: string;
  submission_type: string;
  bounty_name: string | null;
  personal_best_category: string | null;
  bounty_tier: 'low' | 'medium' | 'high' | null;
  status: 'pending' | 'approved' | 'rejected';
}

interface PlayerStats {
  playerName: string;
  low: number;
  medium: number;
  high: number;
  totalBounties: number;
  totalEarned: string;
}

// New type for Google Sheets data
interface ClanMember {
  username: string;
  ehb: number;
  ehp: number;
}

export default function Home() {
  // --- State Variables ---
  const [activeBounties, setActiveBounties] = useState(0);
  const [totalBountiesClaimed, setTotalBountiesClaimed] = useState({ low: 0, medium: 0, high: 0, total: 0 });
  const [totalRewards, setTotalRewards] = useState('0 GP');
  const [topThreeThisMonth, setTopThreeThisMonth] = useState<PlayerStats[]>([]); // Still calculating, even if not explicitly shown
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [totalMembers, setTotalMembers] = useState(0);
  const [topEHB, setTopEHB] = useState<ClanMember[]>([]);
  const [topEHP, setTopEHP] = useState<ClanMember[]>([]);

  // --- TYPE GUARD FUNCTION (Defined outside useEffect to be stable) ---
  const isValidTier = (t: string | null): t is 'low' | 'medium' | 'high' => {
    return t === 'low' || t === 'medium' || t === 'high';
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);

      const clanStatsApiUrl = process.env.NEXT_PUBLIC_CLAN_STATS_API_URL;

      // --- Fetch Supabase AND Google Sheets Data Concurrently ---
      const [submissionsRes, activeBountiesRes, clanStatsRes] = await Promise.all([
        supabase.from('submissions').select('*').order('created_at', { ascending: false }),
        supabase.from('bounties').select('*', { count: 'exact', head: true }).eq('is_active', true),
        clanStatsApiUrl ? fetch(clanStatsApiUrl) : Promise.resolve(null)
      ]);

      // --- Process Supabase Data (Bounties and Recent Activity) ---
      const { data: allSubmissions, error: submissionsError } = submissionsRes;
      const { count: activeBountiesCount, error: bountiesError } = activeBountiesRes;

      if (submissionsError || bountiesError) {
        console.error("Dashboard Supabase fetch error:", submissionsError || bountiesError);
      } else {
        if (allSubmissions) {
          const approvedBounties = allSubmissions.filter(sub => sub.status === 'approved' && sub.submission_type === 'bounty');

          const bountyStats = { low: 0, medium: 0, high: 0, total: 0 };
          let totalRewardValue = 0;

          approvedBounties.forEach(bounty => {
            const tier = bounty.bounty_tier;
            if (isValidTier(tier)) {
              bountyStats[tier]++;
            }
            bountyStats.total++;
            const rewardValue = tier === 'low' ? 2 : tier === 'medium' ? 5 : 10;
            totalRewardValue += rewardValue;
          });
          setTotalBountiesClaimed(bountyStats);
          setTotalRewards(`${totalRewardValue}M GP`);

          // --- Calculate Top 3 Players (for topThreeThisMonth state) ---
          const playerStats: { [key: string]: PlayerStats } = {};
          approvedBounties.forEach(bounty => {
            if (!playerStats[bounty.player_name]) {
              playerStats[bounty.player_name] = { playerName: bounty.player_name, low: 0, medium: 0, high: 0, totalBounties: 0, totalEarned: '0M GP' };
            }
            const stats = playerStats[bounty.player_name];
            const tier = bounty.bounty_tier;

            if (isValidTier(tier)) {
              stats[tier]++;
            }
            stats.totalBounties++;
            const earnings = tier === 'low' ? 2 : tier === 'medium' ? 5 : 10;
            const currentEarnings = parseInt(stats.totalEarned) || 0;
            stats.totalEarned = `${currentEarnings + earnings}M GP`;
          });
          const sortedPlayers = Object.values(playerStats).sort((a, b) => (parseInt(b.totalEarned) || 0) - (parseInt(a.totalEarned) || 0)).slice(0, 3);
          setTopThreeThisMonth(sortedPlayers); // Set the state here

          // --- Get Recent Submissions (last 5, any status) ---
          const recentSubs = allSubmissions.slice(0, 5).map(sub => ({
            player: sub.player_name,
            bounty: sub.submission_type === 'bounty' ? sub.bounty_name : sub.personal_best_category,
            time: getTimeAgo(sub.created_at),
            status: sub.status.charAt(0).toUpperCase() + sub.status.slice(1)
          }));
          setRecentSubmissions(recentSubs);
        }
        setActiveBounties(activeBountiesCount || 0);
      }

      // --- Process Google Sheets Data ---
      if (clanStatsRes && clanStatsRes.ok) {
        const clanData = await clanStatsRes.json();
        setTotalMembers(clanData.totalMembers || 0);
        setTopEHB(clanData.topEHB || []);
        setTopEHP(clanData.topEHP || []);
      } else {
        console.error("Failed to fetch clan stats from Google Sheets API.");
        setTotalMembers(0);
        setTopEHB([]);
        setTopEHP([]);
      }

      setLoading(false);
    };

    loadDashboardData();
  }, []); // Empty dependency array, functions are defined to be stable

  // --- Helper functions (defined outside component to prevent re-creation warnings) ---
  const getTimeAgo = (dateString: string) => {
    const now = new Date(); const date = new Date(dateString); const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000); if (diffInSeconds < 60) return 'Just now'; const diffInMinutes = Math.floor(diffInSeconds / 60); if (diffInMinutes < 60) return `${diffInMinutes}m ago`; const diffInHours = Math.floor(diffInMinutes / 60); if (diffInHours < 24) return `${diffInHours}h ago`; const diffInDays = Math.floor(diffInHours / 24); return `${diffInDays}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) { case 'Approved': return 'bg-green-500/20 text-green-400'; case 'Pending': return 'bg-yellow-500/20 text-yellow-400'; case 'Rejected': return 'bg-red-500/20 text-red-400'; default: return 'bg-gray-500/20 text-gray-400'; }
  };

  const stats = [
    { title: 'Total Bounties Claimed', value: totalBountiesClaimed.total, icon: 'ri-trophy-line' },
    { title: 'Total Rewards Paid', value: totalRewards, icon: 'ri-coin-line' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center"><h1 className="text-4xl font-bold text-white mb-2">Welcome to <span className="text-orange-400" style={{ fontFamily: 'var(--font-pacifico)' }}>Seek</span></h1><p className="text-gray-400 text-lg">Your Oldschool RuneScape Clan Hub</p></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/bounties">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300 cursor-pointer">
                <div className="flex items-center justify-between mb-4"><div className="w-12 h-12 flex items-center justify-center bg-orange-600/20 rounded-lg"><i className="ri-sword-line text-2xl text-orange-400"></i></div></div>
                <h3 className="text-gray-400 text-sm font-medium mb-2">Active Bounties</h3>
                <p className="text-2xl font-bold text-white">{activeBounties}</p>
              </div>
            </Link>
            <DataCard title="Total Members" value={totalMembers} icon="ri-user-line" />
            {stats.map((stat, index) => (<DataCard key={index} title={stat.title} value={stat.value} icon={stat.icon} />))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top 3 EHB */}
            <div className="lg:col-span-1 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center"><i className="ri-sword-fill text-red-400 mr-2"></i>Top 3 EHB</h3>
              {loading ? <p className='text-gray-400'>Loading...</p> : topEHB.length === 0 ? <p className="text-gray-400 text-center py-4">No EHB data found.</p> : (
                <div className="space-y-4">
                  {topEHB.map((member, index) => (
                    <div key={index} className="p-3 rounded-lg border bg-slate-700/30 border-slate-600/50 flex items-center justify-between">
                      <span className="font-bold text-white">#{index + 1} {member.username}</span>
                      <span className="font-bold text-red-400">{member.ehb.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top 3 EHP */}
            <div className="lg:col-span-1 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center"><i className="ri-shield-star-fill text-blue-400 mr-2"></i>Top 3 EHP</h3>
              {loading ? <p className='text-gray-400'>Loading...</p> : topEHP.length === 0 ? <p className="text-gray-400 text-center py-4">No EHP data found.</p> : (
                <div className="space-y-4">
                  {topEHP.map((member, index) => (
                    <div key={index} className="p-3 rounded-lg border bg-slate-700/30 border-slate-600/50 flex items-center justify-between">
                      <span className="font-bold text-white">#{index + 1} {member.username}</span>
                      <span className="font-bold text-blue-400">{member.ehp.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Submissions */}
            <div className="lg:col-span-1 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <i className="ri-time-line text-purple-400 mr-2"></i>Recent Activity
              </h3>
               {loading ? <p className='text-gray-400'>Loading...</p> : recentSubmissions.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No submissions yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-slate-700">
                        <th className="text-left py-2 px-3 text-gray-400 font-medium text-sm">Player</th>
                        <th className="text-left py-2 px-3 text-gray-400 font-medium text-sm">Status</th>
                    </tr></thead>
                    <tbody>
                      {recentSubmissions.map((sub, index) => (
                        <tr key={index} className="border-b border-slate-800">
                          <td className="py-2 px-3 text-white font-medium">{sub.player}</td>
                          <td className="py-2 px-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sub.status)}`}>{sub.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}