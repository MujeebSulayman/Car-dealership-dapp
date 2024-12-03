import { CHAIN_DATA } from '@/constants/chains'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaExchangeAlt, FaInfoCircle, FaChevronRight } from 'react-icons/fa'
import { toast } from 'react-toastify'

interface Props {
  isOpen: boolean
  onClose: () => void
  onTransfer: (chainId: number) => Promise<void>
  isTransferring: boolean
  currentChainId: number
}

export const CrossChainTransferModal = ({ isOpen, onClose, onTransfer, isTransferring, currentChainId }: Props) => {
  const [selectedChain, setSelectedChain] = useState<number>(0)
  const [transferStatus, setTransferStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleTransfer = async (chainId: number) => {
    if (chainId === currentChainId) {
      toast.error('Cannot transfer to the same chain')
      return
    }

    setTransferStatus('loading')
    try {
      await onTransfer(chainId)
      setTransferStatus('success')
      setTimeout(() => onClose(), 2000) // Close modal after success
    } catch (error) {
      setTransferStatus('error')
      console.error('Transfer failed:', error)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gray-900 rounded-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking modal content
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <FaExchangeAlt className="mr-2 text-purple-400" />
                Cross-Chain Bridge
              </h2>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {Object.values(CHAIN_DATA).map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => handleTransfer(chain.id)}
                  disabled={isTransferring || chain.id === currentChainId}
                  className={`w-full flex items-center justify-between p-4 rounded-lg 
                    ${chain.id === currentChainId 
                      ? 'bg-gray-800/30 cursor-not-allowed' 
                      : 'bg-gray-800/50 hover:bg-gray-700/50'} 
                    transition-colors`}
                >
                  <div className="flex items-center">
                    <img 
                      src={chain.logo} 
                      alt={chain.name} 
                      className="w-8 h-8 rounded-full mr-3"
                    />
                    <div>
                      <div className="text-white font-medium">{chain.name}</div>
                      <div className="text-sm text-gray-400">Chain ID: {chain.id}</div>
                    </div>
                  </div>
                  <FaChevronRight className="text-gray-400" />
                </button>
              ))}
            </div>

            {transferStatus === 'loading' && (
              <div className="mt-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-400 mx-auto" />
                <p className="text-gray-400 mt-2">Initiating transfer...</p>
              </div>
            )}

            {transferStatus === 'success' && (
              <div className="mt-4 text-center text-green-400">
                <p>Transfer initiated successfully!</p>
              </div>
            )}

            {transferStatus === 'error' && (
              <div className="mt-4 text-center text-red-400">
                <p>Transfer failed. Please try again.</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 