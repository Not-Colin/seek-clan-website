// app/api/sync-wom-group-data/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    // 1. Authenticate the admin user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    try {
        const womGroupIdString = process.env.WOM_GROUP_ID;
        const WOM_GROUP_ID = parseInt(womGroupIdString?.trim() || '0', 10);
        if (isNaN(WOM_GROUP_ID) || WOM_GROUP_ID !== 5622) {
            return NextResponse.json({ error: `Invalid WOM_GROUP_ID` }, { status: 500 });
        }

        // 2. Make ONE fast call to the WOM Group API
        console.log(`Fetching bulk data for WOM Group ID: ${WOM_GROUP_ID}`);
        const groupResponse = await fetch(`https://api.wiseoldman.net/v2/groups/${WOM_GROUP_ID}`);
        if (!groupResponse.ok) {
            throw new Error(`Failed to fetch WOM group data: ${groupResponse.statusText}`);
        }
        const groupData = await groupResponse.json();
        const womMemberships = groupData.memberships;

        if (!Array.isArray(womMemberships) || womMemberships.length === 0) {
            throw new Error("No membership data found in WOM API response.");
        }

        console.log(`Found ${womMemberships.length} members. Preparing to upsert into player_details.`);

        // 3. Prepare the data for our 'player_details' table
        const playersToUpsert = womMemberships.map((membership: any) => ({
            wom_player_id: membership.player.id,
            wom_details_json: membership.player, // The full player object
            last_updated: new Date().toISOString()
        }));

        // 4. Upsert all players into the database in a single batch operation
        const { error: upsertError } = await supabaseAdmin
            .from('player_details')
            .upsert(playersToUpsert, { onConflict: 'wom_player_id' });

        if (upsertError) {
            console.error("Supabase upsert error:", upsertError);
            throw new Error(`Failed to save player data to the database: ${upsertError.message}`);
        }

        console.log(`Successfully synced ${playersToUpsert.length} players.`);

        return NextResponse.json({
            message: `Sync complete. Synced data for ${playersToUpsert.length} players from the group.`
        });

    } catch (error: any) {
        console.error('WOM Group Sync API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}