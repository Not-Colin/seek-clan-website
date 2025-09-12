// app/api/sync-wom-data/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WOMClient } from '@wise-old-man/utils';

// Rate limit: 20 requests per 60 seconds = 1 request every 3 seconds.
// We'll use 4.5 seconds to be extra safe.
const API_DELAY_MS = 4500;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
    // Authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const womClient = new WOMClient();

    try {
        const womGroupIdString = process.env.WOM_GROUP_ID;
        const WOM_GROUP_ID = parseInt(womGroupIdString?.trim() || '0', 10);
        if (isNaN(WOM_GROUP_ID) || WOM_GROUP_ID !== 5622) return NextResponse.json({ error: `Invalid WOM_GROUP_ID` }, { status: 500 });

        // 1. Get the list of members from WOM
        const groupRes = await fetch(`https://api.wiseoldman.net/v2/groups/${WOM_GROUP_ID}`);
        if (!groupRes.ok) throw new Error(`Failed WOM group fetch: ${groupRes.status}`);
        const groupData = await groupRes.json();
        const womMemberships = groupData.memberships;
        if (!Array.isArray(womMemberships)) throw new Error("Invalid WOM group data");

        const playerIds = womMemberships.map((m: any) => m.player.id).filter(Boolean);
        console.log(`Starting slow sync for ${playerIds.length} players...`);

        // 2. Fetch and update ONE player at a time with a safe delay
        for (let i = 0; i < playerIds.length; i++) {
            const id = playerIds[i];
            try {
                const details = await womClient.players.getPlayerDetailsById(id);
                if (details) {
                    await supabaseAdmin.from('player_details').upsert(
                        { wom_player_id: details.id, wom_details_json: details, last_updated: new Date().toISOString() },
                        { onConflict: 'wom_player_id' }
                    );
                    console.log(`Synced player ${i + 1}/${playerIds.length}: ${details.displayName}`);
                }
            } catch (playerError) {
                console.error(`Failed to sync player ID ${id}. Skipping.`, playerError);
            }
            // Wait AFTER every attempt, successful or not
            await sleep(API_DELAY_MS);
        }

        return NextResponse.json({ message: `WOM Sync complete. Synced data for ${playerIds.length} players.` });

    } catch (error: any) {
        console.error('WOM Sync API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}