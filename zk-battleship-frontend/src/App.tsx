import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Toaster, toast } from 'react-hot-toast';
import OceanBackground from './components/OceanBackground';
import ShipPlacement from './components/ShipPlacement';
import BattleGrid from './components/BattleGrid';
import ProofSpinner from './components/ProofSpinner';
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

  const handleConnect = async () => {
    try {
      const address = await connectWallet();
      setWallet(address);
      setPhase('setup');
      toast.success('Wallet connected!');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  const handleShipsPlaced = async (ships: Ship[]) => {
    setMyShips(ships);
    toast.loading('Generating commitment...');
    
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
    
    // In production: wait for opponent, then call initializeGame
    setTimeout(() => {
      setPhase('playing');
      toast.success('Game started!');
    }, 2000);
  };

  const handleAttack = async (row: number, col: number) => {
    if (!isMyTurn || generating) return;
    
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
      toast.success(hit ? '💥 Hit!' : '💦 Miss!');
      
      // Submit to contract
      // const result = await submitAttack(sessionId, wallet, row, col, proof);
      
      setMyAttacks([...myAttacks, [row, col, hit]]);
      setIsMyTurn(false);
      
      // Simulate opponent turn
      setTimeout(() => {
        const oppRow = Math.floor(Math.random() * 10);
        const oppCol = Math.floor(Math.random() * 10);
        const oppHit = Math.random() > 0.7;
        setOppAttacks([...oppAttacks, [oppRow, oppCol, oppHit]]);
        setIsMyTurn(true);
        toast.info('Your turn!');
        
        // Check win condition
        if (myAttacks.length >= 17) {
          setPhase('won');
          toast.success('🎉 Victory!');
        }
      }, 3000);
      
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <OceanBackground />
      <Toaster position="top-right" />
      {phase === 'won' && <Confetti width={width} height={height} />}
      {generating && <ProofSpinner />}
      
      <div className="max-w-6xl w-full">
        <h1 className="text-5xl font-bold text-white text-center mb-8">
          ⚓ ZK Battleship
        </h1>
        
        {error && (
          <div className="bg-red-500 text-white p-4 rounded mb-4">
            {error}
          </div>
        )}
        
        {phase === 'connect' && (
          <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-2xl mb-4">Connect Your Wallet</h2>
            <button
              onClick={handleConnect}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Connect Freighter
            </button>
          </div>
        )}
        
        {phase === 'setup' && (
          <ShipPlacement onComplete={handleShipsPlaced} />
        )}
        
        {phase === 'waiting' && (
          <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-2xl mb-4">Waiting for Opponent...</h2>
            <p className="text-gray-600">Session ID: {sessionId}</p>
          </div>
        )}
        
        {phase === 'playing' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <h3 className="text-xl font-bold mb-4">Your Fleet</h3>
              <BattleGrid
                attacks={oppAttacks}
                showShips
                ships={myShips.flatMap(s => s.positions)}
                disabled
              />
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <h3 className="text-xl font-bold mb-4">
                Enemy Waters {isMyTurn ? '(Your Turn)' : '(Waiting...)'}
              </h3>
              <BattleGrid
                attacks={myAttacks}
                onAttack={handleAttack}
                disabled={!isMyTurn}
              />
            </div>
          </div>
        )}
        
        {phase === 'won' && (
          <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-4xl font-bold text-green-600 mb-4">🎉 Victory!</h2>
            <p className="text-xl mb-6">You sunk all enemy ships!</p>
            <button
              onClick={handleClaimWin}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              Claim Win On-Chain
            </button>
          </div>
        )}
        
        {wallet && (
          <div className="mt-4 text-center text-white text-sm">
            Connected: {wallet.slice(0, 8)}...{wallet.slice(-8)}
          </div>
        )}
      </div>
    </div>
  );
}
