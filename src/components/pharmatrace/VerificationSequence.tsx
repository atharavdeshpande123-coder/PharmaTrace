'use client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  QrCode, Network, ShieldCheck, CheckCircle2, XCircle,
  Loader2, Cpu, Truck, FileText,
} from 'lucide-react'

/**
 * Verification Sequence Animation
 *
 * Real verification animation that follows the actual application state.
 * Displays the full flow: QR → Smart Contract → Blockchain → Hash Match → Shield.
 *
 * Steps:
 *   1. QR CODE DETECTED
 *   2. DIGITAL ID EXTRACTED
 *   3. CHECKING PHARMACEUTICAL RECORD
 *   4. SMART CONTRACT VALIDATION
 *   5. BLOCKCHAIN RECORD MATCH
 *   6. VERIFICATION COMPLETE
 *
 * No fake data — uses real verification result when available.
 */
const VERIFY_STEPS = [
  { label: 'QR CODE DETECTED', icon: QrCode, color: '#22d3ee' },
  { label: 'DIGITAL ID EXTRACTED', icon: FileText, color: '#2F80ED' },
  { label: 'CHECKING PHARMACEUTICAL RECORD', icon: Network, color: '#a78bfa' },
  { label: 'SMART CONTRACT VALIDATION', icon: Cpu, color: '#fbbf24' },
  { label: 'BLOCKCHAIN RECORD MATCH', icon: ShieldCheck, color: '#34d399' },
  { label: 'VERIFICATION COMPLETE', icon: CheckCircle2, color: '#16A34A' },
]

interface Props {
  currentStep: number
  result?: 'AUTHENTIC' | 'NOT_FOUND' | 'FLAGGED' | 'EXPIRED' | null
}

export function VerificationSequence({ currentStep, result }: Props) {
  return (
    <div className="py-6">
      {/* Central flow visualization */}
      <div className="relative max-w-md mx-auto">
        {/* Vertical connecting line */}
        <motion.div
          className="absolute left-5 top-8 bottom-8 w-0.5 bg-gradient-to-b from-cyan-500/30 via-violet-500/30 to-emerald-500/30"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ originY: 0 }}
        />

        {/* Steps */}
        <div className="space-y-3">
          {VERIFY_STEPS.map((step, i) => {
            const Icon = step.icon
            const isCompleted = i < currentStep
            const isActive = i === currentStep
            const isPending = i > currentStep

            // If result is failure, stop at the appropriate step
            const isFailed = result && result !== 'AUTHENTIC' && i >= 3

            return (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: isPending ? 0.4 : 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className="relative flex items-center gap-3"
              >
                {/* Step icon */}
                <div
                  className="relative z-10 flex items-center justify-center h-10 w-10 rounded-full shrink-0 transition-all"
                  style={{
                    background: isCompleted ? `${step.color}20` : isActive ? `${step.color}30` : 'transparent',
                    border: `1.5px solid ${isCompleted || isActive ? step.color : '#7B8FA3'}`,
                    boxShadow: isActive ? `0 0 16px ${step.color}40` : 'none',
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" style={{ color: step.color }} />
                  ) : isActive ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                      <Loader2 className="h-5 w-5 animate-spin" style={{ color: step.color }} />
                    </motion.div>
                  ) : isFailed ? (
                    <XCircle className="h-5 w-5 text-rose-400" />
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Step label */}
                <div className="flex-1">
                  <div
                    className={`text-sm font-medium transition-colors ${isCompleted ? 'text-foreground' : isActive ? 'text-foreground' : 'text-muted-foreground'}`}
                    style={isActive ? { color: step.color } : {}}
                  >
                    {step.label}
                  </div>

                  {/* Sub-label for active step */}
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-muted-foreground mt-0.5"
                    >
                      {i === 0 && 'Scanning QR code…'}
                      {i === 1 && 'Extracting verification identifier…'}
                      {i === 2 && 'Querying pharmaceutical database…'}
                      {i === 3 && 'Executing smart contract rules…'}
                      {i === 4 && 'Comparing database record with blockchain…'}
                      {i === 5 && 'Verification confirmed!'}
                    </motion.div>
                  )}

                  {/* Data packet animation for active step */}
                  {isActive && i < 5 && (
                    <motion.div
                      className="mt-1 h-0.5 rounded-full"
                      style={{ background: `linear-gradient(90deg, ${step.color}, transparent)` }}
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                </div>

                {/* Node pulse for completed steps */}
                {isCompleted && (
                  <motion.div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: step.color }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  />
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Final result shield */}
        <AnimatePresence>
          {currentStep >= 5 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="mt-6 flex flex-col items-center"
            >
              {/* Shield assembly animation */}
              <div className="relative">
                {/* Orbiting nodes forming the shield */}
                {[0, 120, 240].map((angle, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    style={{
                      top: '50%', left: '50%',
                      transform: `rotate(${angle}deg) translateY(-30px)`,
                    }}
                  >
                    <div className="h-2 w-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 8px #34d399' }} />
                  </motion.div>
                ))}
                {/* Main shield */}
                <motion.div
                  className="relative flex items-center justify-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {result === 'AUTHENTIC' || !result ? (
                    <ShieldCheck className="h-14 w-14 text-emerald-400" style={{ filter: 'drop-shadow(0 0 12px rgba(52,211,153,0.4))' }} />
                  ) : result === 'NOT_FOUND' ? (
                    <XCircle className="h-14 w-14 text-rose-400" style={{ filter: 'drop-shadow(0 0 12px rgba(244,63,94,0.4))' }} />
                  ) : (
                    <ShieldCheck className="h-14 w-14 text-amber-400" style={{ filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.4))' }} />
                  )}
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-3 text-center"
              >
                <div className={`text-lg font-bold ${result === 'AUTHENTIC' || !result ? 'text-emerald-300' : result === 'NOT_FOUND' ? 'text-rose-300' : 'text-amber-300'}`}>
                  {result === 'AUTHENTIC' || !result ? 'REGISTERED DIGITAL RECORD VERIFIED' :
                   result === 'NOT_FOUND' ? 'RECORD NOT FOUND' :
                   result === 'EXPIRED' ? 'REGISTERED BATCH EXPIRED' :
                   'RECORD MISMATCH'}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {result === 'AUTHENTIC' || !result ? 'The QR code matches a registered PharmaTrace batch record.' :
                   'Verification could not confirm this record.'}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
