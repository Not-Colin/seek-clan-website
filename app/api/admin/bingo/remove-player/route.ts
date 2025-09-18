// app/api/admin/bingo/remove-player/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    // 1. Authenticate the admin user (same as above)
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
        const { team_id, player_id } = await request.json();
        if (!team_id || !player_id) {
            return NextResponse.json({ error: 'Missing team_id or player_id' }, { status: 400 });
        }

        // 2. Use the admin client to perform the delete, bypassing RLS
        const { error } = await supabaseAdmin
            .from('bingo_team_members')
            .delete()
            .match({ team_id, player_id });

        if (error) throw error;

        return NextResponse.json({ message: 'Player removed successfully.' });

    } catch (error: any) {
        console.error('Error removing player from bingo team:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}