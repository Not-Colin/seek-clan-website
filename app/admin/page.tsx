// app/admin/page.tsx - FINAL VERSION

'use client';

import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminLogin from '@/components/AdminLogin';
import Header from '@/components/Header';
import type { User } from '@supabase/supabase-js';

// Interfaces
interface Submission { id: number; created_at: string; player_name: string; submission_type: string; bounty_name: string | null; personal_best_category: string | null; proof_image_url: string; is_archived: boolean; status: string; }
interface Bounty { id: number; name: string; tier: string; image_url: string; is_active: boolean; created_at: string; }

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('post');

  // State for all tabs
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [personalBests, setPersonalBests] = useState<Submission[]>([]);

  // State for bounty form
  const [newBountyName, setNewBountyName] = useState('');
  const [newBountyTier, setNewBountyTier] = useState('low');
  const [newBountyFile, setNewBountyFile] = useState<File | null>(null);
  const [isSubmittingBounty, setIsSubmittingBounty] = useState(false);

  // State for Site Settings Tab
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [submissionPassword, setSubmissionPassword] = useState('');
  const [settingsStatus, setSettingsStatus] = useState('');

  // --- Fetching Functions ---
  const fetchPendingSubmissions = async () => { const { data, error } = await supabase.from('submissions').select('*').eq('status', 'pending').order('created_at', { ascending: true }); if (error) console.error('Error fetching pending submissions:', error); else setPendingSubmissions(data || []); };
  const fetchBounties = async () => { const { data, error } = await supabase.from('bounties').select('*').order('created_at', { ascending: false }); if (error) console.error('Error fetching bounties:', error); else setBounties(data || []); };
  const fetchPersonalBests = async () => { const { data, error } = await supabase.from('submissions').select('*').eq('status', 'approved').eq('submission_type', 'personal_best').order('created_at', { ascending: false }); if (error) console.error('Error fetching PBs:', error); else setPersonalBests((data as Submission[]) || []); };
  const fetchSettings = async () => { const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single(); if (error) { console.error("Error fetching settings:", error); } else if (data) { setIsPasswordRequired(data.is_password_required); setSubmissionPassword(data.submission_password || ''); } };

  // --- Core Auth Function ---
  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    if (currentUser) {
      await Promise.all([ fetchPendingSubmissions(), fetchBounties(), fetchPersonalBests(), fetchSettings() ]);
    }
    setLoading(false);
  };

  useEffect(() => { checkUser(); }, []);

  // --- Handler Functions ---
  const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected') => { const { error } = await supabase.from('submissions').update({ status }).eq('id', id); if (error) { alert(`Error: ${error.message}`); } else { await fetchPendingSubmissions(); if (status === 'approved') { await fetchPersonalBests(); } } };
  const handleBountyFileChange = (e: ChangeEvent<HTMLInputElement>) => { setNewBountyFile(null); if (e.target.files && e.target.files.length > 0) { const file = e.target.files[0]; const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']; if (!allowedTypes.includes(file.type)) { alert("Invalid file type. Please upload a PNG, JPG, GIF, or WEBP image."); e.target.value = ''; return; } setNewBountyFile(file); } };
  const handleBountySubmit = async (e: FormEvent) => { e.preventDefault(); if (!newBountyFile || !newBountyName) return; setIsSubmittingBounty(true); try { const fileName = `${Date.now()}.${newBountyFile.name.split('.').pop()}`; const { error: uError } = await supabase.storage.from('bounty-images').upload(fileName, newBountyFile); if (uError) throw uError; const { data: urlData } = supabase.storage.from('bounty-images').getPublicUrl(fileName); const { error: iError } = await supabase.from('bounties').insert([{ name: newBountyName, tier: newBountyTier, image_url: urlData.publicUrl, is_active: true }]); if (iError) throw iError; setNewBountyName(''); setNewBountyTier('low'); setNewBountyFile(null); const form = e.target as HTMLFormElement; form.reset(); await fetchBounties(); } catch (error: any) { alert(`Error: ${error.message}`); } finally { setIsSubmittingBounty(false); } };
  const handleBountyArchive = async (id: number, currentStatus: boolean) => { const { error } = await supabase.from('bounties').update({ is_active: !currentStatus }).eq('id', id); if (error) alert(`Error: ${error.message}`); else await fetchBounties(); };
  const handlePbArchive = async (id: number, currentStatus: boolean) => { const { error } = await supabase.from('submissions').update({ is_archived: !currentStatus }).eq('id', id); if (error) alert(`Error updating PB: ${error.message}`); else await fetchPersonalBests(); };
  const handleUpdateSettings = async (e: FormEvent) => { e.preventDefault(); setSettingsStatus('Saving...'); const { error } = await supabase.from('settings').update({ is_password_required: isPasswordRequired, submission_password: submissionPassword || null }).eq('id', 1); if (error) { setSettingsStatus(`Error: ${error.message}`); } else { setSettingsStatus('Settings saved successfully!'); setTimeout(() => setSettingsStatus(''), 2000); } };
  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <AdminLogin onLogin={checkUser} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6"><h1 className="text-3xl font-bold text-white">Admin Panel</h1><button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg">Logout</button></div>
          <div className="flex border-b border-slate-700 mb-6"><button onClick={() => setActiveTab('post')} className={`px-4 py-3 text-sm font-medium ${activeTab === 'post' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'}`}>Post Bounties</button><button onClick={() => setActiveTab('validate')} className={`px-4 py-3 text-sm font-medium ${activeTab === 'validate' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'}`}>Validate Bounties</button><button onClick={() => setActiveTab('pbs')} className={`px-4 py-3 text-sm font-medium ${activeTab === 'pbs' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'}`}>Manage Personal Bests</button><button onClick={() => setActiveTab('settings')} className={`px-4 py-3 text-sm font-medium ${activeTab === 'settings' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'}`}>Site Settings</button></div>

          {activeTab === 'post' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1"><div className="bg-slate-800/50 rounded-xl p-6"><h3 className="text-lg font-semibold text-white mb-4">Add New Bounty</h3><form onSubmit={handleBountySubmit} className="space-y-4"><div><label className="block text-sm font-medium text-gray-300 mb-1">Bounty Name</label><input type="text" value={newBountyName} onChange={(e) => setNewBountyName(e.target.value)} required className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div><div><label className="block text-sm font-medium text-gray-300 mb-1">Tier</label><select value={newBountyTier} onChange={(e) => setNewBountyTier(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white"><option value="low">Low (2M GP)</option><option value="medium">Medium (5M GP)</option><option value="high">High (10M GP)</option></select></div><div><label className="block text-sm font-medium text-gray-300 mb-1">Bounty Image</label><input type="file" onChange={handleBountyFileChange} required accept="image/png, image/jpeg, image/gif, image/webp" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-orange-600/20 file:text-orange-300" /></div><button type="submit" disabled={isSubmittingBounty} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg disabled:bg-slate-600">{isSubmittingBounty ? 'Posting...' : 'Post Bounty'}</button></form></div></div>
              <div className="md:col-span-2"><div className="bg-slate-800/50 rounded-xl p-6"><h3 className="text-lg font-semibold text-white mb-4">Manage Existing Bounties</h3><div className="space-y-3">{bounties.map(bounty => (<div key={bounty.id} className="bg-slate-700/50 p-3 rounded-lg flex items-center justify-between"><div><p className={`font-bold ${bounty.is_active ? 'text-white' : 'text-gray-500 line-through'}`}>{bounty.name}</p><p className="text-sm text-gray-400 capitalize">{bounty.tier} Tier</p></div><button onClick={() => handleBountyArchive(bounty.id, bounty.is_active)} className={`px-3 py-1 text-sm rounded-md ${bounty.is_active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>{bounty.is_active ? 'Archive' : 'Re-activate'}</button></div>))}</div></div></div>
            </div>
          )}
          {activeTab === 'validate' && (
            <div className="bg-slate-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Pending Reviews</h3>
              {pendingSubmissions.length === 0 ? <p className="text-gray-400">No pending submissions.</p> : (<div className="space-y-4">{pendingSubmissions.map((sub) => (<div key={sub.id} className="bg-slate-700/50 p-4 rounded-lg flex items-center justify-between flex-wrap gap-4"><div><p className="text-white font-bold">{sub.player_name}</p><p className="text-gray-300 text-sm">{sub.submission_type === 'bounty' ? `Bounty: ${sub.bounty_name}` : `PB: ${sub.personal_best_category}`}</p></div><div className="flex items-center space-x-4"><a href={sub.proof_image_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm">View Proof</a><button onClick={() => handleUpdateStatus(sub.id, 'approved')} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm">Approve</button><button onClick={() => handleUpdateStatus(sub.id, 'rejected')} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm">Reject</button></div></div>))}</div>)}
            </div>
          )}
          {activeTab === 'pbs' && (
            <div className="bg-slate-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Manage Personal Best Records</h3>
              <div className="space-y-3">{personalBests.length === 0 ? <p className="text-gray-400">No approved personal bests yet.</p> : personalBests.map(pb => (<div key={pb.id} className="bg-slate-700/50 p-3 rounded-lg flex items-center justify-between"><div><p className={`font-bold ${!pb.is_archived ? 'text-white' : 'text-gray-500 line-through'}`}>{pb.player_name} - {pb.personal_best_category}</p><p className="text-sm text-orange-400">Time: {pb.personal_best_time}</p></div><button onClick={() => handlePbArchive(pb.id, pb.is_archived)} className={`px-3 py-1 text-sm rounded-md ${!pb.is_archived ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>{!pb.is_archived ? 'Archive' : 'Re-activate'}</button></div>))}</div>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="bg-slate-800/50 rounded-xl p-6 max-w-lg mx-auto">
              <h3 className="text-lg font-semibold text-white mb-4">Submission Settings</h3>
              <form onSubmit={handleUpdateSettings} className="space-y-6">
                <div><label className="flex items-center"><input type="checkbox" checked={isPasswordRequired} onChange={(e) => setIsPasswordRequired(e.target.checked)} className="h-4 w-4 rounded text-orange-600 bg-slate-700 border-slate-600 focus:ring-orange-500" /><span className="ml-3 text-gray-300">Require Password for Submissions</span></label></div>
                {isPasswordRequired && (<div><label htmlFor="submissionPassword" className="block text-sm font-medium text-gray-300 mb-2">Submission Password</label><input type="text" id="submissionPassword" value={submissionPassword} onChange={(e) => setSubmissionPassword(e.target.value)} placeholder="Enter the password for members" className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500" /><p className="text-xs text-gray-500 mt-1">Leave blank to remove the password.</p></div>)}
                <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg">Save Settings</button>
                {settingsStatus && <p className="text-center text-sm text-green-400">{settingsStatus}</p>}
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}