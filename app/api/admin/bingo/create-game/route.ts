import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Fixed Interface
interface CreateGameRequest {
    name: string;
    game_type: 'standard' | 'lockout';
    board_size: number;
    tile_pool_text: string;
    password?: string;
    duration_days: number; // Added colon
}

export async function POST(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    try {
        const { name, game_type, board_size, tile_pool_text, password, duration_days } = await request.json() as CreateGameRequest;

        // Added duration check
        if (!name || !game_type || !board_size || !tile_pool_text || duration_days === undefined || duration_days < 0) {
            return NextResponse.json({ error: 'Missing required fields or invalid duration.' }, { status: 400 });
        }

        const tilePool = tile_pool_text.split('\n').map(tile => tile.trim()).filter(Boolean);
        const requiredTiles = board_size * board_size;

        if (tilePool.length < requiredTiles) {
            return NextResponse.json({ error: `Not enough unique tiles. Required: ${requiredTiles}. Provided: ${tilePool.length}.` }, { status: 400 });
        }

        const { data: gameData, error: gameError } = await supabaseAdmin
            .from('bingo_games')
            .insert({
                name,
                game_type,
                board_size,
                tile_pool: tilePool,
                created_by: user.id,
                is_active: true,
                password: password || null,
                start_time: new Date().toISOString(), // Save Start Time
                duration_days: duration_days,        // Save Duration
            })
            .select('id')
            .single();

        if (gameError) throw gameError;

        const newGameId = gameData.id;
        const teamsToCreate = [{ game_id: newGameId, team_name: 'Team 1' }, { game_id: newGameId, team_name: 'Team 2' }];
        const { data: teamsData, error: teamsError } = await supabaseAdmin.from('bingo_teams').insert(teamsToCreate).select('id');
        if (teamsError) throw teamsError;

        const shuffledTiles = shuffleArray(tilePool);
        const boardTiles = shuffledTiles.slice(0, requiredTiles);
        const boardJson = boardTiles.map((tileText, index) => ({
            text: tileText,
            position: index,
            status: 'incomplete',
            claimed_by_team: null,
            claimed_by_player: null,
            claimed_at: null,
        }));

        const boardsToCreate = teamsData.map((team: { id: number }) => ({
            team_id: team.id,
            game_id: newGameId,
            tiles: boardJson,
        }));

        const { error: boardsError } = await supabaseAdmin.from('bingo_boards').insert(boardsToCreate);
        if (boardsError) throw boardsError;

        return NextResponse.json({ message: `Successfully created Bingo game "${name}"!` });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}