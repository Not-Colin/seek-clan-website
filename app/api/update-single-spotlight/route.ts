// app/api/update-single-spotlight/route.ts
// **FINAL BUILD FIX: Moved 'ignoreHTTPSErrors' from launch() to goto()**

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import puppeteerDev from 'puppeteer';

async function generateAndUpdatePlayer(playerId: number, supabaseAdmin: any) {
    const { data: player, error: playerError } = await supabaseAdmin.from('player_details').select('wom_player_id, wom_details_json').eq('wom_player_id', playerId).single();
    if (playerError || !player) throw new Error(`Player with ID ${playerId} not found.`);
    const displayName = player.wom_details_json?.displayName;
    if (!displayName) throw new Error(`Player ${playerId} has no displayName.`);

    let browser = null;
    try {
        const formattedUsername = encodeURIComponent(displayName);
        const profileUrl = `https://www.runeprofile.com/${formattedUsername}`;

        if (process.env.NODE_ENV === 'development') {
            browser = await puppeteerDev.launch({ headless: true });
        } else {
            // --- STEP 1: REMOVED from here ---
            browser = await puppeteer.launch({
                args: chromium.args,
                executablePath: await chromium.executablePath(),
                headless: true
            });
        }

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // --- STEP 2: ADDED here ---
        await page.goto(profileUrl, {
            waitUntil: 'networkidle0',
            timeout: 30000,
            ignoreHTTPSErrors: true
        });

        const raceResult = await Promise.race([
            page.waitForSelector('.runescape-panel', { timeout: 25000 }).then(() => 'success'),
            page.waitForFunction(() => { const p = document.querySelector('p.text-2xl'); return p && p.textContent.includes('Account not found.'); }, { timeout: 25000 }).then(() => 'failure'),
        ]);

        const nowTimestamp = new Date().toISOString();

        if (raceResult === 'success') {
            const element = await page.$('.runescape-panel');
            if (!element) throw new Error('Panel not found.');
            const screenshotBuffer = await element.screenshot({ type: 'png', omitBackground: true });
            const fileName = `spotlight-${player.wom_player_id}.png`;
            await supabaseAdmin.storage.from('spotlight-images').upload(fileName, screenshotBuffer, { contentType: 'image/png', upsert: true });
            const { data: { publicUrl } } = supabaseAdmin.storage.from('spotlight-images').getPublicUrl(fileName);
            await supabaseAdmin.from('player_details').update({ has_runeprofile: true, runeprofile_image_url: publicUrl, last_checked_at: nowTimestamp }).eq('wom_player_id', player.wom_player_id);
            return { status: 'success', message: `Successfully updated image for ${displayName}.` };
        } else {
            await supabaseAdmin.from('player_details').update({ has_runeprofile: false, runeprofile_image_url: null, last_checked_at: nowTimestamp }).eq('wom_player_id', player.wom_player_id);
            return { status: 'failure', message: `Could not find RuneProfile for ${displayName}.` };
        }
    } finally {
        if (browser) await browser.close();
    }
}

export async function POST(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    try {
        const { wom_player_id } = await request.json();
        if (!wom_player_id) {
            return NextResponse.json({ error: 'wom_player_id is required.' }, { status: 400 });
        }
        const result = await generateAndUpdatePlayer(wom_player_id, supabaseAdmin);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Single Spotlight Update API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}