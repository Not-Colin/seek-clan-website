import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    try {
        const formData = await request.formData();
        const proofFile = formData.get('proofFile') as File;
        const gameId = formData.get('gameId') as string;
        const teamId = formData.get('teamId') as string;
        const tileText = formData.get('tileText') as string;
        const tilePosition = formData.get('tilePosition') as string;
        const playerId = formData.get('playerId') as string;
        const password = formData.get('password') as string;

        // --- ADDING A LOG HERE TO VERIFY THE PLAYER ID ---
        console.log(`Bingo submission started for player ID: ${playerId}`);

        if (!proofFile || !gameId || !teamId || !tileText || !tilePosition || !playerId || !password) {
            return NextResponse.json({ error: 'Missing required submission data.' }, { status: 400 });
        }
        // ... (rest of the validation and upload logic remains the same) ...
        const { data: game, error: gameError } = await supabaseAdmin.from('bingo_games').select('password, name').eq('id', gameId).single();
        if (gameError || !game) throw new Error('Could not find the specified bingo game.');
        if (game.password && game.password !== password) {
            return NextResponse.json({ error: 'Invalid password for this bingo game.' }, { status: 401 });
        }
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${gameId}-${teamId}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabaseAdmin.storage.from('bingo-proofs').upload(fileName, proofFile);
        if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);
        const { data: { publicUrl } } = supabaseAdmin.storage.from('bingo-proofs').getPublicUrl(fileName);
        const { error: insertError } = await supabaseAdmin.from('bingo_submissions').insert({
            game_id: parseInt(gameId, 10), team_id: parseInt(teamId, 10), player_id: parseInt(playerId, 10),
            tile_text: tileText, tile_position: parseInt(tilePosition, 10), proof_image_url: publicUrl, status: 'pending',
        });
        if (insertError) throw insertError;

        // --- MODIFIED NOTIFICATION LOGIC WITH DEBUGGING ---
        try {
            // 1. THE QUERY FIX: We tell Supabase to select the 'username' key from the 'wom_details_json' column.
            const playerQuery = supabaseAdmin
                .from('player_details')
                .select('wom_details_json->>username')
                .eq('wom_player_id', parseInt(playerId, 10))
                .single();

            const teamQuery = supabaseAdmin
                .from('bingo_teams')
                .select('team_name')
                .eq('id', teamId)
                .single();

            const [playerRes, teamRes] = await Promise.all([playerQuery, teamQuery]);

            // 2. THE DATA ACCESS FIX: The key in the returned object will be the exact string from the select.
            //    We must use bracket notation because the key contains special characters (->>).
            const playerName = (playerRes.data as any)?.['wom_details_json->>username'] || 'Unknown Player';
            const teamName = teamRes.data?.team_name || 'Unknown Team';
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

            const notificationPayload = {
                submissionType: 'bingo',
                playerName: playerName,
                teamName: teamName,
                gameName: game.name,
                tileText: tileText,
                proofImageUrl: publicUrl
            };

            // The rest of the logic remains the same.
            const notificationUrl = `${siteUrl}/api/send-notification`;
            const notificationResponse = await fetch(notificationUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notificationPayload)
            });

            if (!notificationResponse.ok) {
                const errorBody = await notificationResponse.text();
                console.error(`ERROR: Notification dispatch to ${notificationUrl} failed!`);
                console.error(`Status: ${notificationResponse.status} ${notificationResponse.statusText}`);
                console.error(`Response Body: ${errorBody}`);
            } else {
                console.log("SUCCESS: Notification dispatch was successful.");
            }

        } catch (notificationError) {
            console.error("CRITICAL ERROR: Failed to gather data for or dispatch bingo notification:", notificationError);
        }

        return NextResponse.json({ message: 'Tile submitted successfully! An admin will review it shortly.' });

    } catch (error: any) {
        console.error('Bingo Submission API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}