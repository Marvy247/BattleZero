import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Ship {
  length: number;
  positions: [number, number][];
}

interface Props {
  onComplete: (ships: Ship[]) => void;
  demoMode?: boolean;
}

const SHIP_LENGTHS = [5, 4, 3, 3, 2];
const DEMO_SHIP_LENGTHS = [3, 2]; // Quick demo: just 2 ships

export default function ShipPlacement({ onComplete, demoMode = false }: Props) {
  const shipLengths = demoMode ? DEMO_SHIP_LENGTHS : SHIP_LENGTHS;
  const [grid, setGrid] = useState<number[][]>(Array(10).fill(0).map(() => Array(10).fill(0)));
  const [ships, setShips] = useState<Ship[]>([]);
  const [currentShip, setCurrentShip] = useState(0);
  const [horizontal, setHorizontal] = useState(true);
  const [hovering, setHovering] = useState<[number, number] | null>(null);

  const canPlace = (row: number, col: number, length: number, horiz: boolean): boolean => {
    if (horiz && col + length > 10) return false;
    if (!horiz && row + length > 10) return false;

    for (let i = 0; i < length; i++) {
      const r = horiz ? row : row + i;
      const c = horiz ? col + i : col;
      if (grid[r][c] !== 0) return false;
    }
    return true;
  };

  const placeShip = (row: number, col: number) => {
    if (currentShip >= shipLengths.length) return;
    
    const length = shipLengths[currentShip];
    if (!canPlace(row, col, length, horizontal)) return;

    const positions: [number, number][] = [];
    const newGrid = grid.map(r => [...r]);

    for (let i = 0; i < length; i++) {
      const r = horizontal ? row : row + i;
      const c = horizontal ? col + i : col;
      newGrid[r][c] = currentShip + 1;
      positions.push([r, c]);
    }

    setGrid(newGrid);
    const newShips = [...ships, { length, positions }];
    setShips(newShips);
    setCurrentShip(currentShip + 1);

    if (currentShip + 1 === shipLengths.length) {
      setTimeout(() => onComplete(newShips), 500);
    }
  };

  const getPreview = (row: number, col: number): [number, number][] => {
    if (currentShip >= shipLengths.length) return [];
    const length = shipLengths[currentShip];
    if (!canPlace(row, col, length, horizontal)) return [];

    const preview: [number, number][] = [];
    for (let i = 0; i < length; i++) {
      const r = horizontal ? row : row + i;
      const c = horizontal ? col + i : col;
      preview.push([r, c]);
    }
    return preview;
  };

  return (
    <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold text-gray-800">
        {currentShip < shipLengths.length 
          ? `Place Ship ${currentShip + 1} (Length: ${shipLengths[currentShip]})${demoMode ? ' ⚡' : ''}`
          : 'All Ships Placed!'}
      </h2>
      
      {currentShip < shipLengths.length && (
        <button
          onClick={() => setHorizontal(!horizontal)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Rotate ({horizontal ? 'Horizontal' : 'Vertical'})
        </button>
      )}

      <div className="grid grid-cols-10 gap-1 bg-ocean p-2 rounded">
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const preview = hovering && hovering[0] === r && hovering[1] === c ? getPreview(r, c) : [];
            const isPreview = preview.some(([pr, pc]) => pr === r && pc === c);
            
            return (
              <motion.div
                key={`${r}-${c}`}
                className={`w-8 h-8 grid-cell ${cell > 0 ? 'ship' : ''} ${isPreview ? 'bg-green-300' : ''}`}
                whileHover={{ scale: 1.1 }}
                onClick={() => placeShip(r, c)}
                onMouseEnter={() => setHovering([r, c])}
                onMouseLeave={() => setHovering(null)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
