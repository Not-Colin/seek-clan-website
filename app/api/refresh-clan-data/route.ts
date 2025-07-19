// app/api/refresh-clan-data/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// NOTE: We no longer need the @wise-old-man/utils client for this file.

interface PlayerBountyCounts { low: number; medium: number; high: number; total: number; }
interface ClanMemberRanked { id: number; username: string; displayName: string; ehb: number; ehp: number; accountType: string; ttm: number; bounties: PlayerBountyCounts; currentRank: string; rankOrder: number; requirementsMet: string[]; nextRankRequirements: string[]; }

const RANK_DEFINITIONS = [
    { name: "Infernal", order: 10, criteria: [ { type: "total_bounties", min: 12 }, { type: "high_bounties", min: 3 }, { type: "ehb", min: 1000 }, ]},
    { name: "Zenyte", order: 9, criteria: [ { type: "total_bounties", min: 9 }, { type: "high_bounties", min: 3 }, { type: "ehb", min: 1000 }, ]},
    { name: "Onyx", order: 8, criteria: [ { type: "total_bounties", min: 7 }, { type: "high_bounties", min: 2 }, { type: "ehb", min: 750 }, ]},
    { name: "Dragonstone", order: 7, criteria: [ { type: "total_bounties", min: 5 }, { type: "high_bounties", min: 1 }, { type: "ehb", min: 500 }, ]},
    { name: "Diamond", order: 6, criteria: [ { type: "total_bounties", min: 4 }, { type: "medium_bounties", min: 2 }, { type: "ehb", min: 250 }, ]},
    { name: "Ruby", order: 5, criteria: [ { type: "total_bounties", min: 3 }, { type: "medium_bounties", min: 1 }, { type: "ehb", min: 100 }, ]},
    { name: "Emerald", order: 4, criteria: [ { type: "total_bounties", min: 2 }, { type: "ehb", min: 50 }, ]},
    { name: "Sapphire", order: 3, criteria: [ { type: "total_bounties", min: 1 }, { type: "ehb", min: 25 }, ]},
    { name: "Opal", order: 2, criteria: [ { type: "ehb", min: 10 }, ]},
    { name: "Backpack", order: 1, criteria: [] },
];

const SPECIAL_ROLES = new Set(['owner', 'deputy_owner', 'bandosian', 'minion']);
const ROLE_DISPLAY_NAMES: { [key: string]: string } = { owner: 'Clan Owner', deputy_owner: 'Deputy Owner', bandosian: 'Administrator', minion: 'Alternate Account' };
const ROLE_SORT_ORDER: { [key: string]: number } = { minion: -1, bandosian: -2, owner: -3, deputy_owner: -3 };

function getPlayerRank(playerStats: { ehb: number; }, bountyCounts: PlayerBountyCounts): { rank: string; order: number; next: string[] } {
    let currentRank = "Backpack"; let currentOrder = 1; let nextRankRequirements: string[] = [];
    for (const rankDef of RANK_DEFINITIONS) {
        if (!rankDef.criteria) continue;
        const meetsAll = rankDef.criteria.every(c => {
            switch(c.type) {
                case "total_bounties": return bountyCounts.total >= c.min;
                case "medium_bounties": return bountyCounts.medium >= c.min;
                case "high_bounties": return bountyCounts.high >= c.min;
                case "ehb": return playerStats.ehb >= c.min;
                default: return false;
            }
        });
        if (meetsAll) { currentRank = rankDef.name; currentOrder = rankDef.order; break; }
    }
    const nextRankDef = RANK_DEFINITIONS.find(r => r.order === currentOrder + 1);
    if (nextRankDef) {
        nextRankDef.criteria.forEach(c => {
            let needed = 0;
            switch(c.type) {
                case "total_bounties": if (bountyCounts.total < c.min) { needed = c.min - bountyCounts.total; nextRankRequirements.push(`Claim ${needed} more bounty/ies`);} break;
                case "medium_bounties": if (bountyCounts.medium < c.min) { needed = c.min - bountyCounts.medium; nextRankRequirements.push(`Claim ${needed} more Medium bounty/ies`);} break;
                case "high_bounties": if (bountyCounts.high < c.min) { needed = c.min - bountyCounts.high; nextRankRequirements.push(`Claim ${needed} more High bounty/ies`);} break;
                case "ehb": if (playerStats.ehb < c.min) { needed = c.min - playerStats.ehb; nextRankRequirements.push(`Gain ${Math.ceil(needed).toLocaleString()} more EHB`);} break;
            }
        });
        if (nextRankRequirements.length === 0) nextRankRequirements.push(`All requirements met for ${nextRankDef.name}!`);
    } else {
        nextRankRequirements.push("You are at the highest rank!");
    }
    return { rank: currentRank, order: currentOrder, next: nextRankRequirements };
}

