// app/api/get-spotlight-images/route.ts - With DUAL Cache Busting

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import puppeteerDev from 'puppeteer';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const BATCH_SIZE = 5;
const RECHECK_INTERVAL_HOURS = 24;

export async function POST(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    try {
        const recheckTimestamp = new Date(Date.now() - RECHECK_INTERVAL_HOURS * 60 * 60 * 1000).toISOString();
        const { data: uncheckedMembers, error: membersError } = await supabaseAdmin.from('player_details').select('wom_player_id, wom_details_json').or(`last_checked_at.is.null,last_checked_at.lt.${recheckTimestamp}`).limit(BATCH_SIZE);
        if (membersError) throw membersError;
        if (!uncheckedMembers || uncheckedMembers.length === 0) {
            return NextResponse.json({ message: `All players are up to date. No new images to generate.` });
        }

        let successCount = 0;
        let failCount = 0;
        const nowTimestamp = new Date().toISOString();

        for (const member of uncheckedMembers) {
            const displayName = member.wom_details_json?.displayName;
            if (!displayName) { continue; }

            let browser = null;
            try {
                const formattedUsername = encodeURIComponent(displayName);
                const profileUrl = `https://www.runeprofile.com/${formattedUsername}`;

                if (process.env.NODE_ENV === 'development') {
                    browser = await puppeteerDev.launch({ headless: true });
                } else {
                    browser = await puppeteer.launch({
                        args: chromium.args,
                        executablePath: await chromium.executablePath(),
                        headless: true
                    });
                }

                const page = await browser.newPage();

                // --- FIX #1: Disable the browser's cache for this page load ---
                await page.setCacheEnabled(false);

                await page.setViewport({ width: 1920, height: 1080 });
                await page.goto(profileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

                const raceResult = await Promise.race([
                    page.waitForSelector('.runescape-panel', { timeout: 25000 }).then(() => 'success'),
                    page.waitForFunction(() => { const p = document.querySelector('p.text-2xl'); return p?.textContent?.includes('Account not found.'); }, { timeout: 25000 }).then(() => 'failure'),
                ]);

                if (raceResult === 'success') {
                    const element = await page.$('.runescape-panel');
                    if (!element) throw new Error('Panel found by race but not by selector.');
                    const screenshotBuffer = await element.screenshot({ type: 'png', omitBackground: true });
                    const fileName = `spotlight-${member.wom_player_id}.png`;

                    await supabaseAdmin.storage.from('spotlight-images').upload(fileName, screenshotBuffer, { contentType: 'image/png', upsert: true });

                    // --- FIX #2: Add timestamp to the URL to bust CDN cache ---
                    const { data: { publicUrl } } = supabaseAdmin.storage.from('spotlight-images').getPublicUrl(fileName);
                    const finalUrl = `${publicUrl}?t=${new Date().getTime()}`;

                    await supabaseAdmin.from('player_details').update({ has_runeprofile: true, runeprofile_image_url: finalUrl, last_checked_at: nowTimestamp }).eq('wom_player_id', member.wom_player_id);
                    successCount++;
                } else {
                    await supabaseAdmin.from('player_details').update({ has_runeprofile: false, runeprofile_image_url: null, last_checked_at: nowTimestamp }).eq('wom_player_id', member.wom_player_id);
                    failCount++;
                }
            } catch (e: any) {
                console.error(`An unexpected error occurred for ${displayName}:`, e.message);
                await supabaseAdmin.from('player_details').update({ has_runeprofile: false, runeprofile_image_url: null, last_checked_at: nowTimestamp }).eq('wom_player_id', member.wom_player_id);
                failCount++;
            } finally {
                if (browser) await browser.close();
            }
            await sleep(1000);
        }

        const recheckTimestampFinal = new Date(Date.now() - RECHECK_INTERVAL_HOURS * 60 * 60 * 1000).toISOString();
        const { count: remaining } = await supabaseAdmin.from('player_details').select('*', { count: 'exact', head: true }).or(`last_checked_at.is.null,last_checked_at.lt.${recheckTimestampFinal}`);
        return NextResponse.json({ message: `Batch of ${uncheckedMembers.length} complete. Success: ${successCount}, Failures: ${failCount}. ${remaining || 0} players remaining to check.` });

    } catch (error: any) {
        console.error('Spotlight Generation API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}