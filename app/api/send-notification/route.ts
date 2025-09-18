import { NextResponse } from 'next/server';

// The function MUST be named POST and it MUST be exported.
// This is what solves the "405 Method Not Allowed" error.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("RECEIVED PAYLOAD in /api/send-notification:", JSON.stringify(body, null, 2));

    const {
        submissionType, playerName, proofImageUrl,
        bountyName, pbCategory, gameName, teamName, tileText
    } = body;

    if (!submissionType || !proofImageUrl) {
        return NextResponse.json({ error: 'Missing submissionType or proofImageUrl' }, { status: 400 });
    }

    const webhookUrl = process.env.NEXT_PUBLIC_DISCORD_ADMIN_WEBHOOK_URL;
    if (!webhookUrl) {
        console.error("ADMIN WEBHOOK URL IS NOT SET!");
        return NextResponse.json({ message: 'Submission created, but webhook is not configured.' });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.seekosrs.com';
    const finalPlayerName = playerName || 'Unknown Player';
    let embed: any;

    // This is the correct logic that will now run on the server.
    if (submissionType === 'bingo') {
        embed = {
            title: `🎲 New Bingo Submission!`,
            description: `A new bingo tile from **${finalPlayerName}** is ready for review.`,
            color: 15844367,
            fields: [
                { name: 'Player', value: finalPlayerName, inline: true },
                { name: 'Team', value: teamName || 'N/A', inline: true },
                { name: 'Game', value: gameName || 'N/A', inline: true },
                { name: 'Tile Submitted', value: tileText || 'N/A' },
                { name: 'Review', value: `[Click here to go to the admin panel](${siteUrl}/admin)` }
            ],
        };
    } else if (submissionType === 'bounty') {
        embed = {
            title: `💰 New Bounty Submission!`,
            description: `A new bounty from **${finalPlayerName}** is ready for review.`,
            color: 5763719,
            fields: [
                { name: 'Player', value: finalPlayerName, inline: true },
                { name: 'Bounty Name', value: bountyName || 'N/A', inline: true },
                { name: 'Review', value: `[Click here to go to the admin panel](${siteUrl}/admin)` }
            ],
        };
    } else if (submissionType === 'personal_best') {
        embed = {
            title: `🏆 New Personal Best Submission!`,
            description: `A new PB from **${finalPlayerName}** is ready for review.`,
            color: 16776960,
            fields: [
                { name: 'Player', value: finalPlayerName, inline: true },
                { name: 'PB Category', value: pbCategory || 'N/A', inline: true },
                { name: 'Review', value: `[Click here to go to the admin panel](${siteUrl}/admin)` }
            ],
        };
    } else {
      throw new Error(`Invalid or unknown submissionType received: ${submissionType}`);
    }

    embed.image = { url: proofImageUrl };
    embed.timestamp = new Date().toISOString();
    embed.footer = { text: 'Seek Submission System' };

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
    console.error("Error in send-notification API route:", error.message);
    return NextResponse.json({ error: `Failed to send notification. Reason: ${error.message}` }, { status: 500 });
  }
}