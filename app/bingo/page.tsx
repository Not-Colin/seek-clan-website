'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

interface BingoGame {
    id: number;
    name: string;
}

export default function BingoIndexPage() {
    const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
    const [activeGames, setActiveGames] = useState<BingoGame[]>([]);
    const [archivedGames, setArchivedGames] = useState<BingoGame[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllGames = async () => {
            setLoading(true);
            setError(null);
            try {
                const [activeRes, archivedRes] = await Promise.all([
                    fetch('/api/bingo/get-active-games'),
                    fetch('/api/bingo/get-archived-games')
                ]);

                if (!activeRes.ok) {
                    const err = await activeRes.json();
                    throw new Error(`Failed to fetch active games: ${err.error || activeRes.statusText}`);
                }
                 if (!archivedRes.ok) {
                    const err = await archivedRes.json();
                    throw new Error(`Failed to fetch archived games: ${err.error || archivedRes.statusText}`);
                }

                const activeData = await activeRes.json();
                const archivedData = await archivedRes.json();

                setActiveGames(activeData);
                setArchivedGames(archivedData);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAllGames();
    }, []);

    const gamesToShow = activeTab === 'active' ? activeGames : archivedGames;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Header />
            <main className="px-6 py-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6 text-center text-white">Bingo Events</h1>

                    <div className="flex border-b border-slate-700 mb-6">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`px-6 py-3 font-medium transition-colors ${
                                activeTab === 'active'
                                ? 'text-orange-400 border-b-2 border-orange-400'
                                : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            Active Bingo&apos;s
                        </button>
                        <button
                            onClick={() => setActiveTab('archived')}
                            className={`px-6 py-3 font-medium transition-colors ${
                                activeTab === 'archived'
                                ? 'text-orange-400 border-b-2 border-orange-400'
                                : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            Archived Bingo&apos;s
                        </button>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-6">
                        {loading ? (
                            <p className="text-center text-gray-400">Loading games...</p>
                        ) : error ? (
                             <p className="text-center text-red-400">Error: {error}</p>
                        ) : gamesToShow.length === 0 ? (
                            <p className="text-center text-gray-400">
                                There are no {activeTab} bingo events right now.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {gamesToShow.map(game => (
                                    <Link key={game.id} href={`/bingo/${game.id}`} className="block bg-slate-700/50 hover:bg-slate-700 p-6 rounded-lg transition-colors">
                                        <h2 className="text-xl font-bold text-orange-400">{game.name}</h2>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}