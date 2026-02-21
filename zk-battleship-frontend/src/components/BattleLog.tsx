import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogEntry {
  id: number;
  timestamp: Date;
  type: 'info' | 'attack' | 'hit' | 'miss' | 'sunk' | 'victory';
  message: string;
  player?: 'you' | 'opponent';
}

interface Props {
  logs: LogEntry[];
}

const LOG_ICONS = {
  info: '📋',
  attack: '🎯',
  hit: '💥',
  miss: '💦',
  sunk: '🔥',
  victory: '🏆',
};

const LOG_COLORS = {
  info: 'text-blue-400',
  attack: 'text-yellow-400',
  hit: 'text-red-400',
  miss: 'text-gray-400',
  sunk: 'text-orange-400',
  victory: 'text-green-400',
};

export default function BattleLog({ logs }: Props) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto shadow-2xl border border-gray-700">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
        <span className="text-2xl">📜</span>
        <h3 className="text-xl font-bold text-white">Battle Log</h3>
      </div>

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`flex items-start gap-2 p-2 rounded ${
                log.player === 'you' ? 'bg-blue-900 bg-opacity-30' : 'bg-red-900 bg-opacity-30'
              }`}
            >
              <span className="text-xl flex-shrink-0">{LOG_ICONS[log.type]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400 font-mono">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  {log.player && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        log.player === 'you' ? 'bg-blue-600' : 'bg-red-600'
                      } text-white`}
                    >
                      {log.player === 'you' ? 'YOU' : 'OPP'}
                    </span>
                  )}
                </div>
                <p className={`text-sm ${LOG_COLORS[log.type]} break-words`}>{log.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={logEndRef} />
      </div>

      {logs.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          <p className="text-4xl mb-2">⚓</p>
          <p>Battle log will appear here...</p>
        </div>
      )}
    </div>
  );
}

export { type LogEntry };
