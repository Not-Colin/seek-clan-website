// app/page.tsx - Restored missing JSX elements and fixed data flow

'use client';

import Header from '../components/Header';
import DataCard from '../components/DataCard';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface ClanMemberStat {
  username: string;
  displayName: string;
  ehb: number;
  ehp: number;
}

interface RecentSubmission {
    player: string;
    bounty: string | null;
    time: string;
    status: string;
    statusColor: string;
}

export default function Home() {
  const [activeBounties, setActiveBounties] = useState(0);
  const [totalBountiesClaimed, setTotalBountiesClaimed] = useState(0);
  const [totalRewards, setTotalRewards] = useState('0 GP');
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);
  const [topEHB, setTopEHB] = useState<ClanMemberStat[]>([]);
  const [topEHP, setTopEHP] = useState<ClanMemberStat[]>([]);

  const getTimeAgo = useCallback((dateString: string) => {
    const now = new Date(); const date = new Date(dateString); const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000); if (diffInSeconds < 60) return 'Just now'; const diffInMinutes = Math.floor(diffInSeconds / 60); if (diffInMinutes < 60) return `${diffInMinutes}m ago`; const diffInHours = Math.floor(diffInMinutes / 60); if (diffInHours < 24) return `${diffInHours}h ago`; const diffInDays = Math.floor(diffInHours / 24); return `${diffInDays}d ago`;
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) { case 'Approved': return 'bg-green-500/20 text-green-400'; case 'Pending': return 'bg-yellow-500/20 text-yellow-400'; case 'Rejected': return 'bg-red-500/20 text-red-400'; default: return 'bg-gray-500/20 text-gray-400'; }
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [clanDataRes, recentSubmissionsRes, activeBountiesRes, allBountiesRes] = await Promise.all([
          fetch('/api/get-cached-clan-data'),
          supabase.from('submissions').select('*').order('created_at', { ascending: false }).limit(5),
          supabase.from('bounties').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('submissions').select('bounty_tier').eq('status', 'approved').eq('submission_type', 'bounty')
        ]);

        if (clanDataRes.ok) {
          const clanData = await clanDataRes.json();
          setTotalMembers(clanData.totalMembers || 0);
          setTopEHB(clanData.topEHB || []);
          setTopEHP(clanData.topEHP || []);
        } else { console.error("Failed to fetch clan data:", await clanDataRes.text()); }

        if (recentSubmissionsRes.data) {
            const recentSubs = recentSubmissionsRes.data.map(sub => {
                const statusText = sub.status.charAt(0).toUpperCase() + sub.status.slice(1);
                return {
                    player: sub.player_name,
                    bounty: sub.submission_type === 'bounty' ? sub.bounty_name : sub.personal_best_category,
                    time: getTimeAgo(sub.created_at),
                    status: statusText,
                    statusColor: getStatusColor(statusText),
                };
            });
            setRecentSubmissions(recentSubs);
        }

        if (allBountiesRes.data) {
            let totalRewardValue = 0;
            allBountiesRes.data.forEach(bounty => {
                const tier = bounty.bounty_tier;
                if (tier === 'low') totalRewardValue += 2;
                if (tier === 'medium') totalRewardValue += 5;
                if (tier === 'high') totalRewardValue += 10;
            });
            setTotalBountiesClaimed(allBountiesRes.data.length);
            setTotalRewards(`${totalRewardValue}M GP`);
        }

        setActiveBounties(activeBountiesRes.count || 0);

      } catch (error) { console.error("Failed to load dashboard data:", error); }
      finally { setLoading(false); }
    };
    loadDashboardData();
  }, [getTimeAgo, getStatusColor]);

  const stats = [
    { title: 'Total Bounties Claimed', value: totalBountiesClaimed, icon: 'ri-trophy-line' },
    { title: 'Total Rewards Paid', value: totalRewards, icon: 'ri-coin-line' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* --- RESTORED: Welcome Message --- */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Welcome to <span className="text-orange-400" style={{ fontFamily: 'var(--font-pacifico)' }}>Seek</span></h1>
            <p className="text-gray-400 text-lg">Your Oldschool RuneScape Clan Hub</p>
          </div>

          {/* --- RESTORED: Data Cards Row --- */}
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

          {/* Leaderboards and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center"><i className="ri-sword-fill text-red-400 mr-2"></i>Top 3 EHB</h3>
              {loading ? <p className='text-gray-400'>Loading...</p> : topEHB.length === 0 ? <p className="text-gray-400 text-center py-4">No EHB data found.</p> : (
                <div className="space-y-4">{topEHB.map((member, index) => (<div key={member.username} className="p-3 rounded-lg border bg-slate-700/30 border-slate-600/50 flex items-center justify-between"><span className="font-bold text-white">#{index + 1} {member.displayName}</span><span className="font-bold text-red-400">{member.ehb.toLocaleString()}</span></div>))}</div>
              )}
            </div>
            <div className="lg:col-span-1 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center"><i className="ri-shield-star-fill text-blue-400 mr-2"></i>Top 3 EHP</h3>
              {loading ? <p className='text-gray-400'>Loading...</p> : topEHP.length === 0 ? <p className="text-gray-400 text-center py-4">No EHP data found.</p> : (
                <div className="space-y-4">{topEHP.map((member, index) => (<div key={member.username} className="p-3 rounded-lg border bg-slate-700/30 border-slate-600/50 flex items-center justify-between"><span className="font-bold text-white">#{index + 1} {member.displayName}</span><span className="font-bold text-blue-400">{member.ehp.toLocaleString()}</span></div>))}</div>
              )}
            </div>
            <div className="lg:col-span-1 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center"><i className="ri-time-line text-purple-400 mr-2"></i>Recent Activity</h3>
               {loading ? <p className='text-gray-400'>Loading...</p> : recentSubmissions.length === 0 ? (<p className="text-gray-400 text-center py-4">No submissions yet.</p>) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-slate-700"><th className="text-left py-2 px-3 text-gray-400 font-medium text-sm">Player</th><th className="text-left py-2 px-3 text-gray-400 font-medium text-sm">Status</th></tr></thead>
                    <tbody>{recentSubmissions.map((sub, index) => (<tr key={index} className="border-b border-slate-800"><td className="py-2 px-3 text-white font-medium">{sub.player}</td><td className="py-2 px-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${sub.statusColor}`}>{sub.status}</span></td></tr>))}</tbody>
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