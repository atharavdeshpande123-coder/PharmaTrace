'use client'
import { useEffect, useState } from 'react'
import { useWallet, SUPPORTED_CHAIN_NAME, getNetworkName } from '@/store/wallet'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet, ExternalLink, Copy, LogOut, AlertTriangle, Loader2,
  CheckCircle2, ChevronDown, Zap, Network,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function WalletConnectButton() {
  const {
    status, address, chainId, balance, error, isMetaMaskAvailable,
    init, connectWallet, disconnectWallet, switchToSepolia, copyAddress, getExplorerUrl, shortenAddress,
  } = useWallet()

  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [hasDisconnected, setHasDisconnected] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    init()
    return () => clearTimeout(timer)
  }, [init])

  // When user clicks "Connect Wallet" after disconnect, skip the modal
  // and go straight to connecting (MetaMask handles the popup)
  const handleConnectClick = () => {
    if (hasDisconnected && isMetaMaskAvailable) {
      // Direct reconnect — MetaMask will show its own popup
      setHasDisconnected(false)
      connectWallet()
    } else {
      setShowModal(true)
    }
  }

  if (!mounted) return null

  // DISCONNECTED or NO_WALLET — show CONNECT WALLET button
  if (status === 'DISCONNECTED' || status === 'NO_WALLET') {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={handleConnectClick}
          className="border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/5 text-cyan-300 transition-all"
        >
          <Wallet className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">CONNECT WALLET</span>
          <span className="sm:hidden">WALLET</span>
        </Button>
        <WalletModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onConnect={async () => {
            setShowModal(false)
            await connectWallet()
          }}
          isMetaMaskAvailable={isMetaMaskAvailable}
        />
      </>
    )
  }

  // CONNECTING — show loading
  if (status === 'CONNECTING') {
    return (
      <Button variant="outline" size="sm" disabled className="border-amber-500/30">
        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        <span className="hidden sm:inline">CONNECTING...</span>
      </Button>
    )
  }

  // WRONG_NETWORK — show switch button
  if (status === 'WRONG_NETWORK') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={switchToSepolia}
        className="border-amber-500/40 text-amber-300 hover:bg-amber-500/5"
      >
        <AlertTriangle className="h-4 w-4 mr-1.5" />
        <span className="hidden sm:inline">SWITCH TO SEPOLIA</span>
        <span className="sm:hidden">SWITCH</span>
      </Button>
    )
  }

  // ERROR — show error + retry
  if (status === 'ERROR') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => { connectWallet() }}
        className="border-rose-500/40 text-rose-300"
      >
        <AlertTriangle className="h-4 w-4 mr-1.5" />
        <span className="hidden sm:inline">RETRY</span>
      </Button>
    )
  }

  // CONNECTED — show wallet dropdown
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5 text-sm hover:bg-emerald-500/10 transition-colors">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-xs">{shortenAddress(address)}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-semibold">Wallet Connected</span>
              </div>
              <span className="font-mono text-xs text-muted-foreground break-all">{address}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium">{chainId ? getNetworkName(chainId) : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Chain ID</span>
              <span className="font-mono">{chainId}</span>
            </div>
            {balance !== null && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-mono text-amber-300">{balance} ETH</span>
              </div>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={async () => {
            const ok = await copyAddress()
            toast.success(ok ? 'Wallet address copied' : 'Copy failed')
          }}>
            <Copy className="h-4 w-4 mr-2" /> Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            const url = getExplorerUrl()
            if (url) window.open(url, '_blank')
          }}>
            <ExternalLink className="h-4 w-4 mr-2" /> View on Explorer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-rose-300 focus:text-rose-200"
            onClick={() => {
              setHasDisconnected(true)
              disconnectWallet()
            }}
          >
            <LogOut className="h-4 w-4 mr-2" /> Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

function WalletModal({
  open, onClose, onConnect, isMetaMaskAvailable,
}: {
  open: boolean
  onClose: () => void
  onConnect: () => void
  isMetaMaskAvailable: boolean
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="glass-strong rounded-2xl w-full max-w-md overflow-hidden glow-cyan"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-center">CONNECT YOUR WALLET</h3>
              <p className="mt-1 text-sm text-muted-foreground text-center">
                Connect your Web3 wallet to interact with the PharmaTrace blockchain environment.
              </p>

              <div className="mt-5">
                {isMetaMaskAvailable ? (
                  <button
                    onClick={onConnect}
                    className="w-full flex items-center justify-center gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all group"
                  >
                    <span className="text-3xl">🦊</span>
                    <div className="text-left">
                      <div className="font-semibold">MetaMask</div>
                      <div className="text-xs text-muted-foreground">Connect using MetaMask</div>
                    </div>
                    <div className="ml-auto">
                      <div className="rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-300 group-hover:bg-cyan-500/30 transition-colors">
                        CONNECT
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                      <p className="text-sm text-rose-300">MetaMask is not detected.</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Install MetaMask browser extension to connect your wallet.
                      </p>
                    </div>
                    <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
                      <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                        INSTALL METAMASK
                      </Button>
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-md bg-muted/30 border border-border/40 px-3 py-2 text-xs text-muted-foreground text-center">
                <Network className="h-3 w-3 inline mr-1" />
                PharmaTrace uses <strong className="text-foreground">{SUPPORTED_CHAIN_NAME}</strong> (Chain ID 11155111) for testing.
                <br />
                No real ETH required — this is a testnet demonstration.
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
