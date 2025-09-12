// app/api/notify-submission/route.ts

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { playerName, submissionType, bountyName, pbCategory, proofImageUrl } = body;

    if (!playerName || !submissionType || !proofImageUrl) {
        return NextResponse.json({ error: 'Missing required submission data' }, { status: 400 });
    }

    // --- THE FIX IS HERE: We now look for the NEXT_PUBLIC_ prefixed variable ---
    const webhookUrl = process.env.NEXT_PUBLIC_DISCORD_ADMIN_WEBHOOK_URL;

    if (!webhookUrl) {
        console.error("NEXT_PUBLIC_DISCORD_ADMIN_WEBHOOK_URL is not configured.");
        return NextResponse.json({ message: 'Submission created, but admin webhook is not configured.' });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.seekosrs.com';
    const isBounty = submissionType === 'bounty';

    const embed = {
        title: `New ${isBounty ? 'Bounty' : 'Personal Best'} Submission!`,
        description: `A new submission from **${playerName}** is ready for review.`,
        color: 16776960, // Yellow
        fields: [
            { name: 'Player', value: playerName, inline: true },
            { name: 'Type', value: isBounty ? 'Bounty' : 'Personal Best', inline: true },
            { name: isBounty ? 'Bounty Name' : 'PB Category', value: bountyName || pbCategory || 'N/A', inline: true },
            { name: 'Review', value: `[Click here to go to the admin panel](${siteUrl}/admin)` }
        ],
        image: { url: proofImageUrl },
        timestamp: new Date().toISOString(),
        footer: { text: 'Seek Submission System' },
    };

    const payload = {
        username: 'Seek Admin Alerts',
        avatar_url: 'https://ieciglsbyflhbixlbxmw.supabase.co/storage/v1/object/public/assets/seek-icon.png',
        embeds: [embed],
    };

    await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    return NextResponse.json({ message: 'Notification sent successfully!' });

  } catch (error: any) {
    console.error("Error in notify-submission API route:", error);
    return NextResponse.json({ error: 'Failed to send notification but submission was likely successful.' });
  }
}