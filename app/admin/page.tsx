'use client';

import { useEffect, useState, FormEvent, ChangeEvent, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminLogin from '@/components/AdminLogin';
import Header from '@/components/Header';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// ... (Keep your other interfaces: Bounty, Submission, ClanMember, Post, BingoSubmission) ...
interface Bounty { id: number; name: string; tier: string; image_url: string; is_active: boolean; created_at: string; }
interface Submission { id: number; created_at: string; player_name: string; submission_type: string; personal_best_category: string | null; proof_image_url: string; is_archived: boolean; status: string; bounty_tier: 'low' | 'medium' | 'high' | null; personal_best_time: string | null; trade_proof_url: string | null; bounty_id: number | null; bounties: { name: string; } | null; }
interface ClanMember { id: number; displayName: string; }
interface Post { id?: number; title: string; slug: string; content: string; excerpt: string; category: string; status: 'draft' | 'published' | 'featured'; created_at?: string; published_at?: string | null; }
interface BingoSubmission { id: number; created_at: string; tile_text: string; proof_image_url: string; team_name: string | null; player_name: string | null; }

// --- UPDATED INTERFACE ---
interface BingoGame {
    id: number;
    name: string;
    is_active: boolean;
    start_time: string;
    duration_days: number;
}

interface BingoTeam { id: number; team_name: string; bingo_team_members: { player_id: number; player_details: { wom_details_json?: { username?: string } } | null }[] }

export default function AdminPage() {
    // ... (Keep existing state) ...
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts');
    const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
    const [bounties, setBounties] = useState<Bounty[]>([]);
    const [personalBests, setPersonalBests] = useState<Submission[]>([]);
    const [newBountyName, setNewBountyName] = useState('');
    const [newBountyTier, setNewBountyTier] = useState('low');
    const [newBountyFile, setNewBountyFile] = useState<File | null>(null);
    const [isSubmittingBounty, setIsSubmittingBounty] = useState(false);
    const [isPasswordRequired, setIsPasswordRequired] = useState(false);
    const [submissionPassword, setSubmissionPassword] = useState('');
    const [settingsStatus, setSettingsStatus] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshStatus, setRefreshStatus] = useState('');
    const [isGeneratingSpotlight, setIsGeneratingSpotlight] = useState(false);
    const [spotlightStatus, setSpotlightStatus] = useState('');
    const [approvedBounties, setApprovedBounties] = useState<Submission[]>([]);
    const [tradeProofFile, setTradeProofFile] = useState<File | null>(null);
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
    const [isLoggingTrade, setIsLoggingTrade] = useState(false);
    const [allClanMembers, setAllClanMembers] = useState<ClanMember[]>([]);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
    const [isUpdatingSingle, setIsUpdatingSingle] = useState(false);
    const [singleUpdateStatus, setSingleUpdateStatus] = useState('');
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [currentPost, setCurrentPost] = useState<Post>({ title: '', slug: '', content: '', excerpt: '', category: 'News', status: 'draft' });
    const [isEditingPost, setIsEditingPost] = useState(false);
    const [postStatus, setPostStatus] = useState('');
    const [isSyncingWom, setIsSyncingWom] = useState(false);
    const [womSyncStatus, setWomSyncStatus] = useState('');

    // Bingo State
    const [newBingoName, setNewBingoName] = useState('');
    const [newBingoType, setNewBingoType] = useState('standard');
    const [newBingoSize, setNewBingoSize] = useState(5);
    const [newBingoTiles, setNewBingoTiles] = useState('');
    const [newBingoPassword, setNewBingoPassword] = useState('');
    const [isCreatingBingo, setIsCreatingBingo] = useState(false);
    const [bingoStatus, setBingoStatus] = useState('');
    const [pendingBingoSubmissions, setPendingBingoSubmissions] = useState<BingoSubmission[]>([]);
    const [allBingoGames, setAllBingoGames] = useState<BingoGame[]>([]);
    const [selectedGameToManage, setSelectedGameToManage] = useState<BingoGame | null>(null);
    const [teamsForSelectedGame, setTeamsForSelectedGame] = useState<BingoTeam[]>([]);
    const [bingoSubTab, setBingoSubTab] = useState('create');

    // --- NEW STATE FOR DURATION ---
    const [newBingoDuration, setNewBingoDuration] = useState(7);

    // ... (Keep existing Fetch functions for posts, bounties, etc) ...
    const fetchBounties = useCallback(async () => { const { data, error } = await supabase.from('bounties').select('*').order('created_at', { ascending: false }); if (error) console.error('Error fetching bounties:', error); else setBounties(data || []); }, []);
    const fetchPendingSubmissions = useCallback(async () => { const { data, error } = await supabase.from('submissions').select('*, bounties(name)').eq('status', 'pending').order('created_at', { ascending: true }); if (error) console.error('Error fetching pending submissions:', error); else setPendingSubmissions(data || []); }, []);
    const fetchPersonalBests = useCallback(async () => { const { data, error } = await supabase.from('submissions').select('*').eq('status', 'approved').eq('submission_type', 'personal_best').order('created_at', { ascending: false }); if (error) console.error('Error fetching PBs:', error); else setPersonalBests((data as Submission[]) || []); }, []);
    const fetchSettings = useCallback(async () => { const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single(); if (error) console.error("Error fetching settings:", error); else if (data) { setIsPasswordRequired(data.is_password_required); setSubmissionPassword(data.submission_password || ''); } }, []);
    const fetchApprovedBounties = useCallback(async () => { const { data, error } = await supabase.from('submissions').select('*, bounties(name)').eq('status', 'approved').eq('submission_type', 'bounty').order('created_at', { ascending: false }); if (error) console.error("Error fetching approved bounties:", error); else setApprovedBounties(data || []); }, []);
    const fetchAllClanMembers = useCallback(async () => { const { data, error } = await supabase.from('player_details').select('wom_player_id, wom_details_json').order('wom_details_json->>username', { ascending: true }); if (error) { console.error('Error fetching clan members:', error); } else { const members = data.map(p => ({ id: p.wom_player_id, displayName: p.wom_details_json?.username || 'Unknown' })).filter(p => p.displayName !== 'Unknown'); setAllClanMembers(members); if (members.length > 0) { setSelectedPlayerId(members[0].id.toString()); } } }, []);
    const fetchPosts = useCallback(async () => { const { data, error } = await supabase.from('posts').select('*').order('status', { ascending: false }).order('published_at', { ascending: false }); if (error) console.error("Error fetching posts:", error); else setPosts(data || []); }, []);
    const fetchPendingBingoSubmissions = useCallback(async () => {
        const { data, error } = await supabase.from('bingo_submissions').select(`id, created_at, tile_text, proof_image_url, player_name, bingo_teams ( team_name )`).eq('status', 'pending').order('created_at', { ascending: true });
        if (error) { console.error('Error:', error); setPendingBingoSubmissions([]); } else {
            const formattedData = data.map(sub => ({ id: sub.id, created_at: sub.created_at, tile_text: sub.tile_text, proof_image_url: sub.proof_image_url, team_name: (sub.bingo_teams as any)?.team_name ?? 'Unknown Team', player_name: sub.player_name ?? 'Unknown Player', }));
            setPendingBingoSubmissions(formattedData);
        }
    }, []);

    // --- UPDATED FETCH FOR GAMES ---
    const fetchAllBingoGames = useCallback(async () => {
        // Now fetching start_time and duration_days
        const { data, error } = await supabase.from('bingo_games').select('id, name, is_active, start_time, duration_days').order('created_at', { ascending: false });
        if (error) console.error("Error fetching all bingo games:", error);
        else setAllBingoGames(data || []);
    }, []);

    const fetchTeamsForGame = useCallback(async (gameId: number) => {
        const { data, error } = await supabase.from('bingo_teams').select(`id, team_name, bingo_team_members ( player_id, player_details ( wom_details_json ) )`).eq('game_id', gameId);
        if (error) { console.error("Error fetching teams:", error); setTeamsForSelectedGame([]); return; }
        const formattedData = data.map(team => ({ id: team.id, team_name: team.team_name, bingo_team_members: team.bingo_team_members.map((member: any) => ({ player_id: member.player_id, player_details: member.player_details })) }));
        setTeamsForSelectedGame(formattedData);
    }, []);

    const checkUserAndLoadData = useCallback(async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
            await Promise.all([fetchPendingSubmissions(), fetchBounties(), fetchPersonalBests(), fetchSettings(), fetchApprovedBounties(), fetchAllClanMembers(), fetchPosts(), fetchAllBingoGames(), fetchPendingBingoSubmissions()]);
        }
        setLoading(false);
    }, [fetchBounties, fetchPendingSubmissions, fetchPersonalBests, fetchSettings, fetchApprovedBounties, fetchAllClanMembers, fetchPosts, fetchAllBingoGames, fetchPendingBingoSubmissions]);

    useEffect(() => { checkUserAndLoadData(); }, [checkUserAndLoadData]);

    // ... (Keep existing handlers for Posts, Bounties, PBs, etc.) ...
    const handleUpdateStatus = useCallback(async (submissionToUpdate: Submission, newStatus: 'approved' | 'rejected') => { const { error: submissionUpdateError } = await supabase.from('submissions').update({ status: newStatus }).eq('id', submissionToUpdate.id); if (submissionUpdateError) { alert(`Error updating submission: ${submissionUpdateError.message}`); return; } if (newStatus === 'approved' && submissionToUpdate.submission_type === 'bounty' && submissionToUpdate.bounties?.name) { const { error: bountyUpdateError } = await supabase.from('bounties').update({ is_active: false }).eq('name', submissionToUpdate.bounties.name); if (bountyUpdateError) alert(`Submission approved, but failed to auto-archive bounty: ${bountyUpdateError.message}`); } await Promise.all([fetchPendingSubmissions(), fetchBounties(), fetchApprovedBounties()]); if (newStatus === 'approved' && submissionToUpdate.submission_type === 'personal_best') await fetchPersonalBests(); }, [fetchBounties, fetchPendingSubmissions, fetchPersonalBests, fetchApprovedBounties]);
    const handleBountyFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => { setNewBountyFile(null); if (e.target.files && e.target.files.length > 0) { const file = e.target.files[0]; const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']; if (!allowedTypes.includes(file.type)) { alert("Invalid file type."); e.target.value = ''; return; } setNewBountyFile(file); } }, []);
    const handleBountySubmit = useCallback(async (e: FormEvent) => { e.preventDefault(); if (!newBountyFile || !newBountyName) { alert("Please provide a bounty name and select an image."); return; } setIsSubmittingBounty(true); try { const fileName = `${Date.now()}.${newBountyFile.name.split('.').pop()}`; const { error: uError } = await supabase.storage.from('bounty-images').upload(fileName, newBountyFile); if (uError) throw uError; const { data: urlData } = supabase.storage.from('bounty-images').getPublicUrl(fileName); const { error: iError } = await supabase.from('bounties').insert([{ name: newBountyName, tier: newBountyTier, image_url: urlData.publicUrl, is_active: true }]); if (iError) throw iError; setNewBountyName(''); setNewBountyTier('low'); setNewBountyFile(null); (e.target as HTMLFormElement).reset(); await fetchBounties(); } catch (error: any) { alert(`Error submitting bounty: ${error.message}`); } finally { setIsSubmittingBounty(false); } }, [newBountyFile, newBountyName, newBountyTier, fetchBounties]);
    const handleBountyArchive = useCallback(async (id: number, currentStatus: boolean) => { const { error } = await supabase.from('bounties').update({ is_active: !currentStatus }).eq('id', id); if (error) alert(`Error: ${error.message}`); else await fetchBounties(); }, [fetchBounties]);
    const handleBountyDelete = useCallback(async (id: number) => { if (window.confirm("Are you sure? This cannot be undone.")) { const { error } = await supabase.from('bounties').delete().eq('id', id); if (error) { alert(`Error deleting bounty: ${error.message}`); } else { await fetchBounties(); } } }, [fetchBounties]);
    const handlePbArchive = useCallback(async (id: number, currentStatus: boolean) => { const { error } = await supabase.from('submissions').update({ is_archived: !currentStatus }).eq('id', id); if (error) alert(`Error: ${error.message}`); else await fetchPersonalBests(); }, [fetchPersonalBests]);
    const handleTradeLogSubmit = useCallback(async (e: FormEvent, submissionId: number) => { e.preventDefault(); if (!tradeProofFile) { alert("Please select a trade proof screenshot."); return; } setIsLoggingTrade(true); setSelectedSubmissionId(submissionId); try { const fileName = `trade-${submissionId}-${Date.now()}.${tradeProofFile.name.split('.').pop()}`; const { error: uploadError } = await supabase.storage.from('trade-proofs').upload(fileName, tradeProofFile); if (uploadError) throw uploadError; const { data: urlData } = supabase.storage.from('trade-proofs').getPublicUrl(fileName); const { error: updateError } = await supabase.from('submissions').update({ trade_proof_url: urlData.publicUrl }).eq('id', submissionId); if (updateError) throw updateError; alert("Trade proof logged successfully!"); setTradeProofFile(null); (e.target as HTMLFormElement).reset(); await fetchApprovedBounties(); } catch (error: any) { alert(`Error logging trade proof: ${error.message}`); } finally { setIsLoggingTrade(false); setSelectedSubmissionId(null); } }, [tradeProofFile, fetchApprovedBounties]);
    const handleTradeProofRemove = useCallback(async (submission: Submission) => { if (!submission.trade_proof_url) return; if (!window.confirm("Are you sure?")) return; setIsLoggingTrade(true); setSelectedSubmissionId(submission.id); try { const fileName = submission.trade_proof_url.split('/').pop(); if (fileName) await supabase.storage.from('trade-proofs').remove([fileName]); await supabase.from('submissions').update({ trade_proof_url: null }).eq('id', submission.id); alert("Trade proof removed successfully."); await fetchApprovedBounties(); } catch (error: any) { alert(`Error removing trade proof: ${error.message}`); } finally { setIsLoggingTrade(false); setSelectedSubmissionId(null); } }, [fetchApprovedBounties]);
    const handleUpdateSettings = useCallback(async (e: FormEvent) => { e.preventDefault(); setSettingsStatus('Saving...'); const { error } = await supabase.from('settings').update({ is_password_required: isPasswordRequired, submission_password: submissionPassword || null }).eq('id', 1); if (error) setSettingsStatus(`Error: ${error.message}`); else { setSettingsStatus('Settings saved!'); setTimeout(() => setSettingsStatus(''), 2000); } }, [isPasswordRequired, submissionPassword]);
    const handleLogout = useCallback(async () => { await supabase.auth.signOut(); setUser(null); router.push('/'); }, [router]);
    const handleCalculateRanks = useCallback(async () => { setIsRefreshing(true); setRefreshStatus('Calculating ranks...'); try { const { data: { session }, error: sessionError } = await supabase.auth.refreshSession(); if (sessionError || !session) throw new Error("Your session has expired. Please log in again."); const response = await fetch('/api/refresh-clan-data', { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}` } }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'An unknown error occurred.'); setRefreshStatus(result.message); } catch (error: any) { setRefreshStatus(`Error: ${error.message}`); if (error.message.includes("session has expired")) await handleLogout(); } finally { setIsRefreshing(false); setTimeout(() => setRefreshStatus(''), 5000); } }, [handleLogout]);
    const handleWomGroupSync = useCallback(async () => {
            setIsSyncingWom(true);
            setWomSyncStatus('Initializing robust sync...');

            try {
                const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
                if (sessionError || !session) throw new Error("Your session has expired. Please log in again.");

                let nextIndex: number | null = 0;
                let isComplete = false;

                // --- THE LOOP ---
                while (!isComplete && nextIndex !== null) {

                    const payload = { startIndex: nextIndex };

                    // Explicit type to fix TS error
                    const syncResponse: Response = await fetch('/api/sync-wom-group-data', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${session.access_token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    const result = await syncResponse.json();

                    if (!syncResponse.ok) {
                        throw new Error(result.error || 'An unknown error occurred.');
                    }

                    // UI Update
                    if (result.totalPlayers) {
                        setWomSyncStatus(`Syncing: ${result.progress}% (${nextIndex} / ${result.totalPlayers}) - ${result.message}`);
                    }

                    // --- DYNAMIC DELAY LOGIC ---
                    let delayTime = 4500; // Increase default to 4s to be safer

                    if (result.wasRateLimited) {
                        setWomSyncStatus(`Hit rate limit. Cooling down for 10s before retrying ${nextIndex}...`);
                        delayTime = 10000; // 10 second penalty
                        // IMPORTANT: We do NOT update nextIndex. We keep the old one to retry it.
                        // nextIndex stays the same as what we sent
                    } else {
                        // Success! Move to next.
                        nextIndex = result.nextIndex;
                        isComplete = result.isComplete;
                    }

                    if (!isComplete && nextIndex !== null) {
                        await new Promise(resolve => setTimeout(resolve, delayTime));
                    }
                }

                setWomSyncStatus('Success! All players have been synced to the database.');

            } catch (error: any) {
                setWomSyncStatus(`Error: ${error.message}`);
                if (error.message.includes("session has expired")) await handleLogout();
            } finally {
                setIsSyncingWom(false);
                setTimeout(() => setWomSyncStatus(''), 10000);
            }
        }, [handleLogout]);
    const handleGenerateSpotlight = useCallback(async () => { setIsGeneratingSpotlight(true); setSpotlightStatus('Processing a batch, this may take a moment...'); try { const { data: { session }, error: sessionError } = await supabase.auth.refreshSession(); if (sessionError || !session) throw new Error("Your session has expired. Please log in again."); const response = await fetch('/api/get-spotlight-images', { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}` } }); if (!response.ok) { try { const result = await response.json(); throw new Error(result.error || 'An unknown error occurred.'); } catch (e) { throw new Error(`Server returned a non-JSON response. It may have timed out. Status: ${response.status}`); } } const result = await response.json(); setSpotlightStatus(result.message); } catch (error: any) { setSpotlightStatus(`Error: ${error.message}`); if (error.message.includes("session has expired")) await handleLogout(); } finally { setIsGeneratingSpotlight(false); setTimeout(() => setSpotlightStatus(''), 15000); } }, [handleLogout]);
    const handleSingleSpotlightUpdate = useCallback(async () => { if (!selectedPlayerId) { setSingleUpdateStatus('Please select a player.'); return; } setIsUpdatingSingle(true); setSingleUpdateStatus(`Updating ${allClanMembers.find(p => p.id.toString() === selectedPlayerId)?.displayName}...`); try { const { data: { session }, error: sessionError } = await supabase.auth.refreshSession(); if (sessionError || !session) throw new Error("Session expired. Please log in again."); const response = await fetch('/api/update-single-spotlight', { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ wom_player_id: parseInt(selectedPlayerId, 10) }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'An unknown error occurred.'); setSingleUpdateStatus(result.message); } catch (error: any) { setSingleUpdateStatus(`Error: ${error.message}`); if (error.message.includes("session has expired")) await handleLogout(); } finally { setIsUpdatingSingle(false); setTimeout(() => setSingleUpdateStatus(''), 8000); } }, [selectedPlayerId, allClanMembers, handleLogout]);
    const generateSlug = (title: string) => title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const handlePostSubmit = useCallback(async (e: FormEvent) => { e.preventDefault(); setPostStatus('Saving...'); const slug = generateSlug(currentPost.title); const postToSave = { ...currentPost, slug, status: isEditingPost ? currentPost.status : 'draft' }; let error; if (isEditingPost) { ({ error } = await supabase.from('posts').update(postToSave).eq('id', postToSave.id)); } else { ({ error } = await supabase.from('posts').insert(postToSave)); } if (error) { setPostStatus(`Error: ${error.message}`); } else { setPostStatus('Post saved successfully!'); setCurrentPost({ title: '', slug: '', content: '', excerpt: '', category: 'News', status: 'draft' }); setIsEditingPost(false); await fetchPosts(); setTimeout(() => setPostStatus(''), 3000); } }, [currentPost, isEditingPost, fetchPosts]);
    const handleSetStatus = useCallback(async (post: Post, newStatus: 'featured' | 'published' | 'draft') => { if (newStatus === 'featured') { const { error: unfeatureError } = await supabase.from('posts').update({ status: 'published' }).eq('category', post.category).eq('status', 'featured'); if (unfeatureError) { alert(`Error un-featuring old post: ${unfeatureError.message}`); return; } } const { error } = await supabase.from('posts').update({ status: newStatus, published_at: newStatus !== 'draft' && !post.published_at ? new Date().toISOString() : post.published_at }).eq('id', post.id); if (error) { alert(`Error updating post status: ${error.message}`); } else { await fetchPosts(); if (newStatus === 'featured') { try { const { data: { session } } = await supabase.auth.getSession(); if (!session) throw new Error("No active session to send notification."); const response = await fetch('/api/notify-discord', { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ title: post.title, excerpt: post.excerpt, slug: post.slug, category: post.category }) }); if (!response.ok) { const result = await response.json(); throw new Error(result.error || "Unknown error sending notification."); } } catch (notifyError: any) { alert(`Post was featured, but failed to send Discord notification: ${notifyError.message}`); } } } }, [fetchPosts]);
    const handlePostDelete = async (postId: number) => { if (window.confirm('Are you sure you want to delete this post?')) { const { error } = await supabase.from('posts').delete().eq('id', postId); if (error) alert(`Error deleting post: ${error.message}`); else await fetchPosts(); } };

    // --- UPDATED CREATE GAME ---
    const handleCreateBingoGame = useCallback(async (e: FormEvent) => {
        e.preventDefault(); setIsCreatingBingo(true); setBingoStatus('Creating game...');
        if (newBingoTiles.split('\n').filter(Boolean).length < (newBingoSize * newBingoSize)) { setBingoStatus(`Error: Not enough tiles for a ${newBingoSize}x${newBingoSize} board.`); setIsCreatingBingo(false); return; }
        // NEW VALIDATION
        if (newBingoDuration < 0) { setBingoStatus('Error: Duration (days) cannot be negative.'); setIsCreatingBingo(false); return; }

        try {
            const { data: { session }, error: sessionError } = await supabase.auth.refreshSession(); if (sessionError || !session) throw new Error("Your session has expired. Please log in again.");
            const response = await fetch('/api/admin/bingo/create-game', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newBingoName, game_type: newBingoType, board_size: newBingoSize, tile_pool_text: newBingoTiles, password: newBingoPassword, duration_days: newBingoDuration })
            });
            const result = await response.json(); if (!response.ok) throw new Error(result.error || 'An unknown error occurred.');
            setBingoStatus(result.message); setNewBingoName(''); setNewBingoTiles(''); setNewBingoPassword(''); setNewBingoDuration(7); await fetchAllBingoGames();
        } catch (error: any) { setBingoStatus(`Error: ${error.message}`); } finally { setIsCreatingBingo(false); setTimeout(() => setBingoStatus(''), 10000); }
    }, [newBingoName, newBingoType, newBingoSize, newBingoTiles, newBingoPassword, newBingoDuration, fetchAllBingoGames]);

    const handleManageBingoSubmission = useCallback(async (submissionId: number, newStatus: 'approved' | 'rejected') => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.refreshSession(); if (sessionError || !session) throw new Error("Your session has expired. Please log in again.");
            const response = await fetch('/api/admin/bingo/manage-submission', { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ submissionId, newStatus }) });
            const result = await response.json(); if (!response.ok) throw new Error(result.error || `Failed to ${newStatus} submission.`);
            alert(result.message); await fetchPendingBingoSubmissions();
        } catch (error: any) { alert(`Error: ${error.message}`); }
    }, [fetchPendingBingoSubmissions]);
    const handleAddPlayerToTeam = useCallback(async (teamId: number, playerId: number) => {
        if (!playerId) return;
        try {
            const { data: { session } } = await supabase.auth.getSession(); if (!session) throw new Error("Session not found. Please log in again.");
            const response = await fetch('/api/admin/bingo/add-player', { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ team_id: teamId, player_id: playerId }) });
            if (!response.ok) { const result = await response.json(); throw new Error(result.error || "Failed to add player."); }
            if (selectedGameToManage) await fetchTeamsForGame(selectedGameToManage.id);
        } catch (error: any) { alert(`Error adding player: ${error.message}`); }
    }, [selectedGameToManage, fetchTeamsForGame]);
    const handleRemovePlayerFromTeam = useCallback(async (teamId: number, playerId: number) => {
        try {
            const { data: { session } } = await supabase.auth.getSession(); if (!session) throw new Error("Session not found. Please log in again.");
            const response = await fetch('/api/admin/bingo/remove-player', { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ team_id: teamId, player_id: playerId }) });
            if (!response.ok) { const result = await response.json(); throw new Error(result.error || "Failed to remove player."); }
            if (selectedGameToManage) await fetchTeamsForGame(selectedGameToManage.id);
        } catch (error: any) { alert(`Error removing player: ${error.message}`); }
    }, [selectedGameToManage, fetchTeamsForGame]);
    const handleSetGameStatus = useCallback(async (gameId: number, isActive: boolean) => {
        const action = isActive ? "re-activate" : "archive";
        if (!window.confirm(`Are you sure you want to ${action} this game?`)) return;
        try {
            const { data: { session } } = await supabase.auth.getSession(); if (!session) throw new Error("Session not found. Please log in again.");
            const response = await fetch('/api/admin/bingo/set-game-status', { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ gameId, isActive }) });
            if (!response.ok) { const result = await response.json(); throw new Error(result.error || `Failed to ${action} game.`); }
            alert(`Game successfully ${action}d.`); setSelectedGameToManage(null); setTeamsForSelectedGame([]); await fetchAllBingoGames();
        } catch (error: any) { alert(`Error: ${error.message}`); }
    }, [fetchAllBingoGames]);
    const handleDeleteGame = useCallback(async (gameId: number) => {
        if (!window.confirm("ARE YOU SURE? This will permanently delete the game and all its teams, boards, and submissions. This action cannot be undone.")) return;
        try {
            const { data: { session } } = await supabase.auth.getSession(); if (!session) throw new Error("Session not found. Please log in again.");
            const response = await fetch('/api/admin/bingo/delete-game', { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ gameId }) });
            if (!response.ok) { const result = await response.json(); throw new Error(result.error || "Failed to delete game."); }
            alert(`Game successfully deleted.`); setSelectedGameToManage(null); setTeamsForSelectedGame([]); await fetchAllBingoGames();
        } catch (error: any) { alert(`Error: ${error.message}`); }
    }, [fetchAllBingoGames]);

    // --- NEW: MANUAL CLOSE HANDLER ---
    const handleCloseBingoManually = useCallback(async (gameId: number) => {
        if (!window.confirm("Are you sure you want to CLOSE this bingo game immediately? This will set it to inactive.")) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Session not found. Please log in again.");

            const response = await fetch('/api/admin/bingo/close-game-manual', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId })
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || "Failed to close game manually.");
            }

            alert(`Bingo game with ID ${gameId} successfully closed.`);
            setSelectedGameToManage(null);
            setTeamsForSelectedGame([]);
            await fetchAllBingoGames();
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        }
    }, [fetchAllBingoGames]);

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
    if (!user) return <AdminLogin onLogin={checkUserAndLoadData} />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Header />
            <main className="px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6"><h1 className="text-3xl font-bold text-white">Admin Panel</h1><button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg">Logout</button></div>
                    <div className="flex border-b border-slate-700 mb-6 overflow-x-auto">
                        <button onClick={() => setActiveTab('posts')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'posts' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'}`}>Manage Posts</button>
                        <button onClick={() => setActiveTab('bingo')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'bingo' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'}`}>Manage Bingos</button>
                        {/* ... (Other Tabs) ... */}
                        <button onClick={() => setActiveTab('post')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'post' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'}`}>Post Bounties</button>
                        <button onClick={() => setActiveTab('validate')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'validate' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'}`}>Validate Bounties</button>
                        <button onClick={() => setActiveTab('pbs')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'pbs' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'}`}>Manage PBs</button>
                        <button onClick={() => setActiveTab('tradelog')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'tradelog' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'}`}>Trade Log</button>
                        <button onClick={() => setActiveTab('settings')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'settings' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'}`}>Site Settings</button>
                    </div>

                    {/* ... (Tab Content for Posts) ... */}
                    {activeTab === 'posts' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 bg-slate-800/50 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">{isEditingPost ? 'Edit Post' : 'Create New Post'}</h3>
                                <form onSubmit={handlePostSubmit} className="space-y-4">
                                    <input type="text" placeholder="Post Title" value={currentPost.title} onChange={(e) => setCurrentPost({ ...currentPost, title: e.target.value })} required className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white" />
                                    <select value={currentPost.category} onChange={(e) => setCurrentPost({ ...currentPost, category: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white"><option value="News">News</option><option value="Events">Events</option></select>
                                    <textarea placeholder="Summary" value={currentPost.excerpt} onChange={(e) => setCurrentPost({ ...currentPost, excerpt: e.target.value })} className="w-full h-24 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white" />
                                    <textarea placeholder="Main Content (Markdown supported)" value={currentPost.content} onChange={(e) => setCurrentPost({ ...currentPost, content: e.target.value })} required className="w-full h-48 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white" />
                                    <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg">{isEditingPost ? 'Update Post Content' : 'Save as Draft'}</button>
                                    {isEditingPost && <button type="button" onClick={() => { setIsEditingPost(false); setCurrentPost({ title: '', slug: '', content: '', excerpt: '', category: 'News', status: 'draft' }); }} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg mt-2">Cancel Edit</button>}
                                    {postStatus && <p className="text-center text-sm mt-2 text-gray-300">{postStatus}</p>}
                                </form>
                            </div>
                            <div className="md:col-span-2 bg-slate-800/50 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Existing Posts</h3>
                                <div className="space-y-3">{posts.map(post => (<div key={post.id} className="bg-slate-700/50 p-3 rounded-lg flex justify-between items-center gap-2 flex-wrap"><div><p className="font-bold text-white">{post.title}</p>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${post.status === 'featured' ? 'bg-orange-500 text-white' : post.status === 'published' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-gray-200'}`}>
                                    {post.status === 'featured' ? `Featured ${post.category}` : post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                                </span>
                                </div><div className="flex gap-2 flex-shrink-0 flex-wrap">{post.status === 'draft' && <button onClick={() => handleSetStatus(post, 'published')} className="px-3 py-1 text-sm rounded-md bg-green-600 hover:bg-green-700 text-white">Publish</button>}{post.status === 'published' && <button onClick={() => handleSetStatus(post, 'featured')} className="px-3 py-1 text-sm rounded-md bg-orange-600 hover:bg-orange-700 text-white">Feature</button>}{post.status === 'featured' && <button onClick={() => handleSetStatus(post, 'published')} className="px-3 py-1 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white">Archive</button>}{post.status !== 'draft' && <button onClick={() => handleSetStatus(post, 'draft')} className="px-3 py-1 text-sm rounded-md bg-gray-600 hover:bg-gray-700 text-white">Unpublish</button>}<button onClick={() => { setCurrentPost(post); setIsEditingPost(true); }} className="px-3 py-1 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white">Edit</button><button onClick={() => handlePostDelete(post.id!)} className="px-3 py-1 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white">Delete</button></div></div>))}</div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'bingo' && (
                        <div className="bg-slate-800/50 rounded-xl p-6">
                            <div className="flex border-b border-slate-700 mb-6">
                                <button onClick={() => setBingoSubTab('create')} className={`px-4 py-2 text-sm font-medium ${bingoSubTab === 'create' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'}`}>Create Game</button>
                                <button onClick={() => setBingoSubTab('manage')} className={`px-4 py-2 text-sm font-medium ${bingoSubTab === 'manage' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'}`}>Manage Teams & Players</button>
                                <button onClick={() => setBingoSubTab('submissions')} className={`px-4 py-2 text-sm font-medium ${bingoSubTab === 'submissions' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'}`}>Pending Submissions</button>
                            </div>

                            {bingoSubTab === 'create' && (
                                <div className="max-w-2xl mx-auto">
                                    <h3 className="text-xl font-semibold text-white mb-6">Create New Bingo Game</h3>
                                    <form onSubmit={handleCreateBingoGame} className="space-y-4">
                                        <div>
                                            <label htmlFor="bingoName" className="block text-sm font-medium text-gray-300 mb-1">Game Name</label>
                                            <input type="text" id="bingoName" value={newBingoName} onChange={(e) => setNewBingoName(e.target.value)} required className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white" placeholder="E.g., Summer PvM Bingo 2024" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="bingoType" className="block text-sm font-medium text-gray-300 mb-1">Game Type</label>
                                                <select id="bingoType" value={newBingoType} onChange={(e) => setNewBingoType(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white">
                                                    <option value="standard">Standard</option>
                                                    <option value="lockout">Lockout</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor="bingoSize" className="block text-sm font-medium text-gray-300 mb-1">Board Size</label>
                                                <select id="bingoSize" value={newBingoSize} onChange={(e) => setNewBingoSize(Number(e.target.value))} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white">
                                                    <option value={5}>5x5 (25 tiles)</option>
                                                    <option value={4}>4x4 (16 tiles)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="bingoPassword" className="block text-sm font-medium text-gray-300 mb-1">Game Password (Optional)</label>
                                            <input type="text" id="bingoPassword" value={newBingoPassword} onChange={(e) => setNewBingoPassword(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white" placeholder="Password for tile submissions" />
                                        </div>

                                        {/* --- NEW DURATION INPUT --- */}
                                        <div>
                                            <label htmlFor="bingoDuration" className="block text-sm font-medium text-gray-300 mb-1">Duration (Days, 0 for no automatic limit)</label>
                                            <input
                                                type="number"
                                                id="bingoDuration"
                                                value={newBingoDuration}
                                                onChange={(e) => setNewBingoDuration(Number(e.target.value))}
                                                min="0"
                                                required
                                                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
                                                placeholder="e.g., 7 for 7 days, 0 for unlimited"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="bingoTiles" className="block text-sm font-medium text-gray-300 mb-1">Tile Pool (One per line)</label>
                                            <textarea id="bingoTiles" value={newBingoTiles} onChange={(e) => setNewBingoTiles(e.target.value)} required rows={10} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white" placeholder="Obtain a Draconic Visage&#10;Complete the Fight Caves&#10;Receive a pet drop..."></textarea>
                                            <p className="text-xs text-gray-500 mt-1">You need at least {newBingoSize * newBingoSize} unique tiles.</p>
                                        </div>
                                        <button type="submit" disabled={isCreatingBingo} className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg disabled:bg-slate-600 disabled:cursor-wait">
                                            {isCreatingBingo ? 'Creating Game...' : 'Create Bingo Game'}
                                        </button>
                                        {bingoStatus && <p className="text-center text-sm mt-2 text-gray-300">{bingoStatus}</p>}
                                    </form>
                                </div>
                            )}

                            {bingoSubTab === 'manage' && (
                                <div className="max-w-4xl mx-auto">
                                    <h3 className="text-xl font-semibold text-white mb-4">Manage Teams & Players</h3>
                                    <div className="mb-4">
                                        <label htmlFor="gameSelect" className="block text-sm font-medium text-gray-300 mb-1">Select a Game to Manage</label>
                                        <select
                                            id="gameSelect"
                                            onChange={(e) => {
                                                const game = allBingoGames.find(g => g.id === Number(e.target.value));
                                                if (game) { setSelectedGameToManage(game); fetchTeamsForGame(game.id); }
                                                else { setSelectedGameToManage(null); setTeamsForSelectedGame([]); }
                                            }}
                                            value={selectedGameToManage?.id || ""}
                                            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
                                        >
                                            <option value="">-- Select a Game --</option>
                                            {allBingoGames.map(game => <option key={game.id} value={game.id}>{game.name} {game.is_active ? '' : '(Archived)'}</option>)}
                                        </select>
                                    </div>
                                    {selectedGameToManage && (
                                        <>
                                            {/* --- NEW STATUS CARD --- */}
                                            <div className="bg-slate-700/50 p-4 rounded-lg mb-6">
                                                <h4 className="font-bold text-orange-400 mb-2">Game Status & Duration:</h4>
                                                <p className="text-white text-sm">Status: <span className={`${selectedGameToManage.is_active ? 'text-green-400' : 'text-yellow-400'}`}>{selectedGameToManage.is_active ? 'Active' : 'Archived'}</span></p>
                                                <p className="text-white text-sm">Started: {new Date(selectedGameToManage.start_time).toLocaleString()}</p>
                                                <p className="text-white text-sm">
                                                    Duration: {selectedGameToManage.duration_days === 0
                                                        ? 'No automatic time limit'
                                                        : `${selectedGameToManage.duration_days} day${selectedGameToManage.duration_days === 1 ? '' : 's'}`}
                                                </p>
                                                {selectedGameToManage.duration_days > 0 && (
                                                    <p className="text-white text-sm">
                                                        Expected End: {new Date(new Date(selectedGameToManage.start_time).getTime() + selectedGameToManage.duration_days * 24 * 60 * 60 * 1000).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-6 mt-6">
                                                {teamsForSelectedGame.map(team => (
                                                    <div key={team.id} className="bg-slate-700/50 p-4 rounded-lg">
                                                        <h4 className="font-bold text-orange-400">{team.team_name}</h4>
                                                        <ul className="my-2 space-y-1 text-sm">
                                                            {team.bingo_team_members.map(member => (
                                                                <li key={member.player_id} className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                                                                    <span className="font-semibold text-white">{member.player_details?.wom_details_json?.username ?? '...'}</span>
                                                                    <button onClick={() => handleRemovePlayerFromTeam(team.id, member.player_id)} className="text-red-500 hover:text-red-400 text-xs font-bold">REMOVE</button>
                                                                </li>
                                                            ))}
                                                            {team.bingo_team_members.length === 0 && <li className="text-gray-500 text-xs italic">No players on this team yet.</li>}
                                                        </ul>
                                                        <div className="flex gap-2 mt-4">
                                                            <select
                                                                defaultValue=""
                                                                onChange={(e) => { handleAddPlayerToTeam(team.id, Number(e.target.value)); e.target.value = ""; }}
                                                                className="flex-grow bg-slate-800 border border-slate-600 rounded-lg px-3 py-1 text-white text-sm"
                                                            >
                                                                <option value="" disabled>-- Add a player --</option>
                                                                {allClanMembers
                                                                    .filter(clanMember => !teamsForSelectedGame.some(t => t.bingo_team_members.some(m => m.player_id === clanMember.id)))
                                                                    .map(member => <option key={member.id} value={member.id}>{member.displayName}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-8 pt-6 border-t border-slate-700">
                                                {selectedGameToManage.is_active ? (
                                                    <>
                                                        <button onClick={() => handleSetGameStatus(selectedGameToManage.id, false)} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg">
                                                            Archive This Game
                                                        </button>
                                                        {/* --- NEW MANUAL CLOSE BUTTON --- */}
                                                        <button onClick={() => handleCloseBingoManually(selectedGameToManage.id)} className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
                                                            Close Bingo Game Manually Now
                                                        </button>
                                                        <p className="text-xs text-center text-gray-500 mt-2">
                                                            Archiving or manually closing will immediately set the game to inactive.
                                                        </p>
                                                    </>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <button onClick={() => handleSetGameStatus(selectedGameToManage.id, true)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">
                                                            Re-activate This Game
                                                        </button>
                                                        <button onClick={() => handleDeleteGame(selectedGameToManage.id)} className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
                                                            PERMANENTLY DELETE THIS GAME
                                                        </button>
                                                        <p className="text-xs text-center text-red-400 mt-2">Warning: Deletion is irreversible and will remove all associated data.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {bingoSubTab === 'submissions' && (
                                <div className="max-w-4xl mx-auto">
                                    <h3 className="text-xl font-semibold text-white mb-6">Pending Bingo Reviews</h3>
                                    {pendingBingoSubmissions.length === 0 ? (
                                        <p className="text-gray-400 text-center">No pending bingo submissions.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {pendingBingoSubmissions.map((sub) => (
                                                <div key={sub.id} className="bg-slate-700/50 p-4 rounded-lg flex items-center justify-between flex-wrap gap-4">
                                                    <div>
                                                        <p className="text-white font-bold"> {sub.player_name ?? 'Unknown Player'} <span className="text-gray-400 font-normal"> from </span> {sub.team_name ?? 'Unknown Team'} </p>
                                                        <p className="text-gray-300 text-sm">Tile: &quot;{sub.tile_text}&quot;</p>
                                                    </div>
                                                    <div className="flex items-center space-x-4">
                                                        <a href={sub.proof_image_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm">View Proof</a>
                                                        <button onClick={() => handleManageBingoSubmission(sub.id, 'approved')} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm">Approve</button>
                                                        <button onClick={() => handleManageBingoSubmission(sub.id, 'rejected')} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm">Reject</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'post' && ( <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> <div className="md:col-span-1"><div className="bg-slate-800/50 rounded-xl p-6"><h3 className="text-lg font-semibold text-white mb-4">Add New Bounty</h3><form onSubmit={handleBountySubmit} className="space-y-4"><div><label className="block text-sm font-medium text-gray-300 mb-1">Bounty Name</label><input type="text" value={newBountyName} onChange={(e) => setNewBountyName(e.target.value)} required className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div><div><label className="block text-sm font-medium text-gray-300 mb-1">Tier</label><select value={newBountyTier} onChange={(e) => setNewBountyTier(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white"><option value="low">Low (2M GP)</option><option value="medium">Medium (5M GP)</option><option value="high">High (10M GP)</option></select></div><div><label className="block text-sm font-medium text-gray-300 mb-1">Bounty Image</label><input type="file" onChange={handleBountyFileChange} required accept="image/png, image/jpeg, image/gif, image/webp" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-orange-600/20 file:text-orange-300" /></div><button type="submit" disabled={isSubmittingBounty} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg disabled:bg-slate-600">{isSubmittingBounty ? 'Posting...' : 'Post Bounty'}</button></form></div></div> <div className="md:col-span-2"><div className="bg-slate-800/50 rounded-xl p-6"><h3 className="text-lg font-semibold text-white mb-4">Manage Existing Bounties</h3><div className="space-y-3">{bounties.map(bounty => (<div key={bounty.id} className="bg-slate-700/50 p-3 rounded-lg flex items-center justify-between"><div><p className={`font-bold ${bounty.is_active ? 'text-white' : 'text-gray-500 line-through'}`}>{bounty.name}</p><p className="text-sm text-gray-400 capitalize">{bounty.tier} Tier</p></div><div className="flex items-center space-x-2"><button onClick={() => handleBountyArchive(bounty.id, bounty.is_active)} className={`px-3 py-1 text-sm rounded-md ${bounty.is_active ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>{bounty.is_active ? 'Archive' : 'Re-activate'}</button><button onClick={() => handleBountyDelete(bounty.id)} className="px-3 py-1 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white">Delete</button></div></div>))}</div></div></div> </div> )}
                    {/* ... (Other Tabs Content) ... */}
                    {activeTab === 'validate' && ( <div className="bg-slate-800/50 rounded-xl p-6"><h3 className="text-lg font-semibold text-white mb-4">Pending Reviews</h3>{pendingSubmissions.length === 0 ? <p className="text-gray-400">No pending submissions.</p> : (<div className="space-y-4">{pendingSubmissions.map((sub) => (<div key={sub.id} className="bg-slate-700/50 p-4 rounded-lg flex items-center justify-between flex-wrap gap-4"><div><p className="text-white font-bold">{sub.player_name}</p><p className="text-gray-300 text-sm">{sub.submission_type === 'bounty' ? `Bounty: ${sub.bounties?.name ?? 'N/A'}` : `PB: ${sub.personal_best_category}`}</p></div><div className="flex items-center space-x-4"><a href={sub.proof_image_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm">View Proof</a><button onClick={() => handleUpdateStatus(sub, 'approved')} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm">Approve</button><button onClick={() => handleUpdateStatus(sub, 'rejected')} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm">Reject</button></div></div>))}</div>)}</div> )}
                    {activeTab === 'pbs' && ( <div className="bg-slate-800/50 rounded-xl p-6"><h3 className="text-lg font-semibold text-white mb-4">Manage Personal Best Records</h3><div className="space-y-3">{personalBests.length === 0 ? <p className="text-gray-400">No approved personal bests yet.</p> : personalBests.map(pb => (<div key={pb.id} className="bg-slate-700/50 p-3 rounded-lg flex items-center justify-between"><div><p className={`font-bold ${!pb.is_archived ? 'text-white' : 'text-gray-500 line-through'}`}>{pb.player_name} - {pb.personal_best_category}</p><p className="text-sm text-orange-400">Time: {pb.personal_best_time}</p></div><button onClick={() => handlePbArchive(pb.id, pb.is_archived)} className={`px-3 py-1 text-sm rounded-md ${!pb.is_archived ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>{!pb.is_archived ? 'Archive' : 'Re-activate'}</button></div>))}</div></div> )}
                    {activeTab === 'tradelog' && ( <div className="bg-slate-800/50 rounded-xl p-6"><h3 className="text-lg font-semibold text-white mb-4">Manage Bounty Payouts</h3><p className="text-sm text-gray-400 mb-6">A list of all approved bounties. Log, update, or remove trade proof screenshots.</p>{approvedBounties.length === 0 ? <p className="text-gray-400">No approved bounties found.</p> : (<div className="space-y-6">{approvedBounties.map((submission) => (<div key={submission.id} className="bg-slate-700/50 p-4 rounded-lg"><p className="text-white font-bold">{submission.player_name}</p><p className="text-gray-300 text-sm">Bounty: {submission.bounties?.name ?? 'N/A'}</p>{submission.trade_proof_url ? (<div className="mt-4 flex flex-col sm:flex-row items-center gap-4"><a href={submission.trade_proof_url} target="_blank" rel="noopener noreferrer" className="flex-grow w-full text-center sm:text-left text-blue-400 hover:underline">View Logged Trade Proof</a><button onClick={() => handleTradeProofRemove(submission)} disabled={isLoggingTrade && selectedSubmissionId === submission.id} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg disabled:bg-slate-600">{isLoggingTrade && selectedSubmissionId === submission.id ? 'Removing...' : 'Remove Proof'}</button></div>) : (<form onSubmit={(e) => handleTradeLogSubmit(e, submission.id)} className="mt-4 flex flex-col sm:flex-row items-center gap-4"><input type="file" onChange={(e) => { setSelectedSubmissionId(submission.id); setTradeProofFile(e.target.files ? e.target.files[0] : null); }} required accept="image/*" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-600/20 file:text-blue-300"/><button type="submit" disabled={isLoggingTrade && selectedSubmissionId === submission.id} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:bg-slate-600 whitespace-nowrap">{isLoggingTrade && selectedSubmissionId === submission.id ? 'Logging...' : 'Log Trade'}</button></form>)}</div>))}</div>)}</div> )}
                    {activeTab === 'settings' && (
                        <div className="bg-slate-800/50 rounded-xl p-6 max-w-lg mx-auto">
                            <h3 className="text-lg font-semibold text-white mb-4">Submission Settings</h3>
                            <form onSubmit={handleUpdateSettings} className="space-y-6">
                                <div><label className="flex items-center"><input type="checkbox" checked={isPasswordRequired} onChange={(e) => setIsPasswordRequired(e.target.checked)} className="h-4 w-4 rounded text-orange-600 bg-slate-700 border-slate-600 focus:ring-orange-500" /><span className="ml-3 text-gray-300">Require Password for Submissions</span></label></div>
                                {isPasswordRequired && (<div><label htmlFor="submissionPassword" className="block text-sm font-medium text-gray-300 mb-2">Submission Password</label><input type="text" id="submissionPassword" value={submissionPassword} onChange={(e) => setSubmissionPassword(e.target.value)} placeholder="Enter the password for members" className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500" /><p className="text-xs text-gray-500 mt-1">Leave blank to remove the password.</p></div>)}
                                <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg">Save Settings</button>
                                {settingsStatus && <p className="text-center text-sm text-green-400">{settingsStatus}</p>}

                                <div className="pt-6 mt-6 border-t border-slate-700">
                                    <h3 className="text-lg font-semibold text-white mb-4">Clan Data Management</h3>
                                    <div className="mb-6 bg-slate-700/50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-300 mb-3"> <strong>Step 1:</strong> Trigger the mass-update on the Wise Old Man website. </p>
                                        <a href="https://wiseoldman.net/groups/5622?dialog=update-all" target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg"> Button to our WOM group update </a>
                                        <p className="text-xs text-gray-400 mt-2"> Enter WOM group code. Wait 10 Minutes before starting step 2. </p>
                                    </div>
                                    <div className="mb-6">
                                        <p className="text-sm text-gray-300 mb-2"> <strong>Step 2 (Slow Update):</strong> After updating on WOM, click here to pull all the fresh data into our database. This will take at least 10 minutes. Wait for it to finish and do not close the browser </p>
                                        <button type="button" onClick={handleWomGroupSync} disabled={isSyncingWom} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg disabled:bg-slate-600 disabled:cursor-wait"> {isSyncingWom ? 'Syncing Group Data...' : 'Sync Group Data from WOM'} </button>
                                        {womSyncStatus && (<p className="text-center text-sm mt-4 text-gray-300">{womSyncStatus}</p>)}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400 mb-2"> <strong>Step 3:</strong> Once the data is synced, recalculate all clan ranks. Instant process </p>
                                        <button type="button" onClick={handleCalculateRanks} disabled={isRefreshing} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:bg-slate-600 disabled:cursor-wait"> {isRefreshing ? 'Calculating Ranks...' : 'Calculate Ranks Now'} </button>
                                        {refreshStatus && (<p className="text-center text-sm mt-4 text-gray-300">{refreshStatus}</p>)}
                                    </div>
                                </div>
                                <div className="pt-6 mt-6 border-t border-slate-700">
                                    <h3 className="text-lg font-semibold text-white mb-4">Player Spotlight Generation</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Manual Player Update</label>
                                            <div className="flex gap-2">
                                                <select value={selectedPlayerId} onChange={(e) => setSelectedPlayerId(e.target.value)} className="flex-grow bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                                                    {allClanMembers.map(member => (<option key={member.id} value={member.id.toString()}>{member.displayName}</option>))}
                                                </select>
                                                <button type="button" onClick={handleSingleSpotlightUpdate} disabled={isUpdatingSingle} className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg disabled:bg-slate-600 whitespace-nowrap">{isUpdatingSingle ? 'Updating...' : 'Update Player'}</button>
                                            </div>
                                            {singleUpdateStatus && (<p className="text-center text-sm mt-2 text-gray-300">{singleUpdateStatus}</p>)}
                                        </div>
                                        <div className="relative flex py-3 items-center"><div className="flex-grow border-t border-slate-600"></div><span className="flex-shrink mx-4 text-xs text-gray-500">OR</span><div className="flex-grow border-t border-slate-600"></div></div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Batch Update</label>
                                            <p className="text-xs text-gray-400 mb-2">Scans players who haven&apos;t been checked recently and generates images.</p>
                                            <button type="button" onClick={handleGenerateSpotlight} disabled={isGeneratingSpotlight} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg disabled:bg-slate-600 disabled:cursor-wait">{isGeneratingSpotlight ? 'Generating Images...' : 'Generate Spotlight Images (Batch)'}</button>
                                            {spotlightStatus && (<p className="text-center text-sm mt-2 text-gray-300">{spotlightStatus}</p>)}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}