import React from 'react';
import { motion } from 'framer-motion';

export default function OceanBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient ocean */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-950" />
      
      {/* Animated waves */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-32 opacity-20"
        animate={{
          backgroundPosition: ['0% 0%', '100% 0%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120'%3E%3Cpath d='M0,50 Q300,10 600,50 T1200,50 L1200,120 L0,120 Z' fill='%23ffffff'/%3E%3C/svg%3E")`,
          backgroundSize: '1200px 120px',
          backgroundRepeat: 'repeat-x',
        }}
      />
      
      {/* Bubbles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white opacity-10"
          style={{
            width: Math.random() * 20 + 10,
            height: Math.random() * 20 + 10,
            left: `${Math.random() * 100}%`,
            bottom: -50,
          }}
          animate={{
            y: [-50, -window.innerHeight - 100],
            x: [0, (Math.random() - 0.5) * 100],
          }}
          transition={{
            duration: Math.random() * 10 + 15,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  );
}
