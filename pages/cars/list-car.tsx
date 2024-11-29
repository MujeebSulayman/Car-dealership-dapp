import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAccount, useNetwork } from 'wagmi'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'
import { listCar } from '@/services/blockchain'
import {
  CarBasicDetails,
  CarTechnicalDetails,
  CarAdditionalInfo,
  SellerDetails,
} from '@/utils/type.dt'
import { FaCar, FaExchangeAlt, FaClock, FaGasPump } from 'react-icons/fa'
import { BiTransfer } from 'react-icons/bi'
import { ethers } from 'ethers'

const ListCarPage = () => {
  const { address } = useAccount()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [images, setImages] = useState<string[]>([])
  const { chain } = useNetwork()

  const [formData, setFormData] = useState({
    // Basic Details
    name: '',
    description: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',

    // Technical Details
    mileage: '',
    color: '',
    condition: 0, // New
    transmission: 0, // Manual
    fuelType: 0, // Gasoline
    price: '',

    // Additional Info
    location: '',
    carHistory: '',
    features: [] as string[],

    // Seller Details
    sellerName: '',
    email: '',
    phoneNumber: '',
    profileImage: '',

    // Chain Details
    destinationChainId: 11155111, // Default to Ethereum Sepolia
    paymentToken: '0x0000000000000000000000000000000000000000', // Default to native token
  })

  const [bridgeDetails, setBridgeDetails] = useState({
    estimatedFee: '0',
    estimatedTime: '0',
    gasPrice: '0',
    isLoading: true,
  })

  // Add supported testnet chains
  const supportedChains = [
    { id: 421614, name: 'Arbitrum Sepolia' },
    { id: 84532, name: 'Base Sepolia' },
    { id: 168587773, name: 'Blast Sepolia' },
    { id: 11155111, name: 'Ethereum Sepolia' },
    { id: 4202, name: 'Lisk Sepolia' },
    { id: 919, name: 'Mode Testnet' },
    { id: 11155420, name: 'Optimism Sepolia' },
    { id: 80002, name: 'Polygon Amoy' },
  ] as const

  // Add supported tokens with testnet addresses
  const supportedTokens = [
    { address: ethers.ZeroAddress, symbol: 'Native Token', decimals: 18 },
    // Sepolia USDC addresses for different chains
    { 
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia USDC
      symbol: 'USDC',
      decimals: 6
    },
    {
      address: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7', // Sepolia USDT
      symbol: 'USDT',
      decimals: 6
    }
  ] as const

  // Add a helper function to get chain-specific token addresses
  const getTokenAddressForChain = (chainId: number, symbol: string) => {
    // Token addresses for different testnet chains
    const tokenAddresses: Record<number, Record<string, string>> = {
      11155111: { // Ethereum Sepolia
        USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        USDT: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7'
      },
      421614: { // Arbitrum Sepolia
        USDC: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
        USDT: '0x5D3c1939387748B4E8750CDf244B0D6750C489c6'
      },
      84532: { // Base Sepolia
        USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7c',
        USDT: '0x4A3A6Dd60A34bB2Aba60D73B4C88315E9CeB6A3D'
      },
      11155420: { // Optimism Sepolia
        USDC: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
        USDT: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7'
      },
      80002: { // Polygon Amoy
        USDC: '0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97',
        USDT: '0x7e752bC77eBE2225B327e6ebA2fF5224F2046669'
      }

    }

    return tokenAddresses[chainId]?.[symbol] || ethers.ZeroAddress
  }

  const handleAddImageUrl = (e: React.FormEvent) => {
    e.preventDefault()
    if (imageUrl.trim()) {
      setImages((prev) => [...prev, imageUrl.trim()])
      setImageUrl('') // Clear input after adding
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    if (formData.destinationChainId === chain?.id) {
      toast.error('Destination chain must be different from current chain')
      return
    }

    try {
      setLoading(true)

      const basicDetails: CarBasicDetails = {
        name: formData.name,
        images: images,
        description: formData.description,
        make: formData.make,
        model: formData.model,
        year: Number(formData.year),
        vin: Number(formData.vin),
      }

      const technicalDetails: CarTechnicalDetails = {
        mileage: Number(formData.mileage),
        color: formData.color,
        condition: formData.condition,
        transmission: formData.transmission,
        fuelType: formData.fuelType,
        price: Number(formData.price),
      }

      const additionalInfo: CarAdditionalInfo = {
        location: formData.location,
        carHistory: formData.carHistory,
        features: formData.features,
      }

      const sellerDetails: SellerDetails = {
        wallet: address,
        sellerName: formData.sellerName,
        email: formData.email,
        phoneNumber: Number(formData.phoneNumber),
        profileImage: formData.profileImage || '/images/default-avatar.png',
      }

      await listCar({
        basicDetails,
        technicalDetails,
        additionalInfo,
        sellerDetails,
        destinationChainId: formData.destinationChainId,
        paymentToken: formData.paymentToken,
      })

      toast.success('Car listed successfully!')
      router.push('/marketplace')
    } catch (error) {
      console.error('Error listing car:', error)
      toast.error('Failed to list car. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFeatureInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const value = (e.target as HTMLInputElement).value.trim()
      if (value && !formData.features.includes(value)) {
        setFormData((prev) => ({
          ...prev,
          features: [...prev.features, value],
        }))
        ;(e.target as HTMLInputElement).value = ''
      }
    }
  }

  const updateBridgeEstimates = async () => {
    if (!formData.destinationChainId || !formData.price) return

    try {
      setBridgeDetails((prev) => ({ ...prev, isLoading: true }))

      // TODO: Replace with actual Across Protocol API calls
      // This is a placeholder for demonstration
      const estimates = {
        estimatedFee: (Number(formData.price) * 0.001).toFixed(4), // 0.1% fee example
        estimatedTime: '15',
        gasPrice: '50',
      }

      setBridgeDetails({
        ...estimates,
        isLoading: false,
      })
    } catch (error) {
      console.error('Error fetching bridge estimates:', error)
      setBridgeDetails((prev) => ({ ...prev, isLoading: false }))
    }
  }

  useEffect(() => {
    updateBridgeEstimates()
  }, [formData.destinationChainId, formData.price])

  return (
    <div className="min-h-screen pt-20 pb-10 bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-4"
          >
            List Your Car
          </motion.h1>
          <p className="text-gray-400">
            Provide detailed information about your vehicle to create an attractive listing
          </p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-8 bg-zinc-900/50 backdrop-blur-sm p-6 rounded-xl border border-zinc-800/50"
        >
          {/* Basic Details Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">Basic Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Car Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g., 2023 Mercedes-Benz C-Class"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Make</label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g., Mercedes-Benz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g., C-Class"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Year</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  required
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
                placeholder="Describe your car's features, history, and condition..."
              />
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white">Car Images</h2>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Enter image URL"
                    className="flex-1 px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-300"
                  >
                    Add Image
                  </button>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Car image ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src = '/images/placeholder.png'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setImages(images.filter((_, i) => i !== index))}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <span className="sr-only">Remove image</span>×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-sm text-gray-400">
                  Add at least one image URL for your car. Supported formats: JPG, PNG, WebP
                </p>
              </div>
            </div>
          </div>

          {/* Technical Details Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">Technical Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Mileage (km)</label>
                <input
                  type="number"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Color</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Condition</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value={0}>New</option>
                  <option value={1}>Used</option>
                  <option value={2}>Certified Pre-Owned</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Price (ETH)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Transmission</label>
                <select
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value={0}>Manual</option>
                  <option value={1}>Automatic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Fuel Type</label>
                <select
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value={0}>Gasoline</option>
                  <option value={1}>Diesel</option>
                  <option value={2}>Electric</option>
                  <option value={3}>Hybrid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Add Chain Details Section after Technical Details */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">Chain Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Destination Chain
                </label>
                <select
                  name="destinationChainId"
                  value={formData.destinationChainId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
                >
                  {supportedChains.map((supportedChain) => (
                    <option
                      key={supportedChain.id}
                      value={supportedChain.id}
                      disabled={chain?.id === supportedChain.id}
                    >
                      {supportedChain.name}{' '}
                      {chain?.id === supportedChain.id ? '(Current Chain)' : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-400">
                  Select the blockchain network where you want to list your car
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Payment Token
                </label>
                <select
                  name="paymentToken"
                  value={formData.paymentToken}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
                >
                  {supportedTokens.map((token) => (
                    <option key={token.address} value={token.address}>
                      {token.symbol}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-400">
                  Select the token you want to accept as payment
                </p>
              </div>
            </div>
          </div>

          {/* Bridge Details Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">Bridge Details</h2>
              <div className="flex items-center space-x-2 text-purple-400">
                <FaExchangeAlt className="text-xl" />
                <span className="text-sm">Powered by Across Protocol</span>
              </div>
            </div>

            <div className="bg-zinc-800/30 rounded-xl p-6 border border-zinc-700/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Source to Destination Chain */}
                <div className="col-span-full">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-400 mb-1">From</div>
                      <div className="bg-zinc-800 px-4 py-2 rounded-lg border border-zinc-700">
                        {chain?.name || 'Current Chain'}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <FaExchangeAlt className="text-purple-400 text-xl" />
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-gray-400 mb-1">To</div>
                      <div className="bg-zinc-800 px-4 py-2 rounded-lg border border-zinc-700">
                        {supportedChains.find((c) => c.id === formData.destinationChainId)?.name ||
                          'Select Chain'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bridge Statistics */}
                <div className="col-span-full">
                  <div className="grid grid-cols-3 gap-4">
                    {/* Estimated Fee */}
                    <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Estimated Fee</span>
                        <BiTransfer className="text-purple-400" />
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {bridgeDetails.isLoading ? (
                          <div className="animate-pulse bg-zinc-700 h-6 w-24 rounded" />
                        ) : (
                          `${bridgeDetails.estimatedFee} ETH`
                        )}
                      </div>
                    </div>

                    {/* Estimated Time */}
                    <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Estimated Time</span>
                        <FaClock className="text-purple-400" />
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {bridgeDetails.isLoading ? (
                          <div className="animate-pulse bg-zinc-700 h-6 w-24 rounded" />
                        ) : (
                          `~${bridgeDetails.estimatedTime} mins`
                        )}
                      </div>
                    </div>

                    {/* Gas Price */}
                    <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Gas Price</span>
                        <FaGasPump className="text-purple-400" />
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {bridgeDetails.isLoading ? (
                          <div className="animate-pulse bg-zinc-700 h-6 w-24 rounded" />
                        ) : (
                          `${bridgeDetails.gasPrice} Gwei`
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Information Box */}
                <div className="col-span-full">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <svg
                          className="w-5 h-5 text-purple-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-purple-300">
                          Your car will be listed on the destination chain using Across Protocol's
                          secure bridge. The process is fully automated and guarantees your NFT's
                          safe transfer across chains.
                        </p>
                        <a
                          href="https://docs.across.to/bridge/how-across-works"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-sm text-purple-400 hover:text-purple-300 transition-colors duration-200"
                        >
                          Learn more about Across Protocol →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">Additional Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
                placeholder="e.g., New York, USA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Features (Press Enter to add)
              </label>
              <input
                type="text"
                onKeyDown={handleFeatureInput}
                className="w-full px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
                placeholder="Add car features..."
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.features.map((feature, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          features: prev.features.filter((_, i) => i !== index),
                        }))
                      }
                      className="ml-2 text-purple-400 hover:text-purple-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Seller Details */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">Seller Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  name="sellerName"
                  value={formData.sellerName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`
                flex items-center px-8 py-3 rounded-lg text-white font-medium
                ${
                  loading
                    ? 'bg-purple-500/50 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                }
                transition-all duration-300
              `}
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⌛</span>
                  Listing Car...
                </>
              ) : (
                <>
                  <FaCar className="mr-2" />
                  List Car
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  )
}

export default ListCarPage
