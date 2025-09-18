// app/api/admin/bingo/manage-submission/route.ts (FINAL, ATOMIC VERSION)

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

async function checkForWinnerAndArchive(
    supabaseAdmin: any,
    game: { id: number; game_type: string; board_size: number; },
    board_id: number
) {
    const { data: boardData } = await supabaseAdmin.from('bingo_boards').select('tiles').eq('id', board_id).single();
    if (!boardData) return false;

    const tiles = boardData.tiles as any[];
    const totalTiles = game.board_size * game.board_size;
    const approvedTiles = tiles.filter(t => t.status === 'approved');

    let isWinner = false;

    if (game.game_type === 'standard' && approvedTiles.length === totalTiles) {
        isWinner = true;
    }

    if (game.game_type === 'lockout') {
        const tilesToWin = Math.floor(totalTiles / 2) + 1;
        const teamScores: { [key: number]: number } = {};
        approvedTiles.forEach(tile => {
            if (tile.claimed_by_team) {
                teamScores[tile.claimed_by_team] = (teamScores[tile.claimed_by_team] || 0) + 1;
            }
        });
        for (const teamId in teamScores) {
            if (teamScores[teamId] >= tilesToWin) {
                isWinner = true;
                break;
            }
        }
    }

    if (isWinner) {
        console.log(`Winner detected for game ID ${game.id}. Archiving game.`);
        await supabaseAdmin.from('bingo_games').update({ is_active: false }).eq('id', game.id);
        return true;
    }

    return false;
}

export async function POST(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const userClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await userClient.auth.getUser(token);
    if (!user) { return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 }); }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    try {
        const { submissionId, newStatus } = await request.json();
        if (!submissionId || !newStatus || !['approved', 'rejected'].includes(newStatus)) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        if (newStatus === 'rejected') {
            await supabaseAdmin.from('bingo_submissions').update({ status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', submissionId);
            return NextResponse.json({ message: 'Submission rejected.' });
        }

        const { data: submission, error: submissionError } = await supabaseAdmin
            .from('bingo_submissions')
            .select('game_id, team_id, player_id, tile_position, proof_image_url')
            .eq('id', submissionId)
            .single();

        if (submissionError || !submission) throw new Error(`Could not find submission with ID ${submissionId}.`);

        const { data: game, error: gameError } = await supabaseAdmin
            .from('bingo_games')
            .select('id, game_type, board_size')
            .eq('id', submission.game_id)
            .single();

        if (gameError || !game) throw new Error(`The game with ID ${submission.game_id} does not exist.`);

        const { data: playerData, error: playerError } = await supabaseAdmin.from('player_details').select('wom_details_json->>username').eq('wom_player_id', submission.player_id).single();
        if (playerError || !playerData) throw new Error(`Player not found with WOM ID: ${submission.player_id}`);
        const playerName = (playerData as any).username;

        let boardIdToUpdate: number | null = null;
        if (game.game_type === 'lockout') {
            const { data: lockoutBoard } = await supabaseAdmin.from('bingo_boards').select('id').eq('game_id', game.id).limit(1).single();
            if (!lockoutBoard) throw new Error(`Could not find the shared board for lockout game ID: ${game.id}`);
            boardIdToUpdate = lockoutBoard.id;
        } else {
            const { data: teamBoardData } = await supabaseAdmin.from('bingo_boards').select('id').eq('team_id', submission.team_id).single();
            if (!teamBoardData) throw new Error(`Board not found for team ID: ${submission.team_id}`);
            boardIdToUpdate = teamBoardData.id;
        }

        if (!boardIdToUpdate) throw new Error('Could not determine which bingo board to update.');

        // --- THIS IS THE KEY PART ---
        // Instead of fetching/modifying/saving the tiles array in JavaScript,
        // we call the database function `update_bingo_tile` to do it atomically.
        const { error: rpcError } = await supabaseAdmin.rpc('update_bingo_tile', {
            p_board_id: boardIdToUpdate,
            p_tile_position: submission.tile_position,
            p_new_status: 'approved',
            p_player_name: playerName,
            p_team_id: submission.team_id,
            p_proof_url: submission.proof_image_url
        });

        if (rpcError) throw new Error(`Database function error: ${rpcError.message}`);

        // Update submission status and team score
        await Promise.all([
            supabaseAdmin.from('bingo_submissions').update({ status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', submissionId),
            supabaseAdmin.rpc('increment_team_score', { team_id_to_update: submission.team_id, increment_value: 1 }),
        ]);

        const winnerDeclared = await checkForWinnerAndArchive(supabaseAdmin, game, boardIdToUpdate);
        let message = 'Submission approved and board updated!';
        if (winnerDeclared) {
            message = 'Submission approved, and a winner has been declared! The game is now archived.';
        }
        return NextResponse.json({ message });
    } catch (error: any) {
        console.error('Error managing bingo submission:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}