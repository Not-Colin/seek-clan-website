import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WOMClient } from '@wise-old-man/utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// RATE LIMIT STRATEGY:
// 1 player per batch.
// The frontend will wait 3.5 seconds between calls.
// 1 req / 3.5s = ~17 requests per minute (Under the limit of 20).
const BATCH_SIZE = 1;
const WOM_GROUP_ID = 5622;

export async function POST(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { startIndex = 0 } = await request.json();

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const womClient = new WOMClient({ userAgent: 'SeekClanApp/1.0' });

    try {
        // 1. Get Group List
        const groupData = await womClient.groups.getGroupDetails(WOM_GROUP_ID);
        const allMembers = groupData.memberships;
        const totalPlayers = allMembers.length;

        // 2. Slice Batch (Just 1 player)
        const membersBatch = allMembers.slice(startIndex, startIndex + BATCH_SIZE);

        if (membersBatch.length === 0) {
            return NextResponse.json({ message: 'Sync complete!', nextIndex: null, progress: 100, isComplete: true });
        }

        console.log(`Processing index: ${startIndex} (Player: ${membersBatch[0].player.username})`);

        // 3. Process the single player
        const member = membersBatch[0];
        try {
            const fullDetails = await womClient.players.getPlayerDetailsById(member.player.id);
            const detailsWithRole = { ...fullDetails, role: member.role };

            await supabaseAdmin.from('player_details').upsert(
                {
                    wom_player_id: member.player.id,
                    wom_details_json: detailsWithRole,
                    updated_at: new Date().toISOString()
                },
                { onConflict: 'wom_player_id' }
            );
        } catch (err) {
            console.error(`Failed to sync player ${member.player.username}`, err);
        }

        // 4. Calculate Next
        const nextIndex = startIndex + BATCH_SIZE;
        const isComplete = nextIndex >= totalPlayers;
        const progress = Math.min(Math.round((nextIndex / totalPlayers) * 100), 100);

        return NextResponse.json({
            message: `Synced ${member.player.username}`,
            nextIndex: isComplete ? null : nextIndex,
            totalPlayers,
            progress,
            isComplete
        });

    } catch (error: any) {
        console.error('Single Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}