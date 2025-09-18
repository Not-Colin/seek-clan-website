// app/api/bingo/submit-tile/route.ts (PASSWORD-BASED)

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    // Use the admin client for all operations
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    try {
        const formData = await request.formData();
        const proofFile = formData.get('proofFile') as File;
        const gameId = formData.get('gameId') as string;
        const teamId = formData.get('teamId') as string;
        const tileText = formData.get('tileText') as string;
        const tilePosition = formData.get('tilePosition') as string;
        const playerId = formData.get('playerId') as string;
        const password = formData.get('password') as string; // Password from the form

        if (!proofFile || !gameId || !teamId || !tileText || !tilePosition || !playerId || !password) {
            return NextResponse.json({ error: 'Missing required submission data.' }, { status: 400 });
        }

        // 1. Fetch the specific game's password
        const { data: game, error: gameError } = await supabaseAdmin
            .from('bingo_games')
            .select('password')
            .eq('id', gameId)
            .single();

        if (gameError || !game) throw new Error('Could not find the specified bingo game.');

        // 2. Validate the password
        if (game.password && game.password !== password) {
            return NextResponse.json({ error: 'Invalid password for this bingo game.' }, { status: 401 });
        }

        // 3. Upload the image to Supabase Storage
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${gameId}-${teamId}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabaseAdmin.storage
            .from('bingo-proofs')
            .upload(fileName, proofFile);

        if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

        // 4. Get the public URL of the uploaded image
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('bingo-proofs')
            .getPublicUrl(fileName);

        // 5. Insert the submission record into the database
        const { error: insertError } = await supabaseAdmin
            .from('bingo_submissions')
            .insert({
                game_id: parseInt(gameId, 10),
                team_id: parseInt(teamId, 10),
                player_id: parseInt(playerId, 10),
                tile_text: tileText,
                tile_position: parseInt(tilePosition, 10),
                proof_image_url: publicUrl,
                status: 'pending',
            });

        if (insertError) throw insertError;

        return NextResponse.json({ message: 'Tile submitted successfully! An admin will review it shortly.' });

    } catch (error: any) {
        console.error('Bingo Submission API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}