'use client'
import { useEffect, useState } from 'react'
import { useRouter } from '@/store/router'
import { useWallet, SUPPORTED_CHAIN_NAME, getNetworkName, BLOCK_EXPLORER } from '@/store/wallet'
import { PageHeader, LoadingState, EmptyState } from '../States'
import { GlassCard } from '../GlassCard'
import { Button } from '@/components/ui/button'
import { apiGet } from '@/lib/client/api'
import { fmtDate, fmtRelative, shortHash } from '@/lib/client/format'
import {
  Wallet, Network, Zap, ExternalLink, Copy, ShieldCheck,
  CheckCircle2, AlertTriangle, Boxes, Activity, Cpu, Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface DrugItem {
  id: string; drugId: string; drugName: string; batchNumber: string; status: string
}

export function WalletView() {
  const { navigate } = useRouter()
  const {
    status, address, chainId, balance, isMetaMaskAvailable,
    connectWallet, disconnectWallet, switchToSepolia, copyAddress, getExplorerUrl, shortenAddress,
  } = useWallet()
  const [drugs, setDrugs] = useState<DrugItem[]>([])
  const [loadingDrugs, setLoadingDrugs] = useState(true)

  useEffect(() => {
    apiGet<{ drugs: DrugItem[] }>('/api/drugs?limit=100')
      .then((res) => setDrugs(res.drugs))
      .catch(() => {})
      .finally(() => setLoadingDrugs(false))
  }, [])

  const isConnected = status === 'CONNECTED'

  if (status === 'NO_WALLET' || status === 'DISCONNECTED') {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<Wallet className="h-5 w-5" />}
          title="Web3 Dashboard"
          subtitle="Connect your MetaMask wallet to interact with the PharmaTrace blockchain."
        />
        <GlassCard className="text-center p-8">
          <Wallet className="h-12 w-12 text-cyan-300/60 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No Wallet Connected</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {isMetaMaskAvailable
              ? 'Click "Connect Wallet" in the navbar to connect your MetaMask wallet.'
              : 'MetaMask was not detected. Install MetaMask to use Web3 features.'}
          </p>
          {isMetaMaskAvailable ? (
            <Button className="mt-4" onClick={connectWallet}>
              <Wallet className="h-4 w-4 mr-2" /> Connect Wallet
            </Button>
          ) : (
            <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
              <Button className="mt-4">Install MetaMask</Button>
            </a>
          )}
        </GlassCard>
      </div>
    )
  }

  if (status === 'WRONG_NETWORK') {
    return (
      <div className="space-y-6">
        <PageHeader icon={<Wallet className="h-5 w-5" />} title="Web3 Dashboard" />
        <GlassCard glow="amber" className="text-center p-8">
          <AlertTriangle className="h-12 w-12 text-amber-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-amber-300">UNSUPPORTED NETWORK</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            PharmaTrace currently supports {SUPPORTED_CHAIN_NAME} for this demonstration.
          </p>
          <Button className="mt-4" variant="outline" onClick={switchToSepolia}>
            <Network className="h-4 w-4 mr-2" /> SWITCH TO SEPOLIA
          </Button>
        </GlassCard>
      </div>
    )
  }

  if (!isConnected) {
    return <LoadingState label="Connecting wallet…" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Wallet className="h-5 w-5" />}
        title="Web3 Dashboard"
        subtitle="Your connected MetaMask wallet and blockchain activity."
      />

      {/* Wallet Identity Card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard glow="cyan" className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-emerald-500/15 p-4 ring-1 ring-emerald-500/30 text-emerald-300 shrink-0">
              <Wallet className="h-8 w-8" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                <h2 className="text-xl font-semibold">WALLET CONNECTED</h2>
              </div>
              <div className="mt-2 font-mono text-sm break-all text-cyan-300">{address}</div>
              <div className="mt-3 grid sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Network</div>
                  <div className="font-medium">{chainId ? getNetworkName(chainId) : '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Chain ID</div>
                  <div className="font-mono">{chainId}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Test ETH Balance</div>
                  <div className="font-mono text-amber-300">{balance ?? '—'} ETH</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={async () => {
                  const ok = await copyAddress()
                  toast.success(ok ? 'Address copied' : 'Copy failed')
                }}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Address
                </Button>
                <a href={getExplorerUrl() ?? '#'} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View on Explorer
                </Button>
                </a>
                <Button variant="outline" size="sm" onClick={disconnectWallet}>
                  Disconnect
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Network Status */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">RPC Status</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-1 font-semibold text-emerald-300">CONNECTED</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Wallet</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-1 font-semibold text-emerald-300">CONNECTED</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Blockchain</span>
            <Activity className="h-4 w-4 text-cyan-400 animate-pulse" />
          </div>
          <div className="mt-1 font-semibold text-cyan-300">ONLINE</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Network</span>
            <Network className="h-4 w-4 text-violet-400" />
          </div>
          <div className="mt-1 font-semibold">{chainId ? getNetworkName(chainId) : '—'}</div>
        </GlassCard>
      </div>

      {/* Contract Info */}
      <GlassCard>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Cpu className="h-4 w-4 text-violet-300" /> SMART CONTRACT
        </h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Contract Address</span>
            <span className="font-mono text-xs">
              {process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'Not deployed yet (Demo Mode)'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Network</span>
            <span>{SUPPORTED_CHAIN_NAME}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Explorer</span>
            <a href={BLOCK_EXPLORER} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
              Sepolia Etherscan <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="text-amber-300">DEMO MODE (Local Blockchain)</span>
          </div>
        </div>
      </GlassCard>

      {/* Registered Batches */}
      <GlassCard>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Boxes className="h-4 w-4 text-cyan-300" /> REGISTERED BATCHES
        </h3>
        {loadingDrugs ? <LoadingState label="Loading batches…" /> : drugs.length === 0 ? (
          <EmptyState title="No batches found" />
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
            {drugs.slice(0, 10).map((d) => (
              <button
                key={d.id}
                onClick={() => navigate('drug-detail', { id: d.drugId })}
                className="w-full flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 hover:bg-muted/40 transition-colors text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{d.drugName}</div>
                  <div className="text-xs text-muted-foreground font-mono">{d.batchNumber}</div>
                </div>
                <span className="text-xs text-muted-foreground">{d.status}</span>
              </button>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Disclaimer */}
      <div className="text-center text-xs text-muted-foreground py-4">
        <ShieldCheck className="h-4 w-4 inline mr-1" />
        PharmaTrace uses {SUPPORTED_CHAIN_NAME} testnet for academic demonstration.
        No real ETH is required. Test ETH balance is for demonstration only.
        <br />
        Public QR verification does NOT require MetaMask — wallet is only for supply-chain actions.
      </div>
    </div>
  )
}
