import { useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { CHAIN_DATA } from '@/constants/chains'
import Image from 'next/image'
import { getAcrossQuote, purchaseCarFromChain } from '@/services/blockchain'
import { FaArrowRight, FaSpinner, FaTimes } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { ethers } from 'ethers'

interface CrossChainPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  carPrice: string
  onPurchase: (chainId: number, price: string) => Promise<void>
}

export default function CrossChainPurchaseModal({
  isOpen,
  onClose,
  carPrice,
  onPurchase,
}: CrossChainPurchaseModalProps) {
  const [selectedChain, setSelectedChain] = useState<number | null>(null)
  const [chainPrice, setChainPrice] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [purchaseLoading, setPurchaseLoading] = useState(false)

  const handleChainSelect = async (chainId: number) => {
    setLoading(true)
    try {
      // If source and destination chains are the same, use direct purchase
      if (chainId === 11155111) { 
        setChainPrice(carPrice)
        setSelectedChain(chainId)
      } else {
        const quote = await getAcrossQuote(Number(ethers.parseEther(carPrice)), chainId)
        const price = ethers.formatEther(quote.amount)
        setChainPrice(price)
        setSelectedChain(chainId)
      }
    } catch (error) {
      console.error('Error getting chain price:', error)
      toast.error('Failed to get price quote')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!selectedChain || !chainPrice) return
    setPurchaseLoading(true)
    try {
      await onPurchase(selectedChain, chainPrice)
      onClose()
      toast.success('Purchase initiated successfully!')
    } catch (error) {
      console.error('Error purchasing:', error)
      toast.error('Failed to process purchase')
    } finally {
      setPurchaseLoading(false)
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={onClose}
        open={isOpen}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gray-900/95 p-6 text-left align-middle shadow-xl transition-all border border-purple-500/20 backdrop-blur-sm">
                <div className="absolute top-3 right-3">
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    <FaTimes className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <Dialog.Title as="h3" className="text-2xl font-bold mb-2">
                    <span className="bg-gradient-to-r from-purple-500 to-purple-400 text-transparent bg-clip-text">
                      Cross-Chain Purchase
                    </span>
                  </Dialog.Title>
                  <p className="text-gray-400">
                    Powered by Across Protocol for secure cross-chain transactions
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Price Summary Card */}
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-purple-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-300">Original Price</span>
                      <span className="text-xl font-bold text-white">{carPrice} ETH</span>
                    </div>
                    {selectedChain && chainPrice && (
                      <>
                        <div className="flex justify-center my-4">
                          <div className="bg-purple-500/20 rounded-full p-2">
                            <FaArrowRight className="h-5 w-5 text-purple-400" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Total with Bridge Fee</span>
                          <span className="text-xl font-bold text-white">{chainPrice} ETH</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Chain Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-white">Select Destination Chain</h4>
                      <div className="flex items-center space-x-2">
                        <Image
                          src="/images/assets/across.png"
                          alt="Across Protocol"
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <span className="text-sm text-gray-100">Across Protocol</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.values(CHAIN_DATA).map(chain => (
                        <button
                          key={chain.id}
                          onClick={() => chain.status === 'available' && handleChainSelect(chain.id)}
                          disabled={chain.status !== 'available'}
                          className={`
                            group relative flex items-center space-x-3 p-5 rounded-xl border transition-all
                            ${chain.status !== 'available' 
                              ? 'border-gray-700/50 opacity-60 cursor-not-allowed bg-gray-800/30' 
                              : selectedChain === chain.id
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-gray-700/50 hover:border-purple-500/50 hover:bg-purple-500/5'
                            }
                          `}
                        >
                          <div className="relative w-10 h-10">
                            <Image
                              src={chain.logo}
                              alt={chain.name}
                              fill
                              className="rounded-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-white truncate">{chain.name}</h3>
                            {selectedChain === chain.id && chainPrice && (
                              <p className="text-sm text-purple-400 truncate">
                                {chainPrice} ETH
                              </p>
                            )}
                          </div>
                          {chain.status !== 'available' && (
                            <span className="absolute top-2 right-2 text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                              Coming Soon
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  {selectedChain && chainPrice && (
                    <button
                      onClick={handlePurchase}
                      disabled={purchaseLoading}
                      className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/20"
                    >
                      {purchaseLoading ? (
                        <>
                          <FaSpinner className="animate-spin h-5 w-5" />
                          <span>Processing Transaction...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirm Cross-Chain Purchase</span>
                          <FaArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  )}

                  {/* Info Footer */}
                  <div className="text-center text-sm text-gray-400">
                    <p>Transactions are secured and bridged by Across Protocol</p>
                    <p className="mt-1">Gas fees and bridge costs are included in the total price</p>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
