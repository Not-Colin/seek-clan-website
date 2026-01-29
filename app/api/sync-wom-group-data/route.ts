import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WOMClient } from '@wise-old-man/utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
        const groupData = await womClient.groups.getGroupDetails(WOM_GROUP_ID);
        const allMembers = groupData.memberships;
        const totalPlayers = allMembers.length;

        const membersBatch = allMembers.slice(startIndex, startIndex + BATCH_SIZE);

        if (membersBatch.length === 0) {
            return NextResponse.json({ message: 'Sync complete!', nextIndex: null, progress: 100, isComplete: true });
        }

        const member = membersBatch[0];
        let wasRateLimited = false;

        try {
            console.log(`Processing index: ${startIndex} (Player: ${member.player.username})`);
            const fullDetails = await womClient.players.getPlayerDetailsById(member.player.id);
            const detailsWithRole = { ...fullDetails, role: member.role };

            await supabaseAdmin.from('player_details').upsert(
                {
                    wom_player_id: member.player.id,
                    wom_details_json: detailsWithRole,
                    last_updated: new Date().toISOString()
                },
                { onConflict: 'wom_player_id' }
            );
        } catch (err: any) {
            console.error(`Failed to sync player ${member.player.username}`, err);
            // Check if it's likely a rate limit error (429) or generic fetch error
            if (err.statusCode === 429 || err.message.includes('Too Many Requests')) {
                wasRateLimited = true;
            }
        }

        // --- THE SELF-HEALING LOGIC ---
        // If we were rate limited, DO NOT advance the index. Tell frontend to retry this one.
        // If success, advance by 1.
        const nextIndex = wasRateLimited ? startIndex : (startIndex + BATCH_SIZE);
        const isComplete = !wasRateLimited && (nextIndex >= totalPlayers);
        const progress = Math.min(Math.round((nextIndex / totalPlayers) * 100), 100);

        return NextResponse.json({
            message: wasRateLimited ? `Rate limited on ${member.player.username}. Retrying...` : `Synced ${member.player.username}`,
            nextIndex: isComplete ? null : nextIndex,
            totalPlayers,
            progress,
            isComplete,
            wasRateLimited // Flag to tell frontend to wait longer
        });

    } catch (error: any) {
        console.error('Single Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}