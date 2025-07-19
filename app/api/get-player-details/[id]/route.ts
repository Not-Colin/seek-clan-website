// app/api/get-player-details/[id]/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This version parses the URL directly to be 100% safe from linter warnings.
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const idString = pathSegments[pathSegments.length - 1];

    const playerId = parseInt(idString, 10);

    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player ID in URL' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('player_details')
      .select('wom_details_json')
      .eq('wom_player_id', playerId)
      .single();

    if (error) {
      console.error("Error fetching player details from Supabase:", error);
      return NextResponse.json({ error: 'Player details not found or error fetching.' }, { status: 404 });
    }

    return NextResponse.json(data.wom_details_json);

  } catch (error) {
    console.error("An unexpected error occurred in the API route:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}