import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExplosionProps {
  show: boolean;
  onComplete?: () => void;
}

export default function Explosion({ show, onComplete }: ExplosionProps) {
  const [particles, setParticles] = useState<Array<{ id: number; angle: number; distance: number }>>([]);

  useEffect(() => {
    if (show) {
      // Generate explosion particles
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        angle: (Math.PI * 2 * i) / 20,
        distance: Math.random() * 50 + 30,
      }));
      setParticles(newParticles);

      // Play explosion sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6OyrWBQLSKDf8sFuJAUuhM/z24k2CBhku+zooVARC0yl4fG5ZRwFNo3V7859KQUofsz');
      audio.volume = 0.3;
      audio.play().catch(() => {});

      setTimeout(() => {
        onComplete?.();
      }, 1000);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Flash */}
          <motion.div
            className="absolute inset-0 bg-orange-500 rounded-full"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Fire ball */}
          <motion.div
            className="absolute w-16 h-16 rounded-full"
            style={{
              background: 'radial-gradient(circle, #ff6b00 0%, #ff0000 50%, #8b0000 100%)',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 1, 0] }}
            transition={{ duration: 0.8 }}
          />

          {/* Particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-2 h-2 rounded-full bg-orange-400"
              initial={{
                x: 0,
                y: 0,
                scale: 1,
                opacity: 1,
              }}
              animate={{
                x: Math.cos(particle.angle) * particle.distance,
                y: Math.sin(particle.angle) * particle.distance,
                scale: 0,
                opacity: 0,
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          ))}

          {/* Smoke */}
          <motion.div
            className="absolute w-20 h-20 rounded-full bg-gray-600 opacity-50 blur-xl"
            initial={{ scale: 0, y: 0 }}
            animate={{ scale: 2, y: -30, opacity: 0 }}
            transition={{ duration: 1.5 }}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
