import React from 'react';
import { motion } from 'framer-motion';

export default function ProofSpinner() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl flex flex-col items-center gap-4">
        <motion.div
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <p className="text-xl font-semibold text-gray-800">Generating ZK Proof...</p>
        <p className="text-sm text-gray-600">This may take a few seconds</p>
      </div>
    </div>
  );
}
