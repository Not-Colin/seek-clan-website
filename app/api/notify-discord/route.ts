// app/api/notify-discord/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const post = await request.json();
    if (!post.title || !post.excerpt || !post.slug || !post.category) {
        return NextResponse.json({ error: 'Missing required post data' }, { status: 400 });
    }

    const webhookUrl = post.category === 'News'
        ? process.env.DISCORD_NEWS_WEBHOOK_URL
        : process.env.DISCORD_EVENTS_WEBHOOK_URL;

    if (!webhookUrl) {
        console.error(`Webhook URL for category "${post.category}" is not configured in environment variables.`);
        return NextResponse.json({ error: 'Webhook not configured on the server.' }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.seekosrs.com';
    const embed = {
        title: post.title,
        description: post.excerpt,
        url: `${siteUrl}/news/${post.slug}`,
        color: post.category === 'News' ? 3447003 : 10181046, // Blue for News, Purple for Events
        timestamp: new Date().toISOString(),
        footer: {
            text: 'Seek OSRS Clan',
        },
    };

    const payload = {
        avatar_url: 'https://ieciglsbyflhbixlbxmw.supabase.co/storage/v1/object/public/assets/seek-icon.png',
        embeds: [embed],
    };

    const discordResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!discordResponse.ok) {
        const errorText = await discordResponse.text();
        console.error('Discord API Error:', errorText);
        throw new Error('Failed to send notification to Discord.');
    }

    return NextResponse.json({ message: 'Notification sent successfully!' });

  } catch (error: any) {
    console.error("An unexpected error occurred in the notify-discord API route:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}