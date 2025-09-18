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
        const playerNameFromForm = formData.get('playerName') as string;
        const password = formData.get('password') as string;

        if (!proofFile || !gameId || !teamId || !tileText || !tilePosition || !playerId || !password) {
            return NextResponse.json({ error: 'Missing required submission data.' }, { status: 400 });
        }
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

        // --- START OF IMPLEMENTED CHANGES ---

        // 1. Create a clean data object for the database insert.
        const submissionData = {
            game_id: parseInt(gameId, 10),
            team_id: parseInt(teamId, 10),
            player_id: parseInt(playerId, 10),
            player_name: playerNameFromForm, // 2. Add the player's name here.
            tile_text: tileText,
            tile_position: parseInt(tilePosition, 10),
            proof_image_url: publicUrl,
            status: 'pending' as const,
        };

        console.log("Attempting to insert into 'bingo_submissions':", submissionData);

        // 3. Insert the complete data object.
        const { error: insertError } = await supabaseAdmin.from('bingo_submissions').insert(submissionData);

        // 4. Add robust error checking to prevent silent failures.
        if (insertError) {
            console.error("!!! DATABASE INSERT FAILED !!!:", insertError);
            throw new Error(`Failed to save submission to database: ${insertError.message}`);
        }

        console.log("Database insert successful. Proceeding to notification.");

        // --- END OF IMPLEMENTED CHANGES ---


        // --- SIMPLIFIED NOTIFICATION LOGIC ---
        try {
            const playerName = playerNameFromForm || 'Unknown Player';
            const { data: teamData } = await supabaseAdmin
                .from('bingo_teams')
                .select('team_name')
                .eq('id', teamId)
                .single();
            const teamName = teamData?.team_name || 'Unknown Team';
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

            const notificationPayload = {
                submissionType: 'bingo',
                playerName: playerName,
                teamName: teamName,
                gameName: game.name,
                tileText: tileText,
                proofImageUrl: publicUrl
            };

            const notificationUrl = `${siteUrl}/api/send-notification`;
            await fetch(notificationUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notificationPayload)
            });

        } catch (notificationError) {
            console.error("Failed to gather data for bingo notification (but data was saved):", notificationError);
        }

        return NextResponse.json({ message: 'Tile submitted successfully! An admin will review it shortly.' });

    } catch (error: any) {
        console.error('Bingo Submission API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}