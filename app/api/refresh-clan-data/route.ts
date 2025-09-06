// app/api/refresh-clan-data/route.ts - Cleaned up version

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { WOMClient } from '@wise-old-man/utils';

// ... (All your interfaces and constants like RANK_DEFINITIONS remain the same)
interface PlayerBountyCounts { low: number; medium: number; high: number; total: number; }
interface ClanMemberRanked { id: number; username: string; displayName: string; ehb: number; ehp: number; accountType: string; ttm: number; bounties: PlayerBountyCounts; currentRank: string; rankOrder: number; requirementsMet: string[]; nextRankRequirements: string[]; }
const RANK_DEFINITIONS = [ { name: "Infernal", order: 10, criteria: [ { type: "low_bounties", min: 12 }, { type: "high_bounties", min: 3 }, { type: "ehb", min: 1000 }, ]}, { name: "Zenyte", order: 9, criteria: [ { type: "low_bounties", min: 9 }, { type: "high_bounties", min: 3 }, { type: "ehb", min: 1000 }, ]}, { name: "Onyx", order: 8, criteria: [ { type: "low_bounties", min: 7 }, { type: "high_bounties", min: 2 }, { type: "ehb", min: 750 }, ]}, { name: "Dragonstone", order: 7, criteria: [ { type: "low_bounties", min: 5 }, { type: "high_bounties", min: 1 }, { type: "ehb", min: 500 }, ]}, { name: "Diamond", order: 6, criteria: [ { type: "low_bounties", min: 4 }, { type: "medium_bounties", min: 2 }, { type: "ehb", min: 250 }, ]}, { name: "Ruby", order: 5, criteria: [ { type: "low_bounties", min: 3 }, { type: "medium_bounties", min: 1 }, { type: "ehb", min: 100 }, ]}, { name: "Emerald", order: 4, criteria: [ { type: "low_bounties", min: 2 }, { type: "ehb", min: 50 }, ]}, { name: "Sapphire", order: 3, criteria: [ { type: "low_bounties", min: 1 }, { type: "ehb", min: 25 }, ]}, { name: "Opal", order: 2, criteria: [ { type: "ehb", min: 10 }, ]}, { name: "Backpack", order: 1, criteria: [] }, ];
const SPECIAL_ROLES = new Set(['owner', 'deputy_owner', 'bandosian', 'minion']);
const ROLE_DISPLAY_NAMES: { [key: string]: string } = { owner: 'Clan Owner', deputy_owner: 'Deputy Owner', bandosian: 'Administrator', minion: 'Alternate Account' };
const ROLE_SORT_ORDER: { [key: string]: number } = { minion: -1, bandosian: -2, owner: -3, deputy_owner: -3 };
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
function getPlayerRank(playerStats: { ehb: number; }, bountyCounts: PlayerBountyCounts): { rank: string; order: number; next: string[] } { let currentRank = "Backpack"; let currentOrder = 1; let nextRankRequirements: string[] = []; for (const rankDef of RANK_DEFINITIONS) { if (!rankDef.criteria) continue; const meetsAll = rankDef.criteria.every(criterion => { switch(criterion.type) { case "low_bounties": return bountyCounts.total >= criterion.min; case "medium_bounties": return (bountyCounts.medium + bountyCounts.high) >= criterion.min; case "high_bounties": return bountyCounts.high >= criterion.min; case "ehb": return playerStats.ehb >= criterion.min; default: return false; } }); if (meetsAll) { currentRank = rankDef.name; currentOrder = rankDef.order; break; } } const nextRankDef = RANK_DEFINITIONS.find(r => r.order === currentOrder + 1); if (nextRankDef) { nextRankDef.criteria.forEach(criterion => { let needed = 0; switch(criterion.type) { case "low_bounties": if (bountyCounts.total < criterion.min) { needed = criterion.min - bountyCounts.total; nextRankRequirements.push(`Claim ${needed} more bounty/ies (any tier)`);} break; case "medium_bounties": const effectiveMedium = bountyCounts.medium + bountyCounts.high; if (effectiveMedium < criterion.min) { needed = criterion.min - effectiveMedium; nextRankRequirements.push(`Claim ${needed} more Medium or High bounty/ies`);} break; case "high_bounties": if (bountyCounts.high < criterion.min) { needed = criterion.min - bountyCounts.high; nextRankRequirements.push(`Claim ${needed} more High bounty/ies`);} break; case "ehb": if (playerStats.ehb < criterion.min) { needed = criterion.min - playerStats.ehb; nextRankRequirements.push(`Gain ${Math.ceil(needed).toLocaleString()} more EHB`);} break; } }); if (nextRankRequirements.length === 0) nextRankRequirements.push(`All requirements met for ${nextRankDef.name}!`); } else { nextRankRequirements.push("You are at the highest rank!"); } return { rank: currentRank, order: currentOrder, next: nextRankRequirements }; }

