import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WOMClient } from '@wise-old-man/utils';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';
// Allow 60 seconds max execution (batches usually take 2-3 seconds)
export const maxDuration = 60;

const BATCH_SIZE = 5; // Process 5 players at a time
const WOM_GROUP_ID = 5622; // Your Group ID

export async function POST(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    // 1. Get the starting position from the browser
    const { startIndex = 0 } = await request.json();

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const womClient = new WOMClient();

    try {
        // 2. Fetch the full group list to get IDs
        // This is fast and cheap to do on every request
        const groupData = await womClient.groups.getGroupDetails(WOM_GROUP_ID);
        const allMembers = groupData.memberships;
        const totalPlayers = allMembers.length;

        // 3. Grab ONLY the next 5 players
        const membersBatch = allMembers.slice(startIndex, startIndex + BATCH_SIZE);

        // If no members left in this batch, we are done.
        if (membersBatch.length === 0) {
            return NextResponse.json({
                message: 'Sync complete!',
                nextIndex: null,
                progress: 100,
                isComplete: true
            });
        }

        console.log(`Processing batch: ${startIndex} to ${startIndex + membersBatch.length}`);

        // 4. Fetch details for these 5 players in parallel
        // This gets the FULL SNAPSHOT (EHB, Boss Kills, etc)
        const upsertPromises = membersBatch.map(async (member) => {
            try {
                const fullDetails = await womClient.players.getPlayerDetailsById(member.player.id);

                // IMPORTANT: Inject the role so your rank calculator works
                const detailsWithRole = { ...fullDetails, role: member.role };

                return supabaseAdmin.from('player_details').upsert(
                    {
                        wom_player_id: member.player.id,
                        wom_details_json: detailsWithRole,
                        updated_at: new Date().toISOString()
                    },
                    { onConflict: 'wom_player_id' }
                );
            } catch (err) {
                console.error(`Failed to sync player ${member.player.username}`, err);
                return null; // Skip errors so one failure doesn't stop the batch
            }
        });

        await Promise.all(upsertPromises);

        // 5. Calculate where to start next time
        const nextIndex = startIndex + BATCH_SIZE;
        const isComplete = nextIndex >= totalPlayers;
        const progress = Math.min(Math.round((nextIndex / totalPlayers) * 100), 100);

        // 6. Respond to browser
        return NextResponse.json({
            message: `Synced ${membersBatch.length} players...`,
            nextIndex: isComplete ? null : nextIndex,
            totalPlayers,
            progress,
            isComplete
        });

    } catch (error: any) {
        console.error('Batch Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}