import { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { CHAIN_DATA } from '@/constants/chains'
import { initiateCrossChainTransfer } from '@/services/blockchain'
import { FaArrowRight, FaSpinner, FaTimes } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { ethers } from 'ethers'

interface CrossChainTransferModalProps {
  isOpen: boolean
  onClose: () => void
  carId: number
}

export default function CrossChainTransferModal({
  isOpen,
  onClose,
  carId,
}: CrossChainTransferModalProps) {
  const [transferLoading, setTransferLoading] = useState(false)
  const [selectedChain, setSelectedChain] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null)
  const [transferProgress, setTransferProgress] = useState<'idle' | 'preparing' | 'transferring' | 'completed'>('idle')

  const handleChainSelect = async (chainKey: string) => {
    setSelectedChain(chainKey)
    setTransferProgress('preparing')
    const chain = CHAIN_DATA[chainKey as keyof typeof CHAIN_DATA]
    
    try {
     
      const response = await fetch('/api/across-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenSymbol: 'ETH',
          amount: '1000000000000000',
          destinationChainId: chain.id,
          originChainId: 11155111, 
          destinationAddress: '0x0000000000000000000000000000000000000000',
          timestamp: Math.floor(Date.now() / 1000),
          skipAmountLimit: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch fee estimate')
      }

      const data = await response.json()
      console.log('Quote data:', data)

      // Calculate the relayer fee in ETH
      if (data.relayerFeeInUnits) {
        setEstimatedFee(ethers.formatEther(data.relayerFeeInUnits))
      } else if (data.relayerFeePct) {
        // Convert basis points (0.01%) to actual fee
        const feePct = Number(data.relayerFeePct) / 10000 
        const feeAmount = BigInt(data.inputAmount) * BigInt(Math.floor(feePct * 100)) / BigInt(100)
        setEstimatedFee(ethers.formatEther(feeAmount.toString()))
      } else {
        setEstimatedFee('Unknown')
      }
    } catch (error) {
      console.error('Error fetching fee estimate:', error)
      toast.error('Failed to fetch fee estimate')
      setEstimatedFee('Unknown')
    }
  }

  const handleTransfer = async () => {
    if (!selectedChain) return
    
    const chain = CHAIN_DATA[selectedChain as keyof typeof CHAIN_DATA]
    if (!chain || chain.status !== 'available') return

    setTransferLoading(true)
    setTransferProgress('transferring')
    
    try {
      await initiateCrossChainTransfer(carId, chain.id)
      setTransferProgress('completed')
      toast.success(`Transfer to ${chain.name} initiated successfully!`)
      setTimeout(() => onClose(), 2000)
    } catch (error: any) {
      console.error('Error transferring:', error)
      toast.error(error.message || 'Failed to transfer')
      setTransferProgress('idle')
    } finally {
      setTransferLoading(false)
    }
  }

  const chains = Object.entries(CHAIN_DATA)
    .filter(([_, chain]) => chain.id !== 11155111)
    .reduce((acc, [key, chain]) => {
      if (chain.status === 'available') {
        acc.available.push([key, chain]);
      } else {
        acc.comingSoon.push([key, chain]);
      }
      return acc;
    }, { available: [], comingSoon: [] } as { 
      available: [string, typeof CHAIN_DATA[keyof typeof CHAIN_DATA]][], 
      comingSoon: [string, typeof CHAIN_DATA[keyof typeof CHAIN_DATA]][] 
    });

  const getChainStatusIndicator = (status: string) => {
    switch (status) {
      case 'available':
        return <span className="text-green-400 text-xs">Available</span>
      case 'commingSoon':
        return <span className="text-yellow-400 text-xs">Coming Soon</span>
      default:
        return <span className="text-gray-400 text-xs">Unavailable</span>
    }
  }

  const steps = [
    { number: 1, title: 'Select Chain', description: 'Choose destination network' },
    { number: 2, title: 'Review', description: 'Check transfer details and fees' },
    { number: 3, title: 'Transfer', description: 'Confirm and process transfer' }
  ]

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => !transferLoading && onClose()}
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
                    disabled={transferLoading}
                    className="text-gray-400 hover:text-purple-400 transition-colors disabled:opacity-50"
                  >
                    <FaTimes className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <Dialog.Title as="h3" className="text-2xl font-bold mb-2">
                    <span className="bg-gradient-to-r from-purple-500 to-purple-400 text-transparent bg-clip-text">
                      Cross-Chain Transfer
                    </span>
                  </Dialog.Title>
                  <div className="flex items-center space-x-2 text-gray-400">
                    <p>Transfer your car listing to another blockchain network</p>
                    <span className="text-gray-500">•</span>
                    <div className="flex items-center">
                      <span className="text-sm">Powered by</span>
                      <img 
                        src="/images/assets/across.png" 
                        alt="Across Protocol" 
                        className="h-10 w-10 ml-2 rounded-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                  <div className="flex justify-between">
                    {steps.map((step) => (
                      <div key={step.number} className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center mb-2
                            ${currentStep === step.number
                              ? 'bg-purple-500 text-white'
                              : currentStep > step.number
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-700 text-gray-400'
                            }`}
                        >
                          {currentStep > step.number ? '✓' : step.number}
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-white">{step.title}</p>
                          <p className="text-xs text-gray-400">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  {currentStep === 1 && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4">Select Destination Chain</h4>
                      
                      {/* Available Chains */}
                      <div className="mb-8">
                        <h5 className="text-sm font-medium text-gray-400 mb-3">Available Networks</h5>
                        <div className="space-y-3">
                          {chains.available.map(([key, chain]) => (
                            <button
                              key={chain.id}
                              onClick={() => handleChainSelect(key)}
                              disabled={transferLoading}
                              className={`w-full flex items-center justify-between p-4 rounded-xl 
                                       transition-all duration-200 border
                                       ${selectedChain === key 
                                         ? 'bg-purple-500/20 border-purple-500' 
                                         : 'bg-gray-800/50 border-purple-500/20 hover:bg-gray-800 hover:border-purple-500/40'}
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       group`}
                            >
                              <div className="flex items-center">
                                <img
                                  src={chain.logo}
                                  alt={chain.name}
                                  className="w-8 h-8 rounded-full mr-3"
                                />
                                <div className="text-left">
                                  <h3 className="text-white font-medium">{chain.name}</h3>
                                  <div className="text-sm">
                                    {getChainStatusIndicator(chain.status)}
                                  </div>
                                </div>
                              </div>
                              {selectedChain === key ? (
                                <div className="h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center">
                                  <span className="text-white text-sm">✓</span>
                                </div>
                              ) : (
                                <FaArrowRight className="h-5 w-5 text-purple-400 transform transition-transform group-hover:translate-x-1" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Coming Soon Chains */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-400 mb-3">Coming Soon</h5>
                        <div className="space-y-3">
                          {chains.comingSoon.map(([key, chain]) => (
                            <div
                              key={chain.id}
                              className="w-full flex items-center justify-between p-4 rounded-xl 
                                       bg-gray-800/20 border border-gray-700
                                       opacity-50 cursor-not-allowed"
                            >
                              <div className="flex items-center">
                                <img
                                  src={chain.logo}
                                  alt={chain.name}
                                  className="w-8 h-8 rounded-full mr-3 grayscale"
                                />
                                <div className="text-left">
                                  <h3 className="text-white font-medium">{chain.name}</h3>
                                  <div className="text-sm">
                                    {getChainStatusIndicator(chain.status)}
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-gray-500 italic">Coming Soon</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && selectedChain && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white mb-4">Review Transfer Details</h4>
                      
                      <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Protocol</span>
                          <div className="flex items-center">
                          <img 
                        src="/images/assets/across.png" 
                        alt="Across Protocol" 
                        className="h-6 w-6 mr-2 rounded-full"
                      />
                            <span className="text-white font-medium">Across Protocol</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Destination Chain</span>
                          <span className="text-white font-medium">
                            {CHAIN_DATA[selectedChain as keyof typeof CHAIN_DATA].name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Estimated Fee</span>
                          <span className="text-white font-medium">
                            {estimatedFee ? `~${estimatedFee} ETH` : <FaSpinner className="animate-spin" />}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Transfer Time</span>
                          <span className="text-white font-medium">~2-3 minutes</span>
                        </div>
                      </div>

                      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-blue-400">
                              Your transfer will be processed by Across Protocol, a secure cross-chain bridge with built-in liquidity and fast finality.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="text-center space-y-4">
                      {transferProgress === 'completed' ? (
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-green-500 rounded-full mx-auto flex items-center justify-center">
                            <span className="text-white text-2xl">✓</span>
                          </div>
                          <h4 className="text-lg font-semibold text-white">Transfer Initiated!</h4>
                          <p className="text-gray-400">
                            Your car is being transferred. This process takes about 15-30 minutes to complete.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <FaSpinner className="h-16 w-16 text-purple-500 animate-spin mx-auto" />
                          <h4 className="text-lg font-semibold text-white">Processing Transfer</h4>
                          <p className="text-gray-400">
                            Please confirm the transaction in your wallet...
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  {currentStep !== 3 && (
                    <div className="flex justify-between mt-6">
                      <button
                        onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                        disabled={currentStep === 1 || transferLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => {
                          if (currentStep === 2) {
                            handleTransfer()
                          }
                          setCurrentStep(prev => Math.min(3, prev + 1))
                        }}
                        disabled={
                          (currentStep === 1 && !selectedChain) ||
                          transferLoading
                        }
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 disabled:opacity-50"
                      >
                        {currentStep === 2 ? 'Confirm Transfer' : 'Next'}
                      </button>
                    </div>
                  )}

                  {/* Warning Section */}
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mt-6">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-yellow-200/80 text-sm">
                          You'll need to pay a small relayer fee in ETH on the source chain. Across Protocol will handle the cross-chain transfer securely.
                        </p>
                      </div>
                    </div>
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