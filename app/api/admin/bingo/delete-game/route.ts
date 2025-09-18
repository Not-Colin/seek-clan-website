import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    // 1. Authenticate the admin user (no changes here)
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
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    try {
        const { gameId } = await request.json();

        if (!gameId) {
            return NextResponse.json({ error: 'Missing gameId' }, { status: 400 });
        }

        // --- NEW LOGIC: CLEAN UP STORAGE ---

        // 2. Find all submissions associated with this game to get their image URLs.
        const { data: submissions, error: submissionsError } = await supabaseAdmin
            .from('bingo_submissions')
            .select('proof_image_url')
            .eq('game_id', gameId);

        if (submissionsError) {
            throw new Error(`Failed to fetch submissions for image cleanup: ${submissionsError.message}`);
        }

        // 3. If there are submissions with images, extract the filenames and delete them from storage.
        if (submissions && submissions.length > 0) {
            const filePaths = submissions
                .map(sub => sub.proof_image_url)
                .filter(url => !!url) // Filter out any null/empty URLs
                .map(url => {
                    // Extract the path from the full URL, e.g., "6-11-1758203338003.png"
                    const urlParts = url.split('/bingo-proofs/');
                    return urlParts.length > 1 ? urlParts[1] : null;
                })
                .filter(path => !!path) as string[];

            if (filePaths.length > 0) {
                console.log(`Deleting ${filePaths.length} proof images from storage...`);
                const { error: storageError } = await supabaseAdmin
                    .storage
                    .from('bingo-proofs')
                    .remove(filePaths);

                if (storageError) {
                    // Log the error but proceed with DB deletion. It's better to have an orphaned DB record
                    // than to fail the entire delete operation because of a storage issue.
                    console.error('Could not delete images from storage:', storageError.message);
                }
            }
        }

        // --- ORIGINAL LOGIC: DELETE FROM DATABASE ---

        // 4. Perform the database delete operation. The CASCADE rules will handle the rest.
        const { error: deleteError } = await supabaseAdmin
            .from('bingo_games')
            .delete()
            .eq('id', gameId);

        if (deleteError) throw deleteError;

        return NextResponse.json({ message: 'Game and all associated data deleted successfully.' });

    } catch (error: any) {
        console.error('Error deleting bingo game:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}