export async function POST(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const womGroupIdString = process.env.WOM_GROUP_ID;
    const WOM_GROUP_ID = parseInt(womGroupIdString?.trim() || '0', 10);
    if (isNaN(WOM_GROUP_ID) || WOM_GROUP_ID !== 5622) return NextResponse.json({ error: `Invalid WOM_GROUP_ID` }, { status: 500 });

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const womUrl = `https://api.wiseoldman.net/v2/groups/${WOM_GROUP_ID}`;

    try {
        const [groupRes, submissionsRes] = await Promise.all([
            fetch(womUrl), // This is now our ONLY call to the WOM API
            supabaseAdmin.from('submissions').select('wom_player_id, bounty_tier').eq('status', 'approved').eq('submission_type', 'bounty'),
        ]);

        if (!groupRes.ok) throw new Error(`Failed WOM fetch: ${groupRes.status}`);
        const groupData = await groupRes.json();
        const womMemberships = groupData.memberships;
        if (!Array.isArray(womMemberships)) throw new Error("Invalid WOM data");

        const { data: approvedSubmissions, error: submissionsError } = submissionsRes;
        if (submissionsError) throw submissionsError;

        // --- OPTIMIZED: Use the detailed player data that's already in the response ---
        const upsertData = womMemberships
            .filter((m: any) => m.player) // Filter out any invalid members
            .map((m: any) => ({
                wom_player_id: m.player.id,
                wom_details_json: m.player, // The full player object is already here!
                last_updated: new Date().toISOString(),
            }));

        if (upsertData.length > 0) {
            const { error: upsertError } = await supabaseAdmin.from('player_details').upsert(upsertData, { onConflict: 'wom_player_id' });
            if (upsertError) console.error("Error upserting player details:", upsertError);
        }

        const playerBountyCounts: { [playerId: number]: PlayerBountyCounts } = {};
        approvedSubmissions.forEach(sub => {
          if (sub.wom_player_id === null) return;
          const playerId = sub.wom_player_id;
          if (!playerBountyCounts[playerId]) playerBountyCounts[playerId] = { low: 0, medium: 0, high: 0, total: 0 };
          if (sub.bounty_tier === 'low') playerBountyCounts[playerId].low++;
          if (sub.bounty_tier === 'medium') playerBountyCounts[playerId].medium++;
          if (sub.bounty_tier === 'high') playerBountyCounts[playerId].high++;
          playerBountyCounts[playerId].total++;
        });

        let clanMembersRanked: ClanMemberRanked[] = [];
        let ehbLeaderboard: { username: string; displayName: string; ehb: number }[] = [];
        let ehpLeaderboard: { username: string; displayName: string; ehp: number }[] = [];

        womMemberships.forEach((membership: any) => {
            const player = membership.player;
            if (!player) return;

            const playerId = player.id;
            const username = player.username;
            const displayName = player.displayName;
            const ehb = Math.round(player.ehb || 0);
            const ehp = Math.round(player.ehp || 0);
            const ttm = Math.round(player.ttm || 0);
            const accountType = player.type || 'unknown';
            const role = membership.role || 'member';

            ehbLeaderboard.push({ username, displayName, ehb });
            ehpLeaderboard.push({ username, displayName, ehp });

            if (SPECIAL_ROLES.has(role)) {
                clanMembersRanked.push({ id: playerId, username, displayName, ehb, ehp, accountType, ttm, bounties: { low: 0, medium: 0, high: 0, total: 0 }, currentRank: ROLE_DISPLAY_NAMES[role] || role, rankOrder: ROLE_SORT_ORDER[role] || -99, requirementsMet: [], nextRankRequirements: ["N/A for this role"], });
                return;
            }

            const bounties = playerBountyCounts[playerId] || { low: 0, medium: 0, high: 0, total: 0 };
            const { rank, order, next } = getPlayerRank({ ehb }, bounties);

            clanMembersRanked.push({ id: playerId, username, displayName, ehb, ehp, accountType, ttm, bounties, currentRank: rank, rankOrder: order, requirementsMet: [], nextRankRequirements: next, });
        });

        ehbLeaderboard.sort((a, b) => b.ehb - a.ehb);
        ehpLeaderboard.sort((a, b) => b.ehp - a.ehp);

        const computedData = {
          totalMembers: womMemberships.length,
          topEHB: ehbLeaderboard.slice(0, 3),
          topEHP: ehpLeaderboard.slice(0, 3),
          rankedPlayers: clanMembersRanked.sort((a, b) => b.rankOrder - a.rankOrder || a.displayName.localeCompare(b.displayName)),
          lastUpdated: new Date().toISOString()
        };

        const { error: updateError } = await supabaseAdmin.from('clan_data').update({ data: computedData }).eq('id', 1);
        if (updateError) throw updateError;

        revalidatePath('/api/get-cached-clan-data');
        revalidatePath('/ranks');
        revalidatePath('/');

        return NextResponse.json({ message: `Clan data refreshed successfully. (1 WOM API Call)` });

    } catch (error: any) {
        console.error('Refresh API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}