// app/api/admin/bingo/set-game-status/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
        const { gameId, isActive } = await request.json();

        if (gameId === undefined || isActive === undefined) {
            return NextResponse.json({ error: 'Missing gameId or isActive status' }, { status: 400 });
        }

        // 2. Update the bingo_games table
        const { error } = await supabaseAdmin
            .from('bingo_games')
            .update({ is_active: isActive })
            .eq('id', gameId);

        if (error) throw error;

        const status = isActive ? "re-activated" : "archived";
        return NextResponse.json({ message: `Game successfully ${status}.` });

    } catch (error: any) {
        console.error('Error setting bingo game status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}