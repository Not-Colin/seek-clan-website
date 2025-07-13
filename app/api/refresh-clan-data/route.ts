// app/api/refresh-clan-data/route.ts - FINAL FIX for Rank Calculation

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ... (Interfaces, RANK_DEFINITIONS, and getPlayerRank function are unchanged and correct)
interface PlayerBountyCounts { low: number; medium: number; high: number; total: number; }
interface ClanMemberWithWOMStats { username: string; ehb: number; ehp: number; combatLevel: number; totalLevel: number; }
interface ClanMemberRanked { username: string; displayName: string; ehb: number; ehp: number; accountType: string; ttm: number; bounties: PlayerBountyCounts; currentRank: string; rankOrder: number; requirementsMet: string[]; nextRankRequirements: string[]; }
const RANK_DEFINITIONS = [ { name: "Zenyte", order: 9, criteria: [ { type: "high_bounties", min: 3, display: "3+ High Bounties" }, { type: "ehb", min: 1000, display: "1000+ EHB" }, ]}, { name: "Onyx", order: 8, criteria: [ { type: "high_bounties", min: 2, display: "2+ High Bounties" }, { type: "ehb", min: 750, display: "750+ EHB" }, ]}, { name: "Dragonstone", order: 7, criteria: [ { type: "high_bounties", min: 1, display: "1+ High Bounty" }, { type: "ehb", min: 500, display: "500+ EHB" }, ]}, { name: "Diamond", order: 6, criteria: [ { type: "medium_bounties", min: 2, display: "2+ Medium Bounties" }, { type: "ehb", min: 250, display: "250+ EHB" }, ]}, { name: "Ruby", order: 5, criteria: [ { type: "medium_bounties", min: 1, display: "1+ Medium Bounty" }, { type: "ehb", min: 100, display: "100+ EHB" }, ]}, { name: "Emerald", order: 4, criteria: [ { type: "total_bounties", min: 4, display: "4+ Total Bounties" }, { type: "ehb", min: 50, display: "50+ EHB" }, ]}, { name: "Sapphire", order: 3, criteria: [ { type: "total_bounties", min: 3, display: "3+ Total Bounties" }, { type: "ehb", min: 25, display: "25+ EHB" }, ]}, { name: "Opal", order: 2, criteria: [ { type: "total_bounties", min: 1, display: "1+ Total Bounty" }, { type: "ehb", min: 10, display: "10+ EHB" }, ]}, { name: "Backpack", order: 0, criteria: [] }, ];
function getPlayerRank(playerStats: { ehb: number; }, bountyCounts: PlayerBountyCounts): { rank: string; order: number; } {
    for (const rankDef of RANK_DEFINITIONS) { if (!rankDef.criteria || rankDef.criteria.length === 0) continue; const meetsAll = rankDef.criteria.every(criterion => { switch (criterion.type) { case "total_bounties": return bountyCounts.total >= criterion.min; case "medium_bounties": return bountyCounts.medium >= criterion.min; case "high_bounties": return bountyCounts.high >= criterion.min; case "ehb": return playerStats.ehb >= criterion.min; default: return false; } }); if (meetsAll) { return { rank: rankDef.name, order: rankDef.order }; } } return { rank: "Backpack", order: 0 };
}


