// app/api/bingo/[gameId]/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request
) {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const gameIdString = pathSegments[pathSegments.length - 1];
    const gameId = parseInt(gameIdString, 10);

    if (isNaN(gameId)) {
        return NextResponse.json({ error: 'Invalid game ID in URL' }, { status: 400 });
    }

    // Use service role key to ensure we get all data needed for the board
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const { data: gameData, error: gameError } = await supabaseAdmin
            .from('bingo_games')
            .select(`
                id, name, game_type, board_size, is_active,
                start_time, duration_days,
                bingo_teams (
                    id, team_name, score,
                    bingo_team_members (
                        player_details ( wom_player_id, wom_details_json )
                    )
                )
            `) // Added start_time and duration_days above
            .eq('id', gameId)
            .order('id', { foreignTable: 'bingo_teams', ascending: true })
            .single();

        if (gameError) throw gameError;
        if (!gameData) {
            return NextResponse.json({ error: 'Bingo game not found.' }, { status: 404 });
        }

        const { data: boardsData, error: boardsError } = await supabaseAdmin
            .from('bingo_boards')
            .select('id, team_id, tiles')
            .eq('game_id', gameId);

        if (boardsError) throw boardsError;

        if (gameData.game_type === 'lockout' && boardsData.length > 0) {
            (gameData as any).shared_board = boardsData[0];
        } else {
            const boardsMap = new Map();
            boardsData.forEach(board => boardsMap.set(board.team_id, board));

            const teamsWithBoards = gameData.bingo_teams.map((team: any) => ({
                ...team,
                board: boardsMap.get(team.id) || null
            }));

            (gameData as any).bingo_teams = teamsWithBoards;
        }

        return NextResponse.json(gameData);

    } catch (error: any) {
        console.error('Error fetching bingo game data:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}