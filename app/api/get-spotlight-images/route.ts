// app/api/get-spotlight-images/route.ts
// **VERSION WITH FULL DEBUGGING LOGS**

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import puppeteerDev from 'puppeteer';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const BATCH_SIZE = 10;
const RECHECK_INTERVAL_HOURS = 24; // How often to re-check a player

export async function POST(request: Request) {
    console.log("\n--- New Spotlight Generation Request Received ---");

    // Authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error("[AUTH] Failed: Missing or invalid Authorization header.");
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
        console.error("[AUTH] Failed: Invalid user token.");
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`[AUTH] Success: Request authenticated for user ${user.id}`);
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    try {
        // --- LOGIC CHANGE 1: THE QUERY ---
        const recheckTimestamp = new Date(Date.now() - RECHECK_INTERVAL_HOURS * 60 * 60 * 1000).toISOString();
        console.log(`[DB] Fetching players to check. Condition: last_checked_at is NULL or older than ${recheckTimestamp}`);

        const { data: uncheckedMembers, error: membersError } = await supabaseAdmin
            .from('player_details')
            .select('wom_player_id, wom_details_json')
            .or(`last_checked_at.is.null,last_checked_at.lt.${recheckTimestamp}`)
            .limit(BATCH_SIZE);

        if (membersError) throw membersError;

        if (!uncheckedMembers || uncheckedMembers.length === 0) {
            console.log("[INFO] No players to update at this time. All are up to date.");
            return NextResponse.json({ message: `All players are up to date. No new images to generate.` });
        }

        console.log(`[INFO] Found ${uncheckedMembers.length} players to process in this batch.`);
        let successCount = 0;
        let failCount = 0;
        const nowTimestamp = new Date().toISOString();

        for (const member of uncheckedMembers) {
            const displayName = member.wom_details_json?.displayName;
            console.log(`\n[PROCESS] Starting check for player ID: ${member.wom_player_id}, displayName: ${displayName || 'N/A'}`);

            if (!displayName) {
                console.warn(`[PROCESS] Player ${member.wom_player_id} has no displayName. Marking as failed.`);
                const { error } = await supabaseAdmin
                    .from('player_details')
                    .update({ has_runeprofile: false, last_checked_at: nowTimestamp })
                    .eq('wom_player_id', member.wom_player_id);
                if (error) console.error(`[DB ERROR] Failed to update player ${member.wom_player_id} (no name): ${error.message}`);
                failCount++;
                continue;
            }

            let browser = null;
            try {
                const formattedUsername = encodeURIComponent(displayName);
                const profileUrl = `https://www.runeprofile.com/${formattedUsername}`;
                console.log(`[PUPPETEER] Navigating to ${profileUrl}`);

                if (process.env.NODE_ENV === 'development') {
                    browser = await puppeteerDev.launch({ headless: 'true' });
                } else {
                    browser = await puppeteer.launch({ args: chromium.args, defaultViewport: chromium.defaultViewport, executablePath: await chromium.executablePath(), headless: 'true', ignoreHTTPSErrors: true });
                }

                const page = await browser.newPage();
                await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36');
                await page.setViewport({ width: 1920, height: 1080 });
                await page.goto(profileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

                console.log(`[PUPPETEER] Page loaded. Racing selectors...`);
                const raceResult = await Promise.race([
                    page.waitForSelector('.runescape-panel', { timeout: 25000 }).then(() => 'success'),
                    page.waitForFunction(() => { const p = document.querySelector('p.text-2xl'); return p && p.textContent.includes('Account not found.'); }, { timeout: 25000 }).then(() => 'failure'),
                ]);

                console.log(`[PUPPETEER] Race result for ${displayName}: ${raceResult}`);

                if (raceResult === 'success') {
                    const element = await page.$('.runescape-panel');
                    if (!element) throw new Error('Panel found by race but not by direct selector after wait.');

                    const screenshotBuffer = await element.screenshot({ type: 'png', omitBackground: true });
                    const fileName = `spotlight-${member.wom_player_id}.png`;
                    console.log(`[STORAGE] Screenshot taken for ${displayName}. Buffer length: ${screenshotBuffer.length}. Preparing to upload as ${fileName}.`);

                    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                        .from('spotlight-images')
                        .upload(fileName, screenshotBuffer, { contentType: 'image/png', upsert: true });

                    if (uploadError) {
                        console.error(`[STORAGE ERROR] Supabase Storage upload error for ${fileName}:`, uploadError);
                        throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
                    }
                    console.log(`[STORAGE] Upload successful for ${fileName}. Response path:`, uploadData?.path);

                    const { data: urlData } = supabaseAdmin.storage
                        .from('spotlight-images')
                        .getPublicUrl(fileName);

                    console.log(`[STORAGE] Generated Public URL Data structure for ${fileName}:`, JSON.stringify(urlData, null, 2));

                    const publicUrl = urlData.publicUrl;

                    if (!publicUrl) {
                        console.error(`[STORAGE CRITICAL] Public URL is null or undefined for ${fileName}! Cannot update database.`);
                        throw new Error('Failed to generate a public URL from Supabase Storage.');
                    }
                    console.log(`[DB] Final Public URL to be saved for ${displayName}: ${publicUrl}`);

                    const { error } = await supabaseAdmin
                        .from('player_details')
                        .update({ has_runeprofile: true, runeprofile_image_url: publicUrl, last_checked_at: nowTimestamp })
                        .eq('wom_player_id', member.wom_player_id);

                    if (error) throw new Error(`DB Update Error (success) for ${displayName}: ${error.message}`);
                    console.log(`[SUCCESS] Successfully processed and updated player ${displayName}.`);
                    successCount++;

                } else { // raceResult === 'failure'
                    console.log(`[INFO] Account not found on RuneProfile for ${displayName}.`);
                    const { error } = await supabaseAdmin
                        .from('player_details')
                        .update({ has_runeprofile: false, runeprofile_image_url: null, last_checked_at: nowTimestamp })
                        .eq('wom_player_id', member.wom_player_id);
                    if (error) throw new Error(`DB Update Error (failure) for ${displayName}: ${error.message}`);
                    failCount++;
                }
            } catch (e: any) {
                console.error(`[ERROR] An unexpected error occurred in the loop for ${displayName}:`, e.message);
                const { error } = await supabaseAdmin
                    .from('player_details')
                    .update({ has_runeprofile: false, runeprofile_image_url: null, last_checked_at: nowTimestamp })
                    .eq('wom_player_id', member.wom_player_id);
                if (error) console.error(`[DB CRITICAL] Could not mark player ${displayName} as failed after error: ${error.message}`);
                failCount++;
            } finally {
                if (browser) {
                    await browser.close();
                    console.log(`[PUPPETEER] Browser closed for ${displayName}.`);
                }
            }
            await sleep(1000);
        }

        const recheckTimestampFinal = new Date(Date.now() - RECHECK_INTERVAL_HOURS * 60 * 60 * 1000).toISOString();
        const { count: remaining } = await supabaseAdmin
            .from('player_details')
            .select('*', { count: 'exact', head: true })
            .or(`last_checked_at.is.null,last_checked_at.lt.${recheckTimestampFinal}`);

        console.log(`\n--- Batch Complete ---`);
        console.log(`Success: ${successCount}, Failures: ${failCount}. Remaining: ${remaining || 0}`);

        return NextResponse.json({ message: `Batch of ${uncheckedMembers.length} complete. Success: ${successCount}, Failures: ${failCount}. ${remaining || 0} players remaining to check.` });

    } catch (error: any) {
        console.error('--- SPOTLIGHT GENERATION API CRITICAL ERROR ---');
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}