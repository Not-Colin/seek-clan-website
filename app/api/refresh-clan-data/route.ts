// app/api/refresh-clan-data/route.ts - CORRECTED to filter by current clan members

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

interface PlayerBountyCounts { low: number; medium: number; high: number; total: number; }
interface ClanMemberRanked { id: number; username: string; displayName: string; ehb: number; ehp: number; accountType: string; ttm: number; bounties: PlayerBountyCounts; currentRank: string; rankOrder: number; requirementsMet: string[]; nextRankRequirements: string[]; }
const RANK_DEFINITIONS = [ { name: "Infernal", order: 10, criteria: [ { type: "low_bounties", min: 12 }, { type: "high_bounties", min: 3 }, { type: "ehb", min: 1000 }, ]}, { name: "Zenyte", order: 9, criteria: [ { type: "low_bounties", min: 9 }, { type: "high_bounties", min: 3 }, { type: "ehb", min: 1000 }, ]}, { name: "Onyx", order: 8, criteria: [ { type: "low_bounties", min: 7 }, { type: "high_bounties", min: 2 }, { type: "ehb", min: 750 }, ]}, { name: "Dragonstone", order: 7, criteria: [ { type: "low_bounties", min: 5 }, { type: "high_bounties", min: 1 }, { type: "ehb", min: 500 }, ]}, { name: "Diamond", order: 6, criteria: [ { type: "low_bounties", min: 4 }, { type: "medium_bounties", min: 2 }, { type: "ehb", min: 250 }, ]}, { name: "Ruby", order: 5, criteria: [ { type: "low_bounties", min: 3 }, { type: "medium_bounties", min: 1 }, { type: "ehb", min: 100 }, ]}, { name: "Emerald", order: 4, criteria: [ { type: "low_bounties", min: 2 }, { type: "ehb", min: 50 }, ]}, { name: "Sapphire", order: 3, criteria: [ { type: "low_bounties", min: 1 }, { type: "ehb", min: 25 }, ]}, { name: "Opal", order: 2, criteria: [ { type: "ehb", min: 10 }, ]}, { name: "Backpack", order: 1, criteria: [] }, ];
const SPECIAL_ROLES = new Set(['owner', 'deputy_owner', 'bandosian', 'minion']);
const ROLE_DISPLAY_NAMES: { [key: string]: string } = { owner: 'Clan Owner', deputy_owner: 'Deputy Owner', bandosian: 'Administrator', minion: 'Alternate Account' };
const ROLE_SORT_ORDER: { [key: string]: number } = { minion: -1, bandosian: -2, owner: -3, deputy_owner: -3 };

function getPlayerRank(playerStats: { ehb: number; }, bountyCounts: PlayerBountyCounts): { rank: string; order: number; next: string[] } {
    let currentRank = "Backpack"; let currentOrder = 1;
    for (const rankDef of RANK_DEFINITIONS) { if (!rankDef.criteria) continue; const meetsAll = rankDef.criteria.every(criterion => { switch(criterion.type) { case "low_bounties": return bountyCounts.total >= criterion.min; case "medium_bounties": return (bountyCounts.medium + bountyCounts.high) >= criterion.min; case "high_bounties": return bountyCounts.high >= criterion.min; case "ehb": return playerStats.ehb >= criterion.min; default: return false; } }); if (meetsAll) { currentRank = rankDef.name; currentOrder = rankDef.order; break; } }
    const nextRankRequirements: string[] = []; const nextRankDef = RANK_DEFINITIONS.find(r => r.order === currentOrder + 1);
    if (nextRankDef) {
        const highCrit = nextRankDef.criteria.find(c => c.type === 'high_bounties'); const mediumCrit = nextRankDef.criteria.find(c => c.type === 'medium_bounties'); const totalCrit = nextRankDef.criteria.find(c => c.type === 'low_bounties'); const ehbCrit = nextRankDef.criteria.find(c => c.type === 'ehb');
        let neededHigh = 0; let neededMediumOrHigher = 0;
        if (highCrit && bountyCounts.high < highCrit.min) { neededHigh = highCrit.min - bountyCounts.high; nextRankRequirements.push(`Claim ${neededHigh} more High bounty/ies`); }
        if (mediumCrit) { const effectiveMedium = bountyCounts.medium + bountyCounts.high; if (effectiveMedium < mediumCrit.min) { neededMediumOrHigher = mediumCrit.min - effectiveMedium; nextRankRequirements.push(`Claim ${neededMediumOrHigher} more Medium or High bounty/ies`); } }
        if (totalCrit) { const futureBountyTotal = bountyCounts.total + neededHigh + neededMediumOrHigher; if (futureBountyTotal < totalCrit.min) { const remainingNeeded = totalCrit.min - futureBountyTotal; nextRankRequirements.push(`Claim ${remainingNeeded} more bounty/ies (any tier)`); } }
        if (ehbCrit && playerStats.ehb < ehbCrit.min) { const neededEhb = ehbCrit.min - playerStats.ehb; nextRankRequirements.push(`Gain ${Math.ceil(neededEhb).toLocaleString()} more EHB`); }
        if (nextRankRequirements.length === 0) { nextRankRequirements.push(`All requirements met for ${nextRankDef.name}!`); }
    } else { nextRankRequirements.push("You are at the highest rank!"); }
    return { rank: currentRank, order: currentOrder, next: nextRankRequirements };
}

