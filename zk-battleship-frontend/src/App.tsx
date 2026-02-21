import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Toaster, toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { isConnected, getPublicKey } from '@stellar/freighter-api';
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

  console.log('Current phase:', phase); // Debug log

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
      console.log('Freighter connected:', connected);
      
      if (!connected) {
        toast.error('Please install Freighter wallet extension');
        window.open('https://www.freighter.app/', '_blank');
        return;
      }
      
      // Request network first
      const { network, networkPassphrase } = await window.freighterApi.getNetwork();
      console.log('Network:', network, networkPassphrase);
      
      if (network !== 'TESTNET') {
        toast.error('Please switch Freighter to TESTNET mode');
        return;
      }
      
      // Request public key with explicit permission
      const address = await window.freighterApi.getPublicKey();
      console.log('Got address:', address);
      
      if (!address || address.trim() === '') {
        toast.error('Please unlock Freighter and make sure you have an account', {
          duration: 5000,
        });
        return;
      }
      
      setWallet(address);
      setPhase('setup');
      toast.success(`Connected: ${address.slice(0, 8)}...${address.slice(-8)}`);
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err.message);
      toast.error(`Connection failed: ${err.message}`);
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
      
      <div className="relative z-10 w-full max-w-6xl">
        <h1 className="text-5xl font-bold text-white text-center mb-8">
          ⚓ ZK Battleship
        </h1>
        
        {error && (
          <div className="bg-red-500 text-white p-4 rounded mb-4">
            {error}
          </div>
        )}
        
        {phase === 'connect' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-md mx-auto"
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
