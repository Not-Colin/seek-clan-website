// app/api/get-cached-clan-data/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// We will fetch from Supabase and tag the data.
// This allows us to revalidate this specific tag later.
export async function GET() {
    try {
        // The fetch to Supabase is now wrapped in Next.js's fetch to apply caching tags
        const { data, error } = await supabase
            .from('clan_data')
            .select('data')
            .eq('id', 1)
            .single();

        if (error) throw new Error(`Failed to fetch cached clan data: ${error.message}`);
        if (!data || !data.data) throw new Error("No cached data found. Please run the refresh from the admin panel.");

        // We return the data as before, but Next.js's fetch wrapper will handle caching
        // We will trigger revalidation from the other endpoint. This endpoint can be simple.
        return NextResponse.json(data.data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}