export async function POST(request: Request) {
    const authHeader = request.headers.get('Authorization'); if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); const token = authHeader.split(' ')[1]; const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!); const { data: { user } } = await supabase.auth.getUser(token); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    try {
        console.log("Starting fast rank calculation...");

        // --- THE FIX IS HERE ---
        // Step A: Get the definitive list of current clan members from WOM (one fast call).
        const womGroupIdString = process.env.WOM_GROUP_ID;
        const WOM_GROUP_ID = parseInt(womGroupIdString?.trim() || '0', 10);
        if (isNaN(WOM_GROUP_ID) || WOM_GROUP_ID !== 5622) throw new Error("Invalid WOM_GROUP_ID");
        const groupRes = await fetch(`https://api.wiseoldman.net/v2/groups/${WOM_GROUP_ID}`, { cache: 'no-store' });
        if (!groupRes.ok) throw new Error(`Failed to fetch current member list from WOM: ${groupRes.status}`);
        const groupData = await groupRes.json();
        if (!Array.isArray(groupData.memberships)) throw new Error("Invalid WOM membership data");
        const currentMemberIds = new Set(groupData.memberships.map((m: any) => m.player.id));

        // Step B: Fetch all necessary data from our OWN database.
        const [allPlayerDetailsRes, allSubmissionsRes, allBountiesRes] = await Promise.all([
            supabaseAdmin.from('player_details').select('wom_details_json'),
            supabaseAdmin.from('submissions').select('*'),
            supabaseAdmin.from('bounties').select('id, image_url, is_active')
        ]);

        const { data: allPlayerDetailsData, error: playerDetailsError } = allPlayerDetailsRes;
        if (playerDetailsError) throw playerDetailsError;
        if (!allPlayerDetailsData) throw new Error("Could not fetch player details from Supabase.");

        // Step C: Filter our local data to only include current members.
        const currentMemberDetails = allPlayerDetailsData
            .map(p => p.wom_details_json)
            .filter(details => details && currentMemberIds.has(details.id));

        console.log(`Found ${currentMemberIds.size} current members. Calculating ranks for ${currentMemberDetails.length} matching players in our database.`);

        // All subsequent logic now operates on the CORRECT list of current members.
        const { data: allBounties, error: bountiesError } = allBountiesRes;
        if (bountiesError) throw bountiesError;
        const bountyImageMap = new Map();
        allBounties.forEach(bounty => bountyImageMap.set(bounty.id, bounty.image_url));
        const activeBountiesCount = allBounties.filter(b => b.is_active).length;

        const { data: allSubmissions, error: submissionsError } = allSubmissionsRes;
        if (submissionsError) throw submissionsError;
        const submissionsWithImages = allSubmissions.map(submission => { let bounty_image_url = null; if (submission.submission_type === 'bounty' && submission.bounty_id) { bounty_image_url = bountyImageMap.get(submission.bounty_id) || null; } return { ...submission, bounty_image_url }; });
        const approvedSubmissions = allSubmissions.filter(sub => sub.status === 'approved' && sub.submission_type === 'bounty');

        const playerBountyCounts: { [playerId: number]: PlayerBountyCounts } = {};
        approvedSubmissions.forEach(sub => { if (sub.wom_player_id === null) return; const playerId = sub.wom_player_id; if (!playerBountyCounts[playerId]) playerBountyCounts[playerId] = { low: 0, medium: 0, high: 0, total: 0 }; if (sub.bounty_tier === 'low') playerBountyCounts[playerId].low++; if (sub.bounty_tier === 'medium') playerBountyCounts[playerId].medium++; if (sub.bounty_tier === 'high') playerBountyCounts[playerId].high++; playerBountyCounts[playerId].total++; });

        let clanMembersRanked: ClanMemberRanked[] = [];
        let ehbLeaderboard: { username: string; displayName: string; ehb: number }[] = [];
        let ehpLeaderboard: { username: string; displayName: string; ehp: number }[] = [];

        const womMemberships = currentMemberDetails.map((p: any) => ({ player: p, role: p.role }));

        womMemberships.forEach((membership: any) => {
            const player = membership.player;
            if (!player) return;
            const playerId = player.id; const username = player.username; const displayName = player.displayName; const ehb = Math.round(player.ehb || 0); const ehp = Math.round(player.ehp || 0); const ttm = Math.round(player.ttm || 0); const accountType = player.type || 'unknown'; const role = membership.role || 'member';
            ehbLeaderboard.push({ username, displayName, ehb });
            ehpLeaderboard.push({ username, displayName, ehp });
            if (SPECIAL_ROLES.has(role)) {
                clanMembersRanked.push({ id: playerId, username, displayName, ehb, ehp, accountType, ttm, bounties: { low: 0, medium: 0, high: 0, total: 0 }, currentRank: ROLE_DISPLAY_NAMES[role] || role, rankOrder: ROLE_SORT_ORDER[role] || -99, requirementsMet: [], nextRankRequirements: ["N/A for this role"], });
                return;
            }
            const bounties = playerBountyCounts[playerId] || { low: 0, medium: 0, high: 0, total: 0 };
            const { rank, order, next } = getPlayerRank({ ehb }, bounties);
            clanMembersRanked.push({ id: playerId, username, displayName, ehb, ehp, accountType, ttm, bounties, currentRank: rank, rankOrder: order, requirementsMet: [], nextRankRequirements: next });
        });

        ehbLeaderboard.sort((a, b) => b.ehb - a.ehb);
        ehpLeaderboard.sort((a, b) => b.ehp - a.ehp);
        const totalBountiesClaimed = clanMembersRanked.reduce((acc, player) => acc + (player.bounties?.total || 0), 0);
        let totalRewardsPaidInMillions = 0;
        allSubmissions.forEach(sub => {
            if (sub.status === 'approved' && sub.submission_type === 'bounty' && sub.trade_proof_url) {
                if (sub.bounty_tier === 'low') totalRewardsPaidInMillions += 2;
                if (sub.bounty_tier === 'medium') totalRewardsPaidInMillions += 5;
                if (sub.bounty_tier === 'high') totalRewardsPaidInMillions += 10;
            }
        });

        const computedData = {
          totalMembers: womMemberships.length,
          topEHB: ehbLeaderboard.slice(0, 3),
          topEHP: ehpLeaderboard.slice(0, 3),
          rankedPlayers: clanMembersRanked.sort((a, b) => b.rankOrder - a.rankOrder || a.displayName.localeCompare(b.displayName)),
          lastUpdated: new Date().toISOString(),
          submissions: submissionsWithImages,
          activeBountiesCount,
          totalBountiesClaimed,
          totalRewardsPaidInMillions,
        };

        const { error: updateError } = await supabaseAdmin.from('clan_data').update({ data: computedData }).eq('id', 1);
        if (updateError) throw updateError;

        revalidatePath('/');
        return NextResponse.json({ message: `Rank calculation complete for ${womMemberships.length} current members.` });

    } catch (error: any) {
        console.error('Rank Calculation API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}