export async function POST(request: Request) {
    // ... (Authentication logic remains the same)
    const authHeader = request.headers.get('Authorization'); if (!authHeader || !authHeader.startsWith('Bearer ')) { return NextResponse.json({ error: 'Unauthorized: Missing Authorization Header.' }, { status: 401 }); } const token = authHeader.split(' ')[1]; const supabase = createClient( process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! ); const { data: { user } } = await supabase.auth.getUser(token); if (!user) { return NextResponse.json({ error: 'Unauthorized: Invalid token.' }, { status: 401 }); } const WOM_GROUP_ID = process.env.WOM_GROUP_ID; if (!WOM_GROUP_ID) { return NextResponse.json({ error: "WOM_GROUP_ID not configured." }, { status: 500 }); } const supabaseAdmin = createClient( process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY! );

    try {
        const [groupRes, submissionsRes] = await Promise.all([
            fetch(`https://api.wiseoldman.net/v2/groups/${WOM_GROUP_ID}`),
            supabaseAdmin.from('submissions').select('player_name, bounty_tier').eq('status', 'approved').eq('submission_type', 'bounty'),
        ]);

        if (!groupRes.ok) throw new Error(`Failed to fetch WOM group details: ${groupRes.statusText}`);
        const groupData = await groupRes.json();
        const womMemberships = groupData.memberships;
        if (!Array.isArray(womMemberships)) throw new Error("Invalid WOM group data format: 'memberships' array not found.");

        const { data: approvedSubmissions, error: submissionsError } = submissionsRes;
        if (submissionsError) throw new Error(`Failed to fetch submissions: ${submissionsError.message}`);

        // --- NORMALIZATION FIX 1 ---
        // Create the bounty count map using lowercase player names as keys
        const playerBountyCounts: { [normalizedName: string]: PlayerBountyCounts } = {};
        approvedSubmissions.forEach(sub => {
          const normalizedPlayerName = sub.player_name.toLowerCase(); // Convert to lowercase
          if (!playerBountyCounts[normalizedPlayerName]) {
              playerBountyCounts[normalizedPlayerName] = { low: 0, medium: 0, high: 0, total: 0 };
          }
          if (sub.bounty_tier === 'low') playerBountyCounts[normalizedPlayerName].low++;
          if (sub.bounty_tier === 'medium') playerBountyCounts[normalizedPlayerName].medium++;
          if (sub.bounty_tier === 'high') playerBountyCounts[normalizedPlayerName].high++;
          playerBountyCounts[normalizedPlayerName].total++;
        });

        let clanMembersRanked: ClanMemberRanked[] = [];
        let ehbLeaderboard: { username: string; displayName: string; ehb: number }[] = [];
        let ehpLeaderboard: { username: string; displayName: string; ehp: number }[] = [];
        let totalClanMembers = womMemberships.length;

        womMemberships.forEach((membership: any) => {
            const player = membership.player;
            if (!player) return;

            const username = player.username; // This is already normalized by WOM
            const displayName = player.displayName;
            const ehb = Math.round(player.ehb || 0);
            const ehp = Math.round(player.ehp || 0);
            const ttm = Math.round(player.ttm || 0);
            const accountType = player.type || 'unknown';

            ehbLeaderboard.push({ username, displayName, ehb });
            ehpLeaderboard.push({ username, displayName, ehp });

            // --- NORMALIZATION FIX 2 ---
            // Look up bounty counts using the lowercase username
            const bounties = playerBountyCounts[username.toLowerCase()] || { low: 0, medium: 0, high: 0, total: 0 };

            const { rank, order } = getPlayerRank({ ehb }, bounties);

            clanMembersRanked.push({
                username, displayName, ehb, ehp, accountType, ttm, bounties,
                currentRank: rank, rankOrder: order,
                requirementsMet: [], nextRankRequirements: [],
            });
        });

        ehbLeaderboard.sort((a, b) => b.ehb - a.ehb);
        ehpLeaderboard.sort((a, b) => b.ehp - a.ehp);

        const computedData = {
          totalMembers: totalClanMembers,
          topEHB: ehbLeaderboard.slice(0, 3),
          topEHP: ehpLeaderboard.slice(0, 3),
          rankedPlayers: clanMembersRanked.sort((a, b) => b.rankOrder - a.rankOrder || a.displayName.localeCompare(b.displayName)),
          lastUpdated: new Date().toISOString()
        };

        const { error: updateError } = await supabaseAdmin.from('clan_data').update({ data: computedData }).eq('id', 1);
        if (updateError) throw new Error(`Failed to save computed data: ${updateError.message}`);

        return NextResponse.json({ message: `Clan data refreshed successfully at ${new Date().toLocaleTimeString()}.` });

    } catch (error: any) {
        console.error('Refresh API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}