// app/submit/page.tsx

'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabaseClient';
import { useSearchParams } from 'next/navigation';

interface Bounty {
  id: number;
  name: string;
  tier: 'low' | 'medium' | 'high';
}

const pbCategories = [
  'Challenge Mode Chambers of Xeric',
  'Chambers of Xeric',
  'Fight Caves',
  'Fortis Colosseum',
  'Inferno',
  'Theatre of Blood',
  'Theatre of Blood: Hard Mode',
  'Tombs of Amascut: Expert Mode',
  'Tombs of Amascut',
];

export default function SubmitPage() {
  const searchParams = useSearchParams();

  const [submissionType, setSubmissionType] = useState('bounty');
  const [playerName, setPlayerName] = useState('');
  const [selectedBounty, setSelectedBounty] = useState('');
  const [pbCategory, setPbCategory] = useState(pbCategories[0]);
  const [pbTime, setPbTime] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ message: '', type: '' });

  useEffect(() => {
    const fetchAndSetBounties = async () => {
      const { data, error } = await supabase.from('bounties').select('id, name, tier').eq('is_active', true);

      if (error) {
        console.error('Error fetching bounties:', error);
      } else if (data) {
        setBounties(data as Bounty[]);
        const bountyFromUrl = searchParams.get('bounty');
        if (bountyFromUrl && data.some(b => b.name === decodeURIComponent(bountyFromUrl))) {
          setSelectedBounty(decodeURIComponent(bountyFromUrl));
        } else if (data.length > 0) {
          setSelectedBounty(data[0].name);
        }
      }
    };
    fetchAndSetBounties();
  }, [searchParams]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > MAX_FILE_SIZE) {
        setSubmitStatus({ message: `File size cannot exceed 50MB.`, type: 'error' });
        e.target.value = '';
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setSubmitStatus({ message: '', type: '' });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !playerName) {
      setSubmitStatus({ message: 'Player name and screenshot are required.', type: 'error' });
      return;
    }

    setLoading(true);
    setSubmitStatus({ message: 'Submitting...', type: 'info' });

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('proof-images').upload(fileName, selectedFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('proof-images').getPublicUrl(fileName);

      const submissionData = {
        player_name: playerName,
        submission_type: submissionType,
        proof_image_url: urlData.publicUrl,
        bounty_name: submissionType === 'bounty' ? selectedBounty : null,
        bounty_tier: submissionType === 'bounty' ? bounties.find(b => b.name === selectedBounty)?.tier : null,
        personal_best_category: submissionType === 'personal_best' ? pbCategory : null,
        personal_best_time: submissionType === 'personal_best' ? pbTime : null,
        is_archived: false,
      };

      const { error: insertError } = await supabase.from('submissions').insert([submissionData]);
      if (insertError) throw insertError;

      setSubmitStatus({ message: 'Submission successful! Awaiting admin approval.', type: 'success' });
      const form = e.target as HTMLFormElement;
      form.reset();
      setPlayerName('');
      setPbTime('');
      setSelectedFile(null);
    } catch (error: any) {
      console.error('Submission Error:', error);
      setSubmitStatus({ message: `Error: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Header />
      <main className="px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
            <h1 className="text-3xl font-bold mb-6 text-center text-white">Submit Achievement</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div><label htmlFor="playerName" className="block text-sm font-medium text-gray-300 mb-2">Player Name</label><input type="text" id="playerName" value={playerName} onChange={(e) => setPlayerName(e.target.value)} required className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500" /></div>
              <div className="flex space-x-4"><label className="flex items-center"><input type="radio" value="bounty" checked={submissionType === 'bounty'} onChange={() => setSubmissionType('bounty')} className="form-radio h-4 w-4 text-orange-600 bg-slate-700 border-slate-600 focus:ring-orange-500" /><span className="ml-2 text-gray-300">Bounty</span></label><label className="flex items-center"><input type="radio" value="personal_best" checked={submissionType === 'personal_best'} onChange={() => setSubmissionType('personal_best')} className="form-radio h-4 w-4 text-orange-600 bg-slate-700 border-slate-600 focus:ring-orange-500" /><span className="ml-2 text-gray-300">Personal Best</span></label></div>
              {submissionType === 'bounty' ? (
                <div><label htmlFor="bounty" className="block text-sm font-medium text-gray-300 mb-2">Select Bounty</label><select id="bounty" value={selectedBounty} onChange={(e) => setSelectedBounty(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500">{bounties.length > 0 ? bounties.map(b => <option key={b.id} value={b.name}>{b.name}</option>) : <option>Loading bounties...</option>}</select></div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div><label htmlFor="pbCategory" className="block text-sm font-medium text-gray-300 mb-2">Category</label><select id="pbCategory" value={pbCategory} onChange={(e) => setPbCategory(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500">{pbCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                  <div><label htmlFor="pbTime" className="block text-sm font-medium text-gray-300 mb-2">Time (e.g., 15:30.4)</label><input type="text" id="pbTime" value={pbTime} onChange={(e) => setPbTime(e.target.value)} required className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500" /></div>
                </div>
              )}
              <div><label htmlFor="screenshot" className="block text-sm font-medium text-gray-300 mb-2">Screenshot Proof</label><input type="file" id="screenshot" onChange={handleFileChange} required className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-600/20 file:text-orange-300 hover:file:bg-orange-600/30" /></div>
              <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">{loading ? 'Submitting...' : 'Submit Achievement'}</button>
              {submitStatus.message && (<div className={`text-center p-3 rounded-lg text-sm ${submitStatus.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>{submitStatus.message}</div>)}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}