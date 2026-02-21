import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Explosion from './Explosion';
import WaterSplash from './WaterSplash';

interface Props {
  attacks: [number, number, boolean][];
  onAttack?: (row: number, col: number) => void;
  disabled?: boolean;
  showShips?: boolean;
  ships?: [number, number][];
}

export default function BattleGrid({ attacks, onAttack, disabled, showShips, ships = [] }: Props) {
  const [explosions, setExplosions] = useState<Set<string>>(new Set());
  const [splashes, setSplashes] = useState<Set<string>>(new Set());
  
  const attackMap = new Map(attacks.map(([r, c, hit]) => [`${r}-${c}`, hit]));
  const shipSet = new Set(ships.map(([r, c]) => `${r}-${c}`));

  const handleAttack = (row: number, col: number) => {
    if (disabled || attackMap.has(`${row}-${col}`)) return;
    
    onAttack?.(row, col);
    
    // Trigger animation
    const key = `${row}-${col}`;
    setTimeout(() => {
      const hit = attackMap.get(key);
      if (hit) {
        setExplosions(new Set([...explosions, key]));
        setTimeout(() => {
          setExplosions(prev => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        }, 1000);
      } else {
        setSplashes(new Set([...splashes, key]));
        setTimeout(() => {
          setSplashes(prev => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        }, 600);
      }
    }, 100);
  };

  return (
    <div 
      className="grid grid-cols-10 gap-1 p-4 rounded-lg relative"
      style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.1)',
      }}
    >
      {Array.from({ length: 100 }).map((_, idx) => {
        const row = Math.floor(idx / 10);
        const col = idx % 10;
        const key = `${row}-${col}`;
        const attacked = attackMap.has(key);
        const hit = attackMap.get(key);
        const hasShip = shipSet.has(key);
        const showExplosion = explosions.has(key);
        const showSplash = splashes.has(key);

        return (
          <motion.div
            key={key}
            className={`
              relative w-10 h-10 rounded border cursor-pointer
              ${attacked 
                ? hit 
                  ? 'bg-red-900 border-red-700' 
                  : 'bg-blue-700 border-blue-500'
                : 'bg-blue-600 border-blue-400 hover:bg-blue-500'
              }
              ${showShips && hasShip ? 'bg-gray-700 border-gray-500' : ''}
            `}
            style={{
              boxShadow: attacked 
                ? 'inset 0 2px 8px rgba(0,0,0,0.6)' 
                : '0 2px 4px rgba(0,0,0,0.3)',
            }}
            whileHover={!disabled && !attacked ? { 
              scale: 1.1,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.5)',
            } : {}}
            whileTap={!disabled && !attacked ? { scale: 0.95 } : {}}
            onClick={() => handleAttack(row, col)}
          >
            {/* Grid coordinates */}
            {!attacked && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-blue-300 opacity-30 font-mono">
                {String.fromCharCode(65 + row)}{col + 1}
              </div>
            )}

            {/* Effects */}
            <Explosion show={showExplosion} />
            <WaterSplash show={showSplash} />

            {/* Hit marker */}
            <AnimatePresence>
              {attacked && hit && !showExplosion && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="text-3xl">💥</div>
                </motion.div>
              )}
              
              {/* Miss marker */}
              {attacked && !hit && !showSplash && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-6 h-6 rounded-full border-2 border-white opacity-60" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
