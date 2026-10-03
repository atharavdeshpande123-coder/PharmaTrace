'use client'
import { motion } from 'framer-motion'
import { ShieldCheck, QrCode, Network, Truck, Cpu } from 'lucide-react'

/**
 * PharmaTrace Verification Core
 *
 * The signature animation of the website — a pharmaceutical medicine
 * capsule in the center with 4 rotating rings representing:
 *   Ring 1: QR Authentication
 *   Ring 2: Blockchain Record
 *   Ring 3: Supply Chain
 *   Ring 4: Verification
 *
 * Small particles orbit the rings representing blockchain data packets.
 * Idle state: slow rotation, soft pulse, floating movement.
 */
export function VerificationCore({ size = 200 }: { size?: number }) {
  const rings = [
    { label: 'QR AUTH', icon: <QrCode className="h-3 w-3" />, radius: size * 0.28, duration: 20, color: '#22d3ee', offset: 0 },
    { label: 'BLOCKCHAIN', icon: <Network className="h-3 w-3" />, radius: size * 0.38, duration: 30, color: '#a78bfa', offset: 90 },
    { label: 'SUPPLY CHAIN', icon: <Truck className="h-3 w-3" />, radius: size * 0.48, duration: 40, color: '#34d399', offset: 180 },
    { label: 'VERIFY', icon: <ShieldCheck className="h-3 w-3" />, radius: size * 0.58, duration: 50, color: '#fbbf24', offset: 270 },
  ]

  return (
    <div className="relative flex items-center justify-center" style={{ width: size * 1.3, height: size * 1.3 }}>
      {/* Center medicine capsule */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10"
      >
        <div className="relative flex items-center justify-center">
          {/* Capsule body */}
          <div className="relative h-16 w-8 rounded-full overflow-hidden shadow-lg" style={{ background: 'linear-gradient(135deg, #22d3ee, #a78bfa)' }}>
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-cyan-500/80" />
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-violet-500/80" />
            {/* Shine */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>
          {/* Pulse ring around capsule */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
            animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Orbiting rings */}
      {rings.map((ring, i) => (
        <motion.div
          key={i}
          className="absolute"
          animate={{ rotate: 360 }}
          transition={{ duration: ring.duration, repeat: Infinity, ease: 'linear' }}
          style={{ width: ring.radius * 2, height: ring.radius * 2 }}
        >
          {/* Ring circle */}
          <div
            className="absolute inset-0 rounded-full border"
            style={{
              borderColor: `${ring.color}30`,
              borderWidth: 1,
            }}
          />
          {/* Node on the ring */}
          <div
            className="absolute"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${ring.offset}deg) translateX(${ring.radius}px) translateY(-50%)`,
            }}
          >
            <motion.div
              className="flex items-center gap-1 rounded-lg px-2 py-1"
              style={{ background: `${ring.color}15`, border: `1px solid ${ring.color}30` }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
            >
              <span style={{ color: ring.color }}>{ring.icon}</span>
              <span className="text-[8px] font-mono font-semibold whitespace-nowrap" style={{ color: ring.color }}>
                {ring.label}
              </span>
            </motion.div>
          </div>
        </motion.div>
      ))}

      {/* Orbital particles */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute"
          animate={{ rotate: 360 }}
          transition={{ duration: 15 + i * 3, repeat: Infinity, ease: 'linear' }}
          style={{ width: size * 1.2, height: size * 1.2 }}
        >
          <div
            className="absolute rounded-full"
            style={{
              top: '50%',
              left: '50%',
              width: 3,
              height: 3,
              backgroundColor: i % 2 === 0 ? '#22d3ee' : '#34d399',
              boxShadow: `0 0 6px ${i % 2 === 0 ? '#22d3ee' : '#34d399'}`,
              transform: `rotate(${angle}deg) translateX(${size * 0.6}px) translateY(-50%)`,
            }}
          />
        </motion.div>
      ))}
    </div>
  )
}
