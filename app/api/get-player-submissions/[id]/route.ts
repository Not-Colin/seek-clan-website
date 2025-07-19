// app/api/get-player-submissions/[id]/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This is the definitive version that avoids the `params` object entirely
// to satisfy the strict Next.js linter.
export async function GET(request: Request) {
  try {
    // We will parse the ID directly from the request URL.
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const idString = pathSegments[pathSegments.length - 1]; // Get the last segment

    const playerId = parseInt(idString, 10);

    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player ID in URL' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('wom_player_id', playerId)
      .eq('status', 'approved')
      .eq('submission_type', 'personal_best')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching player submissions:", error);
      return NextResponse.json({ error: 'Submissions not found or error fetching.' }, { status: 404 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("An unexpected error occurred in the API route:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}