/**
 * PharmaTrace Wallet Store
 *
 * Real MetaMask/EVM wallet connection using the browser's injected
 * Ethereum provider (window.ethereum). Uses viem for address
 * validation and chain utilities.
 *
 * Features:
 *   - Detect MetaMask / injected wallet
 *   - Connect (eth_requestAccounts)
 *   - Listen for account changes (accountsChanged)
 *   - Listen for network changes (chainChanged)
 *   - Disconnect (clears app state, does NOT revoke MetaMask permissions)
 *   - Persist connection state in localStorage
 *   - Switch to Sepolia testnet
 *   - Get ETH balance
 *   - Copy address
 *   - Generate block explorer URL
 *
 * NEVER requests private keys, seed phrases, or wallet credentials.
 * Only requests the public wallet address and network information.
 */

import { create } from 'zustand'
import { getAddress, isAddress, formatEther } from 'viem'
import { sepolia } from 'viem/chains'

// Supported chain: Ethereum Sepolia testnet (Chain ID 11155111)
export const SUPPORTED_CHAIN_ID = 11155111
export const SUPPORTED_CHAIN_NAME = 'Ethereum Sepolia'
export const SUPPORTED_CHAIN_RPC = 'https://rpc.sepolia.org'
export const BLOCK_EXPLORER = 'https://sepolia.etherscan.io'

export type WalletStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'WRONG_NETWORK' | 'NO_WALLET' | 'ERROR'

export interface WalletState {
  status: WalletStatus
  address: string | null
  chainId: number | null
  balance: string | null
  error: string | null
  isMetaMaskAvailable: boolean

  // Actions
  init: () => void
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchToSepolia: () => Promise<void>
  refreshBalance: () => Promise<void>
  copyAddress: () => Promise<boolean>
  getExplorerUrl: () => string | null
  shortenAddress: (addr: string | null) => string
}

const STORAGE_KEY = 'pharmatrace_wallet_connected'

// Minimal EIP-1193 provider type
interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>
  on?: (event: string, listener: (...args: unknown[]) => void) => void
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void
  isMetaMask?: boolean
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider
  }
}

function getProvider(): Eip1193Provider | null {
  if (typeof window === 'undefined') return null
  if (window.ethereum) return window.ethereum
  return null
}

