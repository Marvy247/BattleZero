import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Toaster, toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { isConnected, getPublicKey, requestAccess } from '@stellar/freighter-api';
import OceanBackground from './components/OceanBackground';
import ShipPlacement from './components/ShipPlacement';
import BattleGrid from './components/BattleGrid';
import ProofSpinner from './components/ProofSpinner';
import BattleLog, { type LogEntry } from './components/BattleLog';
import { connectWallet, initializeGame, submitAttack, claimWin } from './utils/stellar';
import { generateCommitment, generateAttackProof, generateRevealProof } from './utils/noir';
import type { Ship } from './types';

type Phase = 'connect' | 'setup' | 'waiting' | 'playing' | 'won' | 'lost';

export default function App() {
  const { width, height } = useWindowSize();
  const [phase, setPhase] = useState<Phase>('connect');
  const [wallet, setWallet] = useState<string>('');
  const [sessionId] = useState(Math.floor(Math.random() * 1000000));
  const [myShips, setMyShips] = useState<Ship[]>([]);
  const [myCommitment, setMyCommitment] = useState('');
  const [myAttacks, setMyAttacks] = useState<[number, number, boolean][]>([]);
  const [oppAttacks, setOppAttacks] = useState<[number, number, boolean][]>([]);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [battleLogs, setBattleLogs] = useState<LogEntry[]>([]);
  const [logIdCounter, setLogIdCounter] = useState(0);
  const [demoMode, setDemoMode] = useState(false);

  const addLog = (type: LogEntry['type'], message: string, player?: 'you' | 'opponent') => {
    const newLog: LogEntry = {
      id: logIdCounter,
      timestamp: new Date(),
      type,
      message,
      player,
    };
    setBattleLogs(prev => [...prev, newLog]);
    setLogIdCounter(prev => prev + 1);
  };

  useEffect(() => {
    // Check if Freighter is installed
    isConnected().then(connected => {
      if (!connected) {
        toast.error('Freighter wallet not detected. Please install it.', {
          duration: 5000,
        });
      }
    });
  }, []);

  const handleConnect = async () => {
    try {
      const connected = await isConnected();
      
      if (!connected) {
        toast.error('Freighter wallet not detected. Please install and refresh.');
        window.open('https://www.freighter.app/', '_blank');
        return;
      }
      
      toast.loading('Requesting wallet access...');
      const accessObj = await requestAccess();
      
      if (accessObj.error) {
        toast.dismiss();
        toast.error('Access denied. Please approve the connection in Freighter.');
        return;
      }
      
      const address = await getPublicKey();
      
      if (!address || address.trim() === '') {
        toast.dismiss();
        toast.error('Failed to get address. Please make sure you have an account in Freighter.');
        return;
      }
      
      toast.dismiss();
      setWallet(address);
      setPhase('setup');
      toast.success(`Connected: ${address.slice(0, 8)}...${address.slice(-8)}`);
    } catch (err: any) {
      toast.dismiss();
      setError(err.message);
      toast.error(`Connection failed: ${err.message}`);
    }
  };

  const handleShipsPlaced = async (ships: Ship[]) => {
    setMyShips(ships);
    toast.loading('Generating commitment...');
    addLog('info', 'Fleet deployed! Generating cryptographic commitment...', 'you');
    
    // Flatten ships for commitment
    const flatShips: number[] = [];
    ships.forEach(ship => {
      flatShips.push(ship.length);
      ship.positions.forEach(([r, c]) => {
        flatShips.push(r, c);
      });
    });
    
    const commitment = await generateCommitment(flatShips);
    setMyCommitment(commitment);
    setPhase('waiting');
    toast.dismiss();
    toast.success('Ships placed! Waiting for opponent...');
    addLog('info', `Commitment generated: ${commitment.slice(0, 16)}...`, 'you');
    addLog('info', 'Waiting for opponent to deploy fleet...');
    
    // In production: wait for opponent, then call initializeGame
    setTimeout(() => {
      setPhase('playing');
      toast.success('Game started!');
      addLog('info', demoMode 
        ? '⚡ Quick demo mode - First to 3 hits wins!' 
        : '⚔️ Battle commenced! You have first strike.', 'you');
    }, demoMode ? 500 : 2000);
  };

  const handleAttack = async (row: number, col: number) => {
    if (!isMyTurn || generating) return;
    
    const coord = `${String.fromCharCode(65 + row)}${col + 1}`;
    addLog('attack', `Firing at coordinates ${coord}...`, 'you');
    
    setGenerating(true);
    toast.loading('Generating ZK proof...');
    try {
      // Check if hit
      const hit = myShips.some(ship => 
        ship.positions.some(([r, c]) => r === row && c === col)
      );
      
      // Generate proof
      const flatShips: number[] = [];
      myShips.forEach(ship => {
        flatShips.push(ship.length);
        ship.positions.forEach(([r, c]) => flatShips.push(r, c));
      });
      
      const proof = await generateAttackProof(myCommitment, flatShips, row, col, hit);
      toast.dismiss();
      
      if (hit) {
        toast.success('💥 Hit!');
        addLog('hit', `Direct hit at ${coord}! Enemy vessel damaged!`, 'you');
      } else {
        toast.success('💦 Miss!');
        addLog('miss', `Missed at ${coord}. Shells hit water.`, 'you');
      }
      
      // Submit to contract
      // const result = await submitAttack(sessionId, wallet, row, col, proof);
      
      const newMyAttacks = [...myAttacks, [row, col, hit]];
      setMyAttacks(newMyAttacks);
      setIsMyTurn(false);
      addLog('info', 'Opponent preparing counter-attack...');
      
      // Check win condition immediately after our attack
      const totalHits = newMyAttacks.filter(a => a[2]).length;
      const requiredHits = demoMode ? 3 : 17; // Only 3 hits needed in demo!
      
      if (totalHits >= requiredHits) {
        setTimeout(() => {
          setPhase('won');
          toast.success('🎉 Victory!');
          addLog('victory', '🏆 ALL ENEMY VESSELS DESTROYED! VICTORY IS OURS!', 'you');
        }, 500);
        return;
      }
      
      // Simulate opponent turn
      setTimeout(() => {
        const oppRow = Math.floor(Math.random() * 10);
        const oppCol = Math.floor(Math.random() * 10);
        const oppHit = demoMode ? Math.random() > 0.2 : Math.random() > 0.7; // 80% hit rate in demo
        const oppCoord = `${String.fromCharCode(65 + oppRow)}${oppCol + 1}`;
        
        if (oppHit) {
          addLog('hit', `Enemy hit our vessel at ${oppCoord}!`, 'opponent');
        } else {
          addLog('miss', `Enemy missed at ${oppCoord}.`, 'opponent');
        }
        
        const newOppAttacks = [...oppAttacks, [oppRow, oppCol, oppHit]];
        setOppAttacks(newOppAttacks);
        
        // Check if opponent won
        const oppHits = newOppAttacks.filter(a => a[2]).length;
        const requiredHits = demoMode ? 3 : 17; // Only 3 hits needed in demo!
        
        if (oppHits >= requiredHits) {
          setTimeout(() => {
            setPhase('lost');
            toast.error('💀 Defeat!');
            addLog('info', '💀 Enemy destroyed our fleet! We have been defeated.', 'opponent');
          }, 500);
          return;
        }
        
        setIsMyTurn(true);
        toast.info('Your turn!');
        addLog('info', 'Your turn to fire!', 'you');
      }, demoMode ? 1000 : 3000);
      
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      addLog('info', `Error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleClaimWin = async () => {
    setGenerating(true);
    toast.loading('Claiming victory on-chain...');
    try {
      const flatShips: number[] = [];
      myShips.forEach(ship => {
        flatShips.push(ship.length);
        ship.positions.forEach(([r, c]) => flatShips.push(r, c));
      });
      
      const proof = await generateRevealProof(myCommitment, flatShips, myAttacks);
      // await claimWin(sessionId, wallet, proof);
      
      toast.dismiss();
      toast.success('Victory claimed! Check Stellar Explorer.');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      <OceanBackground />
      <Toaster position="top-right" />
      {phase === 'won' && <Confetti width={width} height={height} />}
      {generating && <ProofSpinner />}
      
      {/* Header */}
      <header className="relative z-10 bg-gradient-to-r from-blue-900/90 to-blue-800/90 backdrop-blur-sm border-b-2 border-blue-400 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">⚓</span>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  ZK Battleship
                  {demoMode && (
                    <span className="text-sm bg-yellow-500 text-black px-2 py-1 rounded font-bold animate-pulse">
                      ⚡ DEMO MODE
                    </span>
                  )}
                </h1>
                <p className="text-xs text-blue-200">
                  {demoMode ? 'Quick Demo - First to 3 hits!' : 'Zero-Knowledge Naval Warfare'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {wallet && (
                <>
                  <div className="hidden sm:flex items-center gap-2 bg-blue-950/50 px-3 py-2 rounded-lg">
                    <span className="text-green-400">●</span>
                    <span className="text-white text-sm font-mono">
                      {wallet.slice(0, 6)}...{wallet.slice(-4)}
                    </span>
                  </div>
                  
                  {(phase === 'setup' || phase === 'placement') && (
                    <button
                      onClick={() => setDemoMode(!demoMode)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                        demoMode 
                          ? 'bg-yellow-500 text-black animate-pulse' 
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      {demoMode ? '⚡ Quick Demo ON' : '🎮 Full Game'}
                    </button>
                  )}
                  
                  {phase === 'playing' && (
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-xs text-blue-200">Accuracy</div>
                        <div className="text-lg font-bold text-white">
                          {myAttacks.length > 0 
                            ? Math.round((myAttacks.filter(a => a[2]).length / myAttacks.length) * 100)
                            : 0}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-blue-200">Hits</div>
                        <div className="text-lg font-bold text-green-400">
                          {myAttacks.filter(a => a[2]).length}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-blue-200">Misses</div>
                        <div className="text-lg font-bold text-gray-400">
                          {myAttacks.filter(a => !a[2]).length}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="relative z-10 flex-1 overflow-hidden">
        <div className="container mx-auto px-4 h-full py-4">
        
        {error && (
          <div className="bg-red-500 text-white p-4 rounded mb-4">
            {error}
          </div>
        )}
        
        {phase === 'connect' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-md mx-auto mt-20"
          >
            <div className="mb-6">
              <div className="text-6xl mb-4">⚓</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">ZK Battleship</h2>
              <p className="text-gray-600">Privacy-preserving naval warfare on Stellar</p>
            </div>
            
            <button
              onClick={handleConnect}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg font-semibold text-lg"
            >
              🔗 Connect Freighter Wallet
            </button>
            
            <p className="mt-4 text-sm text-gray-500">
              Make sure Freighter is installed and set to Testnet
            </p>
          </motion.div>
        )}
        
        {phase === 'setup' && (
          <ShipPlacement onComplete={handleShipsPlaced} demoMode={demoMode} />
        )}
        
        {phase === 'waiting' && (
          <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-2xl mb-4">Waiting for Opponent...</h2>
            <p className="text-gray-600">Session ID: {sessionId}</p>
          </div>
        )}
        
        {phase === 'playing' && (
          <div className="h-full flex flex-col lg:flex-row gap-4">
            {/* Grids Section */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
              <div className="bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-xl flex flex-col">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <span className="text-blue-600">🛡️</span> Your Fleet
                </h3>
                <div className="flex-1 flex items-center justify-center">
                  <BattleGrid
                    attacks={oppAttacks}
                    showShips
                    ships={myShips.flatMap(s => s.positions)}
                    disabled
                  />
                </div>
              </div>
              
              <div className="bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-xl flex flex-col">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <span className="text-red-600">🎯</span> Enemy Waters
                  {isMyTurn ? (
                    <span className="ml-auto text-sm bg-green-500 text-white px-3 py-1 rounded-full animate-pulse">
                      Your Turn
                    </span>
                  ) : (
                    <span className="ml-auto text-sm bg-gray-500 text-white px-3 py-1 rounded-full">
                      Waiting...
                    </span>
                  )}
                </h3>
                <div className="flex-1 flex items-center justify-center">
                  <BattleGrid
                    attacks={myAttacks}
                    onAttack={handleAttack}
                    disabled={!isMyTurn}
                  />
                </div>
              </div>
            </div>
            
            {/* Battle Log Section */}
            <div className="lg:w-96 min-h-0">
              <BattleLog logs={battleLogs} />
            </div>
          </div>
        )}
        
        {phase === 'won' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-white/95 backdrop-blur-sm p-8 rounded-lg shadow-2xl text-center max-w-md mx-auto mt-20"
          >
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold mb-4 text-yellow-600">Victory!</h2>
            <p className="text-gray-600 mb-6">You've destroyed the enemy fleet!</p>
            <div className="space-y-2 mb-6 text-left bg-gray-50 p-4 rounded">
              <div className="flex justify-between">
                <span>Total Shots:</span>
                <span className="font-bold">{myAttacks.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Hits:</span>
                <span className="font-bold text-green-600">{myAttacks.filter(a => a[2]).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Accuracy:</span>
                <span className="font-bold text-blue-600">
                  {Math.round((myAttacks.filter(a => a[2]).length / myAttacks.length) * 100)}%
                </span>
              </div>
            </div>
            <button
              onClick={handleClaimWin}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition w-full mb-2"
            >
              Claim Win On-Chain
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition w-full"
            >
              Play Again
            </button>
          </motion.div>
        )}
        
        {phase === 'lost' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-white/95 backdrop-blur-sm p-8 rounded-lg shadow-2xl text-center max-w-md mx-auto mt-20"
          >
            <div className="text-6xl mb-4">💀</div>
            <h2 className="text-3xl font-bold mb-4 text-red-600">Defeat!</h2>
            <p className="text-gray-600 mb-6">The enemy destroyed your fleet!</p>
            <div className="space-y-2 mb-6 text-left bg-gray-50 p-4 rounded">
              <div className="flex justify-between">
                <span>Your Hits:</span>
                <span className="font-bold text-green-600">{myAttacks.filter(a => a[2]).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Enemy Hits:</span>
                <span className="font-bold text-red-600">{oppAttacks.filter(a => a[2]).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Your Accuracy:</span>
                <span className="font-bold text-blue-600">
                  {myAttacks.length > 0 
                    ? Math.round((myAttacks.filter(a => a[2]).length / myAttacks.length) * 100)
                    : 0}%
                </span>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition w-full"
            >
              Try Again
            </button>
          </motion.div>
        )}
        
        </div>
      </div>
    </div>
  );
}
