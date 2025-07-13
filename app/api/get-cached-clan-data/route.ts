// app/api/get-cached-clan-data/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// This is a public endpoint that fetches the pre-computed data from the clan_data table.
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('clan_data')
            .select('data')
            .eq('id', 1)
            .single();

        if (error) {
            throw new Error(`Failed to fetch cached clan data: ${error.message}`);
        }

        if (!data || !data.data) {
             throw new Error("No cached data found. Please run the refresh from the admin panel.");
        }

        return NextResponse.json(data.data);

    } catch (error: any) {
        console.error('Get Cached Data API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}