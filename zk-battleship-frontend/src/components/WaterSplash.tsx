import React from 'react';
import { motion } from 'framer-motion';

interface WaterSplashProps {
  show: boolean;
}

export default function WaterSplash({ show }: WaterSplashProps) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {/* Main splash */}
      <motion.div
        className="absolute w-12 h-12 rounded-full bg-blue-300 opacity-60"
        initial={{ scale: 0, y: 0 }}
        animate={{ scale: 2, y: -10, opacity: 0 }}
        transition={{ duration: 0.5 }}
      />

      {/* Droplets */}
      {[...Array(8)].map((_, i) => {
        const angle = (Math.PI * 2 * i) / 8;
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-3 rounded-full bg-blue-400"
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{
              x: Math.cos(angle) * 20,
              y: Math.sin(angle) * 20 - 15,
              opacity: 0,
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        );
      })}

      {/* Ripples */}
      {[0, 0.2, 0.4].map((delay) => (
        <motion.div
          key={delay}
          className="absolute w-8 h-8 rounded-full border-2 border-blue-400"
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 1, delay }}
        />
      ))}
    </div>
  );
}