export async function POST(request: Request) {
    const authHeader = request.headers.get('Authorization'); if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); const token = authHeader.split(' ')[1]; const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!); const { data: { user } } = await supabase.auth.getUser(token); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const womGroupIdString = process.env.WOM_GROUP_ID; const WOM_GROUP_ID = parseInt(womGroupIdString?.trim() || '0', 10); if (isNaN(WOM_GROUP_ID) || WOM_GROUP_ID !== 5622) return NextResponse.json({ error: `Invalid WOM_GROUP_ID` }, { status: 500 });
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const womUrl = `https://api.wiseoldman.net/v2/groups/${WOM_GROUP_ID}`;
    const womClient = new WOMClient();

    try {
        const [groupRes, allSubmissionsRes, allBountiesRes, oldClanDataRes] = await Promise.all([
            fetch(womUrl),
            supabaseAdmin.from('submissions').select('*'),
            supabaseAdmin.from('bounties').select('id, image_url, is_active'),
            // Fetch the old data to preserve the spotlight player
            supabaseAdmin.from('clan_data').select('data').eq('id', 1).single()
        ]);

        if (!groupRes.ok) throw new Error(`Failed WOM fetch: ${groupRes.status}`);
        const groupData = await groupRes.json();
        const womMemberships = groupData.memberships;
        if (!Array.isArray(womMemberships)) throw new Error("Invalid WOM data");

        const { data: allBounties, error: bountiesError } = allBountiesRes;
        if (bountiesError) throw bountiesError;
        const bountyImageMap = new Map();
        allBounties.forEach(bounty => bountyImageMap.set(bounty.id, bounty.image_url));
        const activeBountiesCount = allBounties.filter(b => b.is_active).length;

        const { data: allSubmissions, error: submissionsError } = allSubmissionsRes;
        if (submissionsError) throw submissionsError;
        const submissionsWithImages = allSubmissions.map(submission => { let bounty_image_url = null; if (submission.submission_type === 'bounty' && submission.bounty_id) { bounty_image_url = bountyImageMap.get(submission.bounty_id) || null; } return { ...submission, bounty_image_url }; });
        const approvedSubmissions = allSubmissions.filter(sub => sub.status === 'approved' && sub.submission_type === 'bounty');

        console.log(`Starting to fetch details for ${womMemberships.length} players...`);
        const allPlayerDetails = [];
        const playerIds = womMemberships.map((m: any) => m.player.id).filter(Boolean);
        const batchSize = 15;
        for (let i = 0; i < playerIds.length; i += batchSize) {
            const batch = playerIds.slice(i, i + batchSize);
            console.log(`Fetching batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(playerIds.length / batchSize)}...`);
            try {
                const promises = batch.map((id: number) => womClient.players.getPlayerDetailsById(id));
                const results = await Promise.all(promises);
                allPlayerDetails.push(...results.filter(Boolean));
            } catch (batchError) { console.error(`An error occurred in a fetch batch:`, batchError); }
            if (i + batchSize < playerIds.length) await sleep(1500);
        }

        const upsertData = allPlayerDetails.map(details => ({ wom_player_id: details!.id, wom_details_json: details, last_updated: new Date().toISOString() }));
        if (upsertData.length > 0) {
            const { error: upsertError } = await supabaseAdmin.from('player_details').upsert(upsertData, { onConflict: 'wom_player_id' });
            if (upsertError) console.error("Error upserting player details:", upsertError);
        }

        const playerBountyCounts: { [playerId: number]: PlayerBountyCounts } = {};
        approvedSubmissions.forEach(sub => { if (sub.wom_player_id === null) return; const playerId = sub.wom_player_id; if (!playerBountyCounts[playerId]) playerBountyCounts[playerId] = { low: 0, medium: 0, high: 0, total: 0 }; if (sub.bounty_tier === 'low') playerBountyCounts[playerId].low++; if (sub.bounty_tier === 'medium') playerBountyCounts[playerId].medium++; if (sub.bounty_tier === 'high') playerBountyCounts[playerId].high++; playerBountyCounts[playerId].total++; });

        let clanMembersRanked: ClanMemberRanked[] = [];
        let ehbLeaderboard: { username: string; displayName: string; ehb: number }[] = [];
        let ehpLeaderboard: { username: string; displayName: string; ehp: number }[] = [];
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
          // Preserve the existing spotlight player
          spotlightPlayer: oldClanDataRes.data?.data.spotlightPlayer || null,
        };

        const { error: updateError } = await supabaseAdmin.from('clan_data').update({ data: computedData }).eq('id', 1);
        if (updateError) throw updateError;

        revalidatePath('/');
        return NextResponse.json({ message: `Clan data refreshed successfully.` });

    } catch (error: any) {
        console.error('Refresh API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}