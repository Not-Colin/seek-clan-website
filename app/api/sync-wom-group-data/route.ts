import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WOMClient } from '@wise-old-man/utils';

// --- CONFIGURATION ---
const BATCH_SIZE = 2;
const API_DELAY_MS = 4500;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { startIndex = 0 } = await request.json();

    try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { data: { user } } = await supabase.auth.getUser(token);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        processBatch(startIndex, token, new URL(request.url).origin);

        return NextResponse.json({
            message: `Sync initiated. This will run in the background and may take several minutes. You can leave this page.`
        });
    } catch (error: any) {
        console.error('Initial Batch Sync API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function processBatch(startIndex: number, token: string, baseUrl: string) {
    console.log(`--- Processing batch starting at index: ${startIndex} ---`);
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const womClient = new WOMClient();

    try {
        const womGroupIdString = process.env.WOM_GROUP_ID;
        const WOM_GROUP_ID = parseInt(womGroupIdString?.trim() || '0', 10);

        const groupData = await womClient.groups.getGroupDetails(WOM_GROUP_ID);
        const playerIds = groupData.memberships.map(m => m.player.id);
        const totalPlayers = playerIds.length;

        if (startIndex >= totalPlayers) {
            console.log('--- Full sync complete. All players processed. ---');
            return;
        }

        const batchIds = playerIds.slice(startIndex, startIndex + BATCH_SIZE);
        console.log(`Processing player IDs: ${batchIds.join(', ')}`);

        for (const id of batchIds) {
            try {
                const details = await womClient.players.getPlayerDetailsById(id);
                if (details) {
                    await supabaseAdmin.from('player_details').upsert(
                        { wom_player_id: details.id, wom_details_json: details, last_updated: new Date().toISOString() },
                        { onConflict: 'wom_player_id' }
                    );
                    console.log(`Successfully synced player: ${details.displayName}`);
                }
            } catch (playerError) {
                console.error(`Failed to sync player ID ${id}. Skipping.`, playerError);
            }
            await sleep(API_DELAY_MS);
        }

        const nextIndex = startIndex + BATCH_SIZE;
        if (nextIndex < totalPlayers) {
            console.log(`Batch complete. Triggering next batch at index ${nextIndex}.`);
            fetch(`${baseUrl}/api/sync-wom-group-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ startIndex: nextIndex })
            });
        } else {
             console.log('--- Final batch processed. Sync complete. ---');
             // --- THE NEW CODE IS HERE ---
             // When the final batch is done, send a notification.
             const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.seekosrs.com';
             const message = `The background sync of all **${totalPlayers}** clan members from Wise Old Man has successfully finished.`;
             const description = `You can now go to the [Admin Panel](${siteUrl}/admin) and press **"Calculate Ranks Now"** to update the public ranks page.`;
             await sendDiscordNotification(message, description);
             // --- END OF NEW CODE ---
        }

    } catch (batchError) {
        console.error(`--- CRITICAL ERROR in batch starting at ${startIndex}:`, batchError, `---`);
    }
}


// --- NEW HELPER FUNCTION TO SEND DISCORD NOTIFICATION ---
async function sendDiscordNotification(message: string, description: string) {
    const webhookUrl = process.env.NEXT_PUBLIC_DISCORD_ADMIN_WEBHOOK_URL;
    if (!webhookUrl) {
        console.error("Discord admin webhook URL is not configured. Cannot send completion notification.");
        return;
    }

    const embed = {
        title: '✅ WOM Sync Complete',
        description: `${message}\n\n${description}`,
        color: 3066993, // Green
        timestamp: new Date().toISOString(),
        footer: {
            text: 'Seek Admin System'
        }
    };

    const payload = {
        username: 'Seek Admin Alerts',
        avatar_url: 'https://ieciglsbyflhbixlbxmw.supabase.co/storage/v1/object/public/assets/seek-icon.png',
        embeds: [embed]
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`Discord API Error: ${response.statusText}`, await response.text());
        } else {
            console.log("Successfully sent completion notification to Discord.");
        }
    } catch (error) {
        console.error("Failed to send Discord notification:", error);
    }
}