// app/admin/page.tsx - FINAL with display bug and syntax error fixed

'use client';

import { useEffect, useState, FormEvent, ChangeEvent, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminLogin from '@/components/AdminLogin';
import Header from '@/components/Header';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// Interfaces
interface Bounty { id: number; name: string; tier: string; image_url: string; is_active: boolean; created_at: string; }
// Corrected Submission interface to handle the joined data
interface Submission { id: number; created_at: string; player_name: string; submission_type: string; personal_best_category: string | null; proof_image_url: string; is_archived: boolean; status: string; bounty_tier: 'low' | 'medium' | 'high' | null; personal_best_time: string | null; trade_proof_url: string | null; bounty_id: number | null; bounties: { name: string; } | null; }

export default function AdminPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('validate');
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
    const [approvedBounties, setApprovedBounties] = useState<Submission[]>([]);
    const [tradeProofFile, setTradeProofFile] = useState<File | null>(null);
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
    const [isLoggingTrade, setIsLoggingTrade] = useState(false);
    const router = useRouter();

    const fetchBounties = useCallback(async () => {
        const { data, error } = await supabase.from('bounties').select('*').order('created_at', { ascending: false });
        if (error) console.error('Error fetching bounties:', error); else setBounties(data || []);
    }, []);
    const fetchPendingSubmissions = useCallback(async () => {
        const { data, error } = await supabase.from('submissions').select('*, bounties(name)').eq('status', 'pending').order('created_at', { ascending: true });
        if (error) console.error('Error fetching pending submissions:', error); else setPendingSubmissions(data || []);
    }, []);
    const fetchPersonalBests = useCallback(async () => {
        const { data, error } = await supabase.from('submissions').select('*').eq('status', 'approved').eq('submission_type', 'personal_best').order('created_at', { ascending: false });
        if (error) console.error('Error fetching PBs:', error); else setPersonalBests((data as Submission[]) || []);
    }, []);
    const fetchSettings = useCallback(async () => {
        const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
        if (error) console.error("Error fetching settings:", error); else if (data) { setIsPasswordRequired(data.is_password_required); setSubmissionPassword(data.submission_password || ''); }
    }, []);
    const fetchApprovedBounties = useCallback(async () => {
        const { data, error } = await supabase.from('submissions').select('*, bounties(name)').eq('status', 'approved').eq('submission_type', 'bounty').order('created_at', { ascending: false });
        if (error) console.error("Error fetching approved bounties:", error); else setApprovedBounties(data || []);
    }, []);

    const checkUserAndLoadData = useCallback(async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
            await Promise.all([fetchPendingSubmissions(), fetchBounties(), fetchPersonalBests(), fetchSettings(), fetchApprovedBounties()]);
        }
        setLoading(false);
    }, [fetchBounties, fetchPendingSubmissions, fetchPersonalBests, fetchSettings, fetchApprovedBounties]);

    useEffect(() => { checkUserAndLoadData(); }, [checkUserAndLoadData]);

    const handleUpdateStatus = useCallback(async (submissionToUpdate: Submission, newStatus: 'approved' | 'rejected') => {
        const { error: submissionUpdateError } = await supabase.from('submissions').update({ status: newStatus }).eq('id', submissionToUpdate.id);
        if (submissionUpdateError) { alert(`Error updating submission: ${submissionUpdateError.message}`); return; }
        if (newStatus === 'approved' && submissionToUpdate.submission_type === 'bounty' && submissionToUpdate.bounties?.name) {
            const { error: bountyUpdateError } = await supabase.from('bounties').update({ is_active: false }).eq('name', submissionToUpdate.bounties.name);
            if (bountyUpdateError) alert(`Submission approved, but failed to auto-archive bounty: ${bountyUpdateError.message}`);
        }
        await Promise.all([fetchPendingSubmissions(), fetchBounties(), fetchApprovedBounties()]);
        if (newStatus === 'approved' && submissionToUpdate.submission_type === 'personal_best') await fetchPersonalBests();
    }, [fetchBounties, fetchPendingSubmissions, fetchPersonalBests, fetchApprovedBounties]);

    const handleBountyFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setNewBountyFile(null);
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) { alert("Invalid file type."); e.target.value = ''; return; }
            setNewBountyFile(file);
        }
    }, []);

    const handleBountySubmit = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        if (!newBountyFile || !newBountyName) { alert("Please provide a bounty name and select an image."); return; }
        setIsSubmittingBounty(true);
        try {
            const fileName = `${Date.now()}.${newBountyFile.name.split('.').pop()}`;
            const { error: uError } = await supabase.storage.from('bounty-images').upload(fileName, newBountyFile);
            if (uError) throw uError;
            const { data: urlData } = supabase.storage.from('bounty-images').getPublicUrl(fileName);
            const { error: iError } = await supabase.from('bounties').insert([{ name: newBountyName, tier: newBountyTier, image_url: urlData.publicUrl, is_active: true }]);
            if (iError) throw iError;
            setNewBountyName(''); setNewBountyTier('low'); setNewBountyFile(null);
            (e.target as HTMLFormElement).reset();
            await fetchBounties();
        } catch (error: any) { alert(`Error submitting bounty: ${error.message}`); }
        finally { setIsSubmittingBounty(false); }
    }, [newBountyFile, newBountyName, newBountyTier, fetchBounties]);

    const handleBountyArchive = useCallback(async (id: number, currentStatus: boolean) => {
        const { error } = await supabase.from('bounties').update({ is_active: !currentStatus }).eq('id', id);
        if (error) alert(`Error: ${error.message}`); else await fetchBounties();
    }, [fetchBounties]);

    const handleBountyDelete = useCallback(async (id: number) => {
        if (window.confirm("Are you sure you want to permanently delete this bounty? This action cannot be undone.")) {
            const { error } = await supabase.from('bounties').delete().eq('id', id);
            if (error) { alert(`Error deleting bounty: ${error.message}`); }
            else { await fetchBounties(); }
        }
    }, [fetchBounties]);

    const handlePbArchive = useCallback(async (id: number, currentStatus: boolean) => {
        const { error } = await supabase.from('submissions').update({ is_archived: !currentStatus }).eq('id', id);
        if (error) alert(`Error: ${error.message}`); else await fetchPersonalBests();
    }, [fetchPersonalBests]);

    const handleTradeLogSubmit = useCallback(async (e: FormEvent, submissionId: number) => {
        e.preventDefault();
        if (!tradeProofFile) { alert("Please select a trade proof screenshot."); return; }
        setIsLoggingTrade(true); setSelectedSubmissionId(submissionId);
        try {
            const fileName = `trade-${submissionId}-${Date.now()}.${tradeProofFile.name.split('.').pop()}`;
            const { error: uploadError } = await supabase.storage.from('trade-proofs').upload(fileName, tradeProofFile);
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('trade-proofs').getPublicUrl(fileName);
            const { error: updateError } = await supabase.from('submissions').update({ trade_proof_url: urlData.publicUrl }).eq('id', submissionId);
            if (updateError) throw updateError;
            alert("Trade proof logged successfully!");
            setTradeProofFile(null); (e.target as HTMLFormElement).reset();
            await fetchApprovedBounties();
        } catch (error: any) { alert(`Error logging trade proof: ${error.message}`); }
        finally { setIsLoggingTrade(false); setSelectedSubmissionId(null); }
    }, [tradeProofFile, fetchApprovedBounties]);

    const handleTradeProofRemove = useCallback(async (submission: Submission) => {
        if (!submission.trade_proof_url) return;
        if (!window.confirm("Are you sure you want to remove this trade proof?")) return;
        setIsLoggingTrade(true); setSelectedSubmissionId(submission.id);
        try {
            const fileName = submission.trade_proof_url.split('/').pop();
            if (fileName) {
                await supabase.storage.from('trade-proofs').remove([fileName]);
            }
            await supabase.from('submissions').update({ trade_proof_url: null }).eq('id', submission.id);
            alert("Trade proof removed successfully.");
            await fetchApprovedBounties();
        } catch (error: any) { alert(`Error removing trade proof: ${error.message}`); }
        finally { setIsLoggingTrade(false); setSelectedSubmissionId(null); }
    }, [fetchApprovedBounties]);

    const handleUpdateSettings = useCallback(async (e: FormEvent) => {
        e.preventDefault(); setSettingsStatus('Saving...');
        const { error } = await supabase.from('settings').update({ is_password_required: isPasswordRequired, submission_password: submissionPassword || null }).eq('id', 1);
        if (error) setSettingsStatus(`Error: ${error.message}`); else { setSettingsStatus('Settings saved!'); setTimeout(() => setSettingsStatus(''), 2000); }
    }, [isPasswordRequired, submissionPassword]);

    const handleLogout = useCallback(async () => { await supabase.auth.signOut(); setUser(null); router.push('/'); }, [router]);
    const handleRefreshData = useCallback(async () => {
        setIsRefreshing(true); setRefreshStatus('Refreshing, please wait...');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Authentication error.");
            const response = await fetch('/api/refresh-clan-data', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Unknown error.');
            setRefreshStatus(result.message);
        } catch (error: any) { setRefreshStatus(`Error: ${error.message}`); }
        finally { setIsRefreshing(false); setTimeout(() => setRefreshStatus(''), 5000); }
    }, []);

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
    if (!user) return <AdminLogin onLogin={checkUserAndLoadData} />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Header />
            <main className="px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6"><h1 className="text-3xl font-bold text-white">Admin Panel</h1><button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg">Logout</button></div>
                    <div className="flex border-b border-slate-700 mb-6 overflow-x-auto">
                        <button onClick={() => setActiveTab('post')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'post' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'}`}>Post Bounties</button>
                        <button onClick={() => setActiveTab('validate')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'validate' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'}`}>Validate Bounties</button>
                        <button onClick={() => setActiveTab('pbs')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'pbs' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'}`}>Manage PBs</button>
                        <button onClick={() => setActiveTab('tradelog')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'tradelog' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'}`}>Trade Log</button>
                        <button onClick={() => setActiveTab('settings')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'settings' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'}`}>Site Settings</button>
                    </div>

                    {activeTab === 'post' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1"><div className="bg-slate-800/50 rounded-xl p-6"><h3 className="text-lg font-semibold text-white mb-4">Add New Bounty</h3><form onSubmit={handleBountySubmit} className="space-y-4"><div><label className="block text-sm font-medium text-gray-300 mb-1">Bounty Name</label><input type="text" value={newBountyName} onChange={(e) => setNewBountyName(e.target.value)} required className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div><div><label className="block text-sm font-medium text-gray-300 mb-1">Tier</label><select value={newBountyTier} onChange={(e) => setNewBountyTier(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white"><option value="low">Low (2M GP)</option><option value="medium">Medium (5M GP)</option><option value="high">High (10M GP)</option></select></div><div><label className="block text-sm font-medium text-gray-300 mb-1">Bounty Image</label><input type="file" onChange={handleBountyFileChange} required accept="image/png, image/jpeg, image/gif, image/webp" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-orange-600/20 file:text-orange-300" /></div><button type="submit" disabled={isSubmittingBounty} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg disabled:bg-slate-600">{isSubmittingBounty ? 'Posting...' : 'Post Bounty'}</button></form></div></div>
                            <div className="md:col-span-2"><div className="bg-slate-800/50 rounded-xl p-6"><h3 className="text-lg font-semibold text-white mb-4">Manage Existing Bounties</h3><div className="space-y-3">{bounties.map(bounty => (<div key={bounty.id} className="bg-slate-700/50 p-3 rounded-lg flex items-center justify-between"><div><p className={`font-bold ${bounty.is_active ? 'text-white' : 'text-gray-500 line-through'}`}>{bounty.name}</p><p className="text-sm text-gray-400 capitalize">{bounty.tier} Tier</p></div><div className="flex items-center space-x-2"><button onClick={() => handleBountyArchive(bounty.id, bounty.is_active)} className={`px-3 py-1 text-sm rounded-md ${bounty.is_active ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>{bounty.is_active ? 'Archive' : 'Re-activate'}</button><button onClick={() => handleBountyDelete(bounty.id)} className="px-3 py-1 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white">Delete</button></div></div>))}</div></div></div>
                        </div>
                    )}
                    {activeTab === 'validate' && (
                        <div className="bg-slate-800/50 rounded-xl p-6"><h3 className="text-lg font-semibold text-white mb-4">Pending Reviews</h3>{pendingSubmissions.length === 0 ? <p className="text-gray-400">No pending submissions.</p> : (<div className="space-y-4">{pendingSubmissions.map((sub) => (<div key={sub.id} className="bg-slate-700/50 p-4 rounded-lg flex items-center justify-between flex-wrap gap-4"><div><p className="text-white font-bold">{sub.player_name}</p><p className="text-gray-300 text-sm">{sub.submission_type === 'bounty' ? `Bounty: ${sub.bounties?.name ?? 'N/A'}` : `PB: ${sub.personal_best_category}`}</p></div><div className="flex items-center space-x-4"><a href={sub.proof_image_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm">View Proof</a><button onClick={() => handleUpdateStatus(sub, 'approved')} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm">Approve</button><button onClick={() => handleUpdateStatus(sub, 'rejected')} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm">Reject</button></div></div>))}</div>)}</div>
                    )}
                    {activeTab === 'pbs' && (
                        <div className="bg-slate-800/50 rounded-xl p-6"><h3 className="text-lg font-semibold text-white mb-4">Manage Personal Best Records</h3><div className="space-y-3">{personalBests.length === 0 ? <p className="text-gray-400">No approved personal bests yet.</p> : personalBests.map(pb => (<div key={pb.id} className="bg-slate-700/50 p-3 rounded-lg flex items-center justify-between"><div><p className={`font-bold ${!pb.is_archived ? 'text-white' : 'text-gray-500 line-through'}`}>{pb.player_name} - {pb.personal_best_category}</p><p className="text-sm text-orange-400">Time: {pb.personal_best_time}</p></div><button onClick={() => handlePbArchive(pb.id, pb.is_archived)} className={`px-3 py-1 text-sm rounded-md ${!pb.is_archived ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>{!pb.is_archived ? 'Archive' : 'Re-activate'}</button></div>))}</div></div>
                    )}
                    {activeTab === 'tradelog' && (
                        <div className="bg-slate-800/50 rounded-xl p-6"><h3 className="text-lg font-semibold text-white mb-4">Manage Bounty Payouts</h3><p className="text-sm text-gray-400 mb-6">A list of all approved bounties. Log, update, or remove trade proof screenshots.</p>{approvedBounties.length === 0 ? <p className="text-gray-400">No approved bounties found.</p> : (<div className="space-y-6">{approvedBounties.map((submission) => (<div key={submission.id} className="bg-slate-700/50 p-4 rounded-lg"><p className="text-white font-bold">{submission.player_name}</p><p className="text-gray-300 text-sm">Bounty: {submission.bounties?.name ?? 'N/A'}</p>{submission.trade_proof_url ? (<div className="mt-4 flex flex-col sm:flex-row items-center gap-4"><a href={submission.trade_proof_url} target="_blank" rel="noopener noreferrer" className="flex-grow w-full text-center sm:text-left text-blue-400 hover:underline">View Logged Trade Proof</a><button onClick={() => handleTradeProofRemove(submission)} disabled={isLoggingTrade && selectedSubmissionId === submission.id} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg disabled:bg-slate-600">{isLoggingTrade && selectedSubmissionId === submission.id ? 'Removing...' : 'Remove Proof'}</button></div>) : (<form onSubmit={(e) => handleTradeLogSubmit(e, submission.id)} className="mt-4 flex flex-col sm:flex-row items-center gap-4"><input type="file" onChange={(e) => { setSelectedSubmissionId(submission.id); setTradeProofFile(e.target.files ? e.target.files[0] : null); }} required accept="image/*" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-600/20 file:text-blue-300"/><button type="submit" disabled={isLoggingTrade && selectedSubmissionId === submission.id} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:bg-slate-600 whitespace-nowrap">{isLoggingTrade && selectedSubmissionId === submission.id ? 'Logging...' : 'Log Trade'}</button></form>)}</div>))}</div>)}</div>
                    )}
                    {activeTab === 'settings' && (
                        <div className="bg-slate-800/50 rounded-xl p-6 max-w-lg mx-auto"><h3 className="text-lg font-semibold text-white mb-4">Submission Settings</h3><form onSubmit={handleUpdateSettings} className="space-y-6"><div><label className="flex items-center"><input type="checkbox" checked={isPasswordRequired} onChange={(e) => setIsPasswordRequired(e.target.checked)} className="h-4 w-4 rounded text-orange-600 bg-slate-700 border-slate-600 focus:ring-orange-500" /><span className="ml-3 text-gray-300">Require Password for Submissions</span></label></div>{isPasswordRequired && (<div><label htmlFor="submissionPassword" className="block text-sm font-medium text-gray-300 mb-2">Submission Password</label><input type="text" id="submissionPassword" value={submissionPassword} onChange={(e) => setSubmissionPassword(e.target.value)} placeholder="Enter the password for members" className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500" /><p className="text-xs text-gray-500 mt-1">Leave blank to remove the password.</p></div>)}<button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg">Save Settings</button>{settingsStatus && <p className="text-center text-sm text-green-400">{settingsStatus}</p>}<div className="pt-6 mt-6 border-t border-slate-700"><h3 className="text-lg font-semibold text-white mb-4">Manual Data Refresh</h3><p className="text-sm text-gray-400 mb-4">Click this button to manually update all clan data from Wise Old Man.</p><button type="button" onClick={handleRefreshData} disabled={isRefreshing} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:bg-slate-600 disabled:cursor-wait">{isRefreshing ? 'Refreshing Data...' : 'Refresh Clan Data Now'}</button>{refreshStatus && (<p className="text-center text-sm mt-4 text-gray-300">{refreshStatus}</p>)}</div></form></div>
                    )}
                </div>
            </main>
        </div>
    );
}