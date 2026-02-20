import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  attacks: [number, number, boolean][];
  onAttack?: (row: number, col: number) => void;
  disabled?: boolean;
  showShips?: boolean;
  ships?: [number, number][];
}

export default function BattleGrid({ attacks, onAttack, disabled, showShips, ships = [] }: Props) {
  const attackMap = new Map(attacks.map(([r, c, hit]) => [`${r}-${c}`, hit]));
  const shipSet = new Set(ships.map(([r, c]) => `${r}-${c}`));

  return (
    <div className="grid grid-cols-10 gap-1 bg-ocean p-2 rounded">
      {Array.from({ length: 100 }).map((_, idx) => {
        const row = Math.floor(idx / 10);
        const col = idx % 10;
        const key = `${row}-${col}`;
        const attacked = attackMap.has(key);
        const hit = attackMap.get(key);
        const hasShip = shipSet.has(key);

        return (
          <motion.div
            key={key}
            className={`w-8 h-8 grid-cell relative ${
              attacked ? (hit ? 'hit' : 'miss') : ''
            } ${showShips && hasShip ? 'ship' : ''}`}
            whileHover={!disabled && !attacked ? { scale: 1.1 } : {}}
            onClick={() => !disabled && !attacked && onAttack?.(row, col)}
          >
            <AnimatePresence>
              {attacked && hit && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center text-2xl"
                >
                  💥
                </motion.div>
              )}
              {attacked && !hit && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center text-xl"
                >
                  ⭕
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
