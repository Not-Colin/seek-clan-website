// app/api/get-all-player-details/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 0; // Ensure this data is always fresh

export async function GET() {
    // This is a public-facing route but uses the admin client to get all data.
    // Ensure RLS is in place if you ever make the table more sensitive.
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const { data, error } = await supabaseAdmin
            .from('player_details')
            .select('wom_details_json');

        if (error) {
            throw new Error(`Failed to fetch player details: ${error.message}`);
        }

        // We only want the JSON content, not the outer object
        const allDetails = data.map(p => p.wom_details_json);

        return NextResponse.json(allDetails);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}