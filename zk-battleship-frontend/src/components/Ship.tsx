import React from 'react';
import { motion } from 'framer-motion';

interface ShipProps {
  length: number;
  horizontal: boolean;
  isDragging?: boolean;
}

const SHIP_COLORS = {
  5: '#8B4513', // Carrier - brown
  4: '#696969', // Battleship - dark gray
  3: '#4682B4', // Cruiser/Submarine - steel blue
  2: '#2F4F4F', // Destroyer - dark slate
};

export default function Ship({ length, horizontal, isDragging }: ShipProps) {
  const color = SHIP_COLORS[length as keyof typeof SHIP_COLORS] || '#696969';
  
  return (
    <motion.div
      className="relative"
      style={{
        width: horizontal ? `${length * 40}px` : '40px',
        height: horizontal ? '40px' : `${length * 40}px`,
      }}
      whileHover={{ scale: 1.05 }}
      animate={isDragging ? { scale: 1.1, rotate: 5 } : {}}
    >
      {/* Ship shadow */}
      <div
        className="absolute inset-0 bg-black opacity-20 blur-sm"
        style={{
          transform: 'translate(4px, 4px)',
        }}
      />
      
      {/* Ship body */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3)',
        }}
      >
        {/* Ship segments */}
        {[...Array(length)].map((_, i) => (
          <div
            key={i}
            className="absolute border-r border-black border-opacity-20"
            style={{
              [horizontal ? 'left' : 'top']: `${(i / length) * 100}%`,
              [horizontal ? 'width' : 'height']: `${100 / length}%`,
              [horizontal ? 'height' : 'width']: '100%',
            }}
          >
            {/* Porthole */}
            <div
              className="absolute bg-yellow-300 rounded-full opacity-60"
              style={{
                width: '8px',
                height: '8px',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
        ))}
        
        {/* Ship bow (front) */}
        <div
          className="absolute bg-red-600 opacity-70"
          style={{
            [horizontal ? 'left' : 'top']: 0,
            [horizontal ? 'width' : 'height']: '8px',
            [horizontal ? 'height' : 'width']: '100%',
            borderRadius: horizontal ? '8px 0 0 8px' : '8px 8px 0 0',
          }}
        />
      </div>
    </motion.div>
  );
}
