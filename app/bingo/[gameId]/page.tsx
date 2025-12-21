'use client';

import { useState, useEffect, FormEvent, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';

// --- Interfaces ---
interface BingoGame {
    id: number;
    name: string;
    game_type: 'standard' | 'lockout';
    board_size: number;
    is_active: boolean;
    start_time: string;      // NEW
    duration_days: number;   // NEW
    bingo_teams: BingoTeam[];
    shared_board?: { tiles: BingoTileData[] };
}
interface BingoTileData { text: string; position: number; status: 'incomplete' | 'approved'; claimed_by_team: number | null; claimed_by_player: string | null; proof_image_url?: string; }
interface Player { wom_player_id: number; displayName: string; }
interface BingoTeam { id: number; team_name: string; score: number; bingo_team_members: { player_details: { wom_player_id: number; wom_details_json: { username: string } } }[]; board?: { tiles: BingoTileData[] } | null; }

const BingoTile = ({ tile, teamColors, isGameActive, onIncompleteClick }: { tile: BingoTileData; teamColors: { [key: number]: string }, isGameActive: boolean, onIncompleteClick: () => void }) => {
    const isCompleted = tile.status === 'approved';
    const isClickable = isCompleted || isGameActive;
    let tileBgColor = 'bg-slate-700/50';
    if (isCompleted) {
        tileBgColor = (tile.claimed_by_team && teamColors[tile.claimed_by_team]) ? teamColors[tile.claimed_by_team] : 'bg-green-800/80';
    } else if (!isGameActive) {
        tileBgColor = 'bg-slate-800/60';
    }
    const hoverAndCursor = isClickable ? 'hover:brightness-110 cursor-pointer' : 'cursor-not-allowed';
    const handleClick = () => {
        if (isCompleted && tile.proof_image_url) { window.open(tile.proof_image_url, '_blank'); }
        else if (!isCompleted && isGameActive) { onIncompleteClick(); }
    };
    return ( <button onClick={handleClick} disabled={!isClickable} className={`aspect-square p-2 border rounded-md flex flex-col justify-center items-center text-center transition-all duration-300 ${isCompleted || !isGameActive ? 'border-transparent' : 'border-slate-600'} ${tileBgColor} ${hoverAndCursor}`}> <p className={`text-sm font-medium ${isCompleted || isGameActive ? 'text-white' : 'text-slate-400'}`}>{tile.text}</p> {isCompleted && tile.claimed_by_player && ( <p className="text-xs text-slate-300 mt-1 font-bold">by {tile.claimed_by_player}</p> )} </button> );
};

const SubmissionModal = ({ tile, game, allPlayers, onClose, onSubmitSuccess }: { tile: BingoTileData; game: BingoGame; allPlayers: Player[]; onClose: () => void; onSubmitSuccess: (msg: string) => void; }) => {
    const [proofFile, setProofFile] = useState<File | null>(null); const [isSubmitting, setIsSubmitting] = useState(false); const [error, setError] = useState(''); const [selectedPlayerId, setSelectedPlayerId] = useState<string>(''); const [password, setPassword] = useState('');
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!proofFile || !selectedPlayerId || !password) { setError('Please select your name, enter the password, and select a proof image.'); return; }
        const playerTeam = game.bingo_teams.find(team => team.bingo_team_members.some(m => m.player_details.wom_player_id === Number(selectedPlayerId)));
        if (!playerTeam) { setError('The selected player is not on a team for this game.'); return; }

        const selectedPlayer = allPlayers.find(p => p.wom_player_id.toString() === selectedPlayerId);
        if (!selectedPlayer) { setError('An error occurred while finding player details. Please refresh.'); return; }

        setIsSubmitting(true); setError(''); const formData = new FormData();
        formData.append('proofFile', proofFile);
        formData.append('gameId', String(game.id));
        formData.append('teamId', String(playerTeam.id));
        formData.append('playerId', selectedPlayerId);
        formData.append('playerName', selectedPlayer.displayName);
        formData.append('tileText', tile.text);
        formData.append('tilePosition', String(tile.position));
        formData.append('password', password);
        try { const response = await fetch('/api/bingo/submit-tile', { method: 'POST', body: formData }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Submission failed.'); onSubmitSuccess(result.message); } catch (err: any) { setError(err.message); } finally { setIsSubmitting(false); }
    };
    return (<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-slate-800 p-6 rounded-lg border border-slate-700 w-full max-w-md"><h3 className="text-lg font-bold text-white mb-2">Submit Tile</h3><p className="bg-slate-700 p-3 rounded text-orange-300 text-center mb-4">&quot;{tile.text}&quot;</p><form onSubmit={handleSubmit} className="space-y-4"><div><label htmlFor="playerSelect" className="block text-sm font-medium text-gray-300 mb-1">Select Your Name</label><select id="playerSelect" value={selectedPlayerId} onChange={(e) => setSelectedPlayerId(e.target.value)} required className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white"><option value="" disabled>-- Choose your name --</option>{allPlayers.map(p => <option key={p.wom_player_id} value={p.wom_player_id}>{p.displayName}</option>)}</select></div><div><label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Bingo Password</label><input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div><div><label htmlFor="proof" className="block text-sm font-medium text-gray-300 mb-1">Proof Screenshot</label><input type="file" id="proof" onChange={(e) => setProofFile(e.target.files ? e.target.files[0] : null)} required accept="image/png, image/jpeg, image/gif" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-orange-600/20 file:text-orange-300" /></div>{error && <p className="text-sm text-red-400">{error}</p>}<div className="flex gap-4"><button type="button" onClick={onClose} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg">Cancel</button><button type="submit" disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg disabled:bg-slate-600">{isSubmitting ? 'Submitting...' : 'Submit for Review'}</button></div></form></div></div>);
};

export default function BingoPage() {
    const params = useParams(); const gameId = params.gameId as string;
    const [gameData, setGameData] = useState<BingoGame | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTeamId, setActiveTeamId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTile, setSelectedTile] = useState<BingoTileData | null>(null);
    // State to handle date strings after hydration to avoid mismatches
    const [dateString, setDateString] = useState<string | null>(null);

    useEffect(() => {
        if (!gameId) return;
        const fetchGameData = async (isInitialLoad = false) => {
            if (isInitialLoad) setLoading(true);
            setError('');
            try {
                const response = await fetch(`/api/bingo/${gameId}`);
                if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Failed to fetch game data.'); }
                const data: BingoGame = await response.json();
                setGameData(data);

                // NEW: Set the date string for display
                if (data.duration_days > 0 && data.start_time) {
                    const endTime = new Date(new Date(data.start_time).getTime() + data.duration_days * 24 * 60 * 60 * 1000);
                    setDateString(endTime.toLocaleString());
                }

                if (isInitialLoad && data.bingo_teams && data.bingo_teams.length > 0) {
                    setActiveTeamId(data.bingo_teams[0].id);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                if (isInitialLoad) setLoading(false);
            }
        };
        fetchGameData(true);
        const intervalId = setInterval(() => { fetchGameData(false); }, 7000);
        return () => clearInterval(intervalId);
    }, [gameId]);

    const activeTeamBoard = gameData?.bingo_teams.find(t => t.id === activeTeamId)?.board;
    const allPlayersInGame = useMemo(() => {
        if (!gameData) return [];
        const players: Player[] = [];
        const playerIds = new Set<number>();
        gameData.bingo_teams.forEach(team => {
            team.bingo_team_members.forEach(member => {
                if (member.player_details && !playerIds.has(member.player_details.wom_player_id)) {
                    players.push({ wom_player_id: member.player_details.wom_player_id, displayName: member.player_details.wom_details_json.username });
                    playerIds.add(member.player_details.wom_player_id);
                }
            });
        });
        return players.sort((a,b) => a.displayName.localeCompare(b.displayName));
    }, [gameData]);
    const handleTileClick = (tile: BingoTileData) => { setSelectedTile(tile); setIsModalOpen(true); };
    const teamColorStyles = useMemo(() => {
        const styles: { [key: number]: { bg: string; text: string; tile: string } } = {};
        if (gameData) {
            const colors = [ { bg: 'bg-purple-800/40', text: 'text-purple-400', tile: 'bg-purple-800/80' }, { bg: 'bg-red-800/40', text: 'text-red-400', tile: 'bg-red-800/80' }, { bg: 'bg-blue-800/40', text: 'text-blue-400', tile: 'bg-blue-800/80' }, { bg: 'bg-green-800/40', text: 'text-green-400', tile: 'bg-green-800/80' }, ];
            gameData.bingo_teams.forEach((team, index) => { styles[team.id] = colors[index % colors.length]; });
        }
        return styles;
    }, [gameData]);
    const totalTiles = gameData ? gameData.board_size * gameData.board_size : 0;
    const majorityTiles = Math.floor(totalTiles / 2) + 1;

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Bingo Board...</div>;
    if (error) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-400">{error}</div>;
    if (!gameData) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">No game data found.</div>;

    const teamColorsForTiles = Object.fromEntries(Object.entries(teamColorStyles).map(([id, styles]) => [id, styles.tile]));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Header />
            {isModalOpen && selectedTile && (<SubmissionModal tile={selectedTile} game={gameData} allPlayers={allPlayersInGame} onClose={() => setIsModalOpen(false)} onSubmitSuccess={(msg) => { alert(msg); setIsModalOpen(false); }} />)}
            <main className="px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold mb-2 text-center text-white">{gameData.name}</h1>
                    <p className="text-center text-orange-400 capitalize mb-4">{gameData.game_type} Bingo</p>

                    {/* --- NEW TIME LIMIT INFO --- */}
                    {gameData.duration_days > 0 && dateString && (
                        <p className={`text-center text-sm mb-6 ${gameData.is_active ? 'text-gray-400' : 'text-gray-500'}`}>
                            {gameData.is_active ? `Event ends: ${dateString}` : `Event ended: ${dateString}`}
                        </p>
                    )}

                    {/* --- ARCHIVED STATUS BANNER --- */}
                    {!gameData.is_active && (
                        <div className="max-w-4xl mx-auto mb-8 p-4 bg-yellow-900/40 border border-yellow-700/50 rounded-lg text-center backdrop-blur-sm">
                            <h3 className="font-bold text-yellow-300 text-lg">This Bingo has ended.</h3>
                            <p className="text-yellow-400/80 text-sm">No new tiles can be submitted, but you can still view the results.</p>
                        </div>
                    )}

                    {gameData.game_type === 'lockout' ? (
                        <div className="max-w-4xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                {gameData.bingo_teams.map(team => (
                                <div key={team.id} className={`p-4 rounded-lg border-2 ${team.score >= majorityTiles ? 'border-yellow-400' : 'border-slate-700'} ${teamColorStyles[team.id]?.bg || 'bg-slate-800/50'}`}>
                                    <div className="flex items-center gap-x-3 mb-1">
                                        <h3 className={`font-bold text-xl ${teamColorStyles[team.id]?.text || 'text-white'}`}>{team.team_name}</h3>
                                        {team.score >= majorityTiles && <span className="text-xs font-bold text-yellow-300 bg-yellow-900/60 px-2 py-0.5 rounded-full">WINNER!</span>}
                                    </div>
                                    <p className="text-3xl font-black text-orange-300">{team.score} <span className="text-lg font-bold text-gray-400">/ {totalTiles} tiles</span></p>
                                    <ul className="mt-2 text-xs text-gray-400 space-y-1"> {team.bingo_team_members.length > 0 ? ( team.bingo_team_members.map(member => ( <li key={member.player_details.wom_player_id}>- {member.player_details.wom_details_json.username}</li> )) ) : (<li className="italic">No players assigned.</li>)} </ul>
                                </div>
                                ))}
                            </div>
                            {gameData.shared_board ? (
                                <div className={`grid gap-2 ${gameData.board_size === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
                                    {gameData.shared_board.tiles.sort((a,b) => a.position - b.position).map(tile => (
                                        <BingoTile key={tile.position} tile={tile} teamColors={teamColorsForTiles} isGameActive={gameData.is_active} onIncompleteClick={() => handleTileClick(tile)} />
                                    ))}
                                </div>
                            ) : <p>Board not found.</p>}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-4xl mx-auto">
                                {gameData.bingo_teams.map(team => {
                                    const isWinner = team.score === totalTiles && totalTiles > 0;
                                    return (
                                        <button
                                            key={team.id}
                                            onClick={() => setActiveTeamId(team.id)}
                                            className={`p-4 rounded-lg text-left transition-all border-2 ${activeTeamId === team.id ? 'border-orange-500' : isWinner ? 'border-yellow-400' : 'border-slate-700 hover:border-slate-500'} ${teamColorStyles[team.id]?.bg || 'bg-slate-800/50'}`}
                                        >
                                            <div className="flex items-center gap-x-3 mb-1">
                                                <h3 className={`font-bold text-xl ${teamColorStyles[team.id]?.text || 'text-white'}`}>{team.team_name}</h3>
                                                {isWinner && <span className="text-xs font-bold text-yellow-300 bg-yellow-900/60 px-2 py-0.5 rounded-full">WINNER!</span>}
                                            </div>
                                            <p className="text-3xl font-black text-orange-300">{team.score} <span className="text-lg font-bold text-gray-400">/ {totalTiles} tiles</span></p>
                                            <ul className="mt-2 text-xs text-gray-400 space-y-1">
                                                {team.bingo_team_members.length > 0 ? (
                                                    team.bingo_team_members.map(member => ( <li key={member.player_details.wom_player_id}>- {member.player_details.wom_details_json.username}</li> ))
                                                ) : (<li className="italic">No players assigned yet.</li>)}
                                            </ul>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="max-w-4xl mx-auto">{activeTeamBoard ? (<div className={`grid gap-2 ${gameData.board_size === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>{activeTeamBoard.tiles.sort((a, b) => a.position - b.position).map(tile => (<BingoTile key={tile.position} tile={tile} teamColors={teamColorsForTiles} isGameActive={gameData.is_active} onIncompleteClick={() => handleTileClick(tile)} />))}</div>) : (<p className="text-center text-gray-400">Select a team to view their board.</p>)}</div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}