function shortenAddress(addr: string | null): string {
  if (!addr) return ''
  if (addr.length < 12) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function getNetworkName(chainId: number): string {
  const networks: Record<number, string> = {
    1: 'Ethereum Mainnet',
    11155111: 'Ethereum Sepolia',
    137: 'Polygon',
    80001: 'Polygon Mumbai',
    56: 'BSC',
    97: 'BSC Testnet',
  }
  return networks[chainId] || `Chain ID: ${chainId}`
}

export const useWallet = create<WalletState>((set, get) => ({
  status: 'DISCONNECTED',
  address: null,
  chainId: null,
  balance: null,
  error: null,
  isMetaMaskAvailable: false,

  init: () => {
    if (typeof window === 'undefined') return
    const provider = getProvider()
    const available = !!provider
    set({ isMetaMaskAvailable: available })

    if (!available) return

    // Check if previously connected
    const wasConnected = localStorage.getItem(STORAGE_KEY) === 'true'
    if (wasConnected) {
      // Try to restore connection (no popup — just check if already authorized)
      provider.request({ method: 'eth_accounts' }).then((accounts: unknown) => {
        const accs = accounts as string[]
        if (accs && accs.length > 0) {
          const address = getAddress(accs[0])
          provider.request({ method: 'eth_chainId' }).then((chainIdHex: unknown) => {
            const chainId = parseInt(chainIdHex as string, 16)
            const isCorrect = chainId === SUPPORTED_CHAIN_ID
            set({
              status: isCorrect ? 'CONNECTED' : 'WRONG_NETWORK',
              address,
              chainId,
              error: isCorrect ? null : `Please switch to ${SUPPORTED_CHAIN_NAME}`,
            })
            if (isCorrect) get().refreshBalance()
          })
        }
      }).catch(() => {})
    }

    // Listen for account changes
    provider.on?.('accountsChanged', (accounts: unknown) => {
      const accs = accounts as string[]
      if (!accs || accs.length === 0) {
        get().disconnectWallet()
      } else {
        const address = getAddress(accs[0])
        set({ address, error: null })
        get().refreshBalance()
      }
    })

    // Listen for chain changes
    provider.on?.('chainChanged', (chainIdHex: unknown) => {
      const chainId = parseInt(chainIdHex as string, 16)
      const isCorrect = chainId === SUPPORTED_CHAIN_ID
      set({
        chainId,
        status: isCorrect ? 'CONNECTED' : 'WRONG_NETWORK',
        error: isCorrect ? null : `Please switch to ${SUPPORTED_CHAIN_NAME}.`,
      })
      if (isCorrect) get().refreshBalance()
    })
  },

  connectWallet: async () => {
    const provider = getProvider()
    if (!provider) {
      set({ status: 'NO_WALLET', error: 'MetaMask was not detected in this browser.' })
      return
    }

    set({ status: 'CONNECTING', error: null })

    try {
      // First try silent check — if MetaMask already has this site authorized,
      // it returns accounts WITHOUT showing a popup
      let accounts: string[] = []
      try {
        const silentAccounts = await provider.request({ method: 'eth_accounts' }) as string[]
        if (silentAccounts && silentAccounts.length > 0) {
          accounts = silentAccounts
        }
      } catch { /* ignore silent check errors */ }

      // If no accounts from silent check, request explicitly (shows popup)
      if (accounts.length === 0) {
        accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[]
      }

      if (!accounts || accounts.length === 0) {
        set({ status: 'DISCONNECTED', error: 'No accounts found.' })
        return
      }

      const address = getAddress(accounts[0])

      // Get chain ID
      const chainIdHex = await provider.request({ method: 'eth_chainId' }) as string
      const chainId = parseInt(chainIdHex, 16)

      const isCorrect = chainId === SUPPORTED_CHAIN_ID
      localStorage.setItem(STORAGE_KEY, 'true')

      set({
        status: isCorrect ? 'CONNECTED' : 'WRONG_NETWORK',
        address,
        chainId,
        error: isCorrect ? null : `Please switch to ${SUPPORTED_CHAIN_NAME}.`,
      })

      if (isCorrect) {
        await get().refreshBalance()
      }
    } catch (err) {
      const e = err as { code?: number; message?: string }
      if (e.code === 4001) {
        // User rejected
        set({ status: 'DISCONNECTED', error: 'Wallet connection request was rejected.' })
      } else {
        set({ status: 'ERROR', error: e.message || 'Unable to connect to the blockchain network.' })
      }
    }
  },

  disconnectWallet: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({
      status: 'DISCONNECTED',
      address: null,
      chainId: null,
      balance: null,
      error: null,
    })
  },

  switchToSepolia: async () => {
    const provider = getProvider()
    if (!provider) return

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // 11155111 in hex
      })
    } catch (switchError) {
      const e = switchError as { code?: number }
      // Chain not added to MetaMask (code 4902)
      if (e.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Ethereum Sepolia',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: [SUPPORTED_CHAIN_RPC],
              blockExplorerUrls: [BLOCK_EXPLORER],
            }],
          })
        } catch {
          set({ error: 'Failed to add Sepolia network to MetaMask.' })
        }
      } else {
        set({ error: 'Failed to switch network.' })
      }
    }
  },

  refreshBalance: async () => {
    const { address } = get()
    if (!address) return
    const provider = getProvider()
    if (!provider) return

    try {
      const balanceHex = await provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }) as string
      const balanceWei = BigInt(balanceHex)
      const balanceEth = formatEther(balanceWei)
      set({ balance: parseFloat(balanceEth).toFixed(4) })
    } catch {
      set({ balance: null })
    }
  },

  copyAddress: async () => {
    const { address } = get()
    if (!address) return false
    try {
      await navigator.clipboard.writeText(address)
      return true
    } catch {
      return false
    }
  },

  getExplorerUrl: () => {
    const { address } = get()
    if (!address) return null
    return `${BLOCK_EXPLORER}/address/${address}`
  },

  shortenAddress,
}))

export { isAddress, getAddress, sepolia, getNetworkName }
