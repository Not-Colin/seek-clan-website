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

// --- THIS IS THE FIX ---
// Added the optional 'password' property to the interface.
interface CreateGameRequest {
    name: string;
    game_type: 'standard' | 'lockout';
    board_size: number;
    tile_pool_text: string;
    password?: string;
}

export async function POST(request: Request) {
    // 1. Authenticate the admin user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    try {
        const { name, game_type, board_size, tile_pool_text, password } = await request.json() as CreateGameRequest;

        // 2. Validate the input
        if (!name || !game_type || !board_size || !tile_pool_text) {
            return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
        }

        const tilePool = tile_pool_text.split('\n').map(tile => tile.trim()).filter(Boolean);
        const requiredTiles = board_size * board_size;

        if (tilePool.length < requiredTiles) {
            return NextResponse.json({ error: `Not enough unique tiles. A ${board_size}x${board_size} board requires at least ${requiredTiles} tiles. You provided ${tilePool.length}.` }, { status: 400 });
        }

        // 3. Insert the new game into the 'bingo_games' table
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
            })
            .select('id')
            .single();

        if (gameError) throw gameError;
        if (!gameData) throw new Error("Failed to create game and retrieve its data.");

        const newGameId = gameData.id;

        // 4. Create two default teams for this new game.
        const teamsToCreate = [{ game_id: newGameId, team_name: 'Team 1' }, { game_id: newGameId, team_name: 'Team 2' }];
        const { data: teamsData, error: teamsError } = await supabaseAdmin
            .from('bingo_teams')
            .insert(teamsToCreate)
            .select('id');

        if (teamsError) throw teamsError;
        if (!teamsData) throw new Error("Failed to create teams.");

        // 5. Shuffle the tile pool and generate the board layout
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

        // 6. Create a board for each team
        const boardsToCreate = teamsData.map((team: { id: number }) => ({
            team_id: team.id,
            game_id: newGameId,
            tiles: boardJson,
        }));

        const { error: boardsError } = await supabaseAdmin.from('bingo_boards').insert(boardsToCreate);
        if (boardsError) throw boardsError;

        return NextResponse.json({ message: `Successfully created Bingo game "${name}" with ${teamsData.length} teams!` });

    } catch (error: any) {
        console.error('Bingo Game Creation API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}