import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAccount, useNetwork } from 'wagmi'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'
import {
  FaTimes,
  FaExchangeAlt,
  FaChevronRight,
  FaEthereum,
  FaArrowUp,
  FaCube,
  FaBolt,
  FaDollarSign,
} from 'react-icons/fa'
import { CarCondition, CarParams, CarTransmission, FuelType } from '@/utils/type.dt'
import { listCar, isSupportedToken } from '@/services/blockchain'
import { ethers } from 'ethers'
import Image from 'next/image'
import { parseEther } from 'ethers'

const SUPPORTED_CHAINS = [
  {
    id: 11155111,
    name: 'Sepolia',
    icon: FaEthereum,
    currency: 'ETH',
    iconColor: '#62688F',
    isTestnet: true,
  },
  {
    id: 421614,
    name: 'Arbitrum Sepolia',
    icon: FaEthereum,
    currency: 'ETH',
    iconColor: '#28A0F0',
    isTestnet: true,
  },
  {
    id: 84532,
    name: 'Base Sepolia',
    icon: FaCube,
    currency: 'ETH',
    iconColor: '#0052FF',
    isTestnet: true,
  },
  {
    id: 168587773,
    name: 'Blast Sepolia',
    icon: FaBolt,
    currency: 'ETH',
    iconColor: '#FFAA3C',
    isTestnet: true,
  },
  {
    id: 11155420,
    name: 'Optimism Sepolia',
    icon: FaArrowUp,
    currency: 'ETH',
    iconColor: '#FF0420',
    isTestnet: true,
  },
  {
    id: 80002,
    name: 'Polygon Amoy',
    icon: FaEthereum,
    currency: 'MATIC',
    iconColor: '#8247E5',
    isTestnet: true,
  },
]

type ChainPriceData = {
  [chainId: number]: {
    price: number
    usdValue: number
    symbol: string
  }
}

type PriceConversion = {
  usd: number
  chainPrices: ChainPriceData
  loading: boolean
}

const SUPPORTED_TOKENS = {
  NATIVE: {
    address: ethers.ZeroAddress,
    symbol: 'ETH',
    name: 'Native Token',
    decimals: 18,
  },
  // Remove other tokens for now until they are supported in the contract
}

const ListCar = () => {
  const { address } = useAccount()
  const { chain } = useNetwork()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentFeature, setCurrentFeature] = useState('')
  const [currentImage, setCurrentImage] = useState('')
  const [priceConversion, setPriceConversion] = useState<PriceConversion>({
    usd: 0,
    chainPrices: {},
    loading: false,
  })

  const [formData, setFormData] = useState({
    // CarBasicDetails struct
    basicDetails: {
      name: '',
      images: [] as string[],
      description: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      vin: '',
    },
    // CarTechnicalDetails struct
    technicalDetails: {
      mileage: '',
      color: '',
      condition: CarCondition.Used,
      transmission: CarTransmission.Automatic,
      fuelType: FuelType.Gasoline,
      price: '',
    },
    // CarAdditionalInfo struct
    additionalInfo: {
      location: '',
      carHistory: '',
      features: [] as string[],
    },
    // SellerDetails struct
    sellerDetails: {
      wallet: '',
      sellerName: '',
      email: '',
      phoneNumber: '',
      profileImage: '',
    },
    // Chain-specific details
    destinationChainId: 0,
    paymentToken: ethers.ZeroAddress,
  })

  useEffect(() => {
    const convertPrice = async () => {
      if (!formData.technicalDetails.price) {
        setPriceConversion({ usd: 0, chainPrices: {}, loading: false })
        return
      }

      try {
        setPriceConversion((prev) => ({ ...prev, loading: true }))

        // Only fetch price for current chain's currency
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
        )
        const data = await response.json()
        const ethPrice = data.ethereum.usd
        const usdValue = Number(formData.technicalDetails.price) * ethPrice

        setPriceConversion({
          usd: usdValue,
          chainPrices: {
            [chain?.id || 0]: {
              price: Number(formData.technicalDetails.price),
              usdValue: usdValue,
              symbol: chain?.nativeCurrency?.symbol || 'ETH',
            },
          },
          loading: false,
        })
      } catch (error) {
        console.error('Failed to fetch price conversion:', error)
        setPriceConversion((prev) => ({ ...prev, loading: false }))
      }
    }

    const debounceTimer = setTimeout(convertPrice, 500)
    return () => clearTimeout(debounceTimer)
  }, [formData.technicalDetails.price, chain?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address || !chain) {
      console.error('Wallet not connected')
      return
    }

    try {
      setLoading(true)
      console.log('Form Data:', formData)

      // Convert price to Wei and keep it as BigInt
      const priceInWei = parseEther(formData.technicalDetails.price.toString())
      console.log('Price in Wei:', priceInWei.toString())

      const carParams: CarParams = {
        basicDetails: {
          name: formData.basicDetails.name,
          images: formData.basicDetails.images,
          description: formData.basicDetails.description,
          make: formData.basicDetails.make,
          model: formData.basicDetails.model,
          year: Number(formData.basicDetails.year),
          vin: Number(formData.basicDetails.vin),
        },
        technicalDetails: {
          mileage: Number(formData.technicalDetails.mileage),
          color: formData.technicalDetails.color,
          condition: formData.technicalDetails.condition,
          transmission: formData.technicalDetails.transmission,
          fuelType: formData.technicalDetails.fuelType,
          price: priceInWei, // Keep as BigInt
        },
        additionalInfo: {
          location: formData.additionalInfo.location,
          carHistory: '',
          features: formData.additionalInfo.features,
        },
        sellerDetails: {
          wallet: address,
          sellerName: formData.sellerDetails.sellerName,
          email: formData.sellerDetails.email,
          phoneNumber: Number(formData.sellerDetails.phoneNumber),
          profileImage: formData.sellerDetails.profileImage,
        },
        destinationChainId: chain.id,
        paymentToken: ethers.ZeroAddress, // Always use ZeroAddress for native token
      }

      console.log('Submitting car params:', {
        ...carParams,
        technicalDetails: {
          ...carParams.technicalDetails,
          price: carParams.technicalDetails.price.toString(),
        },
      })

      const result = await listCar(carParams)
      console.log('Listing Result:', result)
      router.push('/marketplace')
    } catch (error: any) {
      console.error('Full Error Object:', error)
      setLoading(false)
    }
  }

  const addImage = () => {
    if (currentImage.trim() && isValidUrl(currentImage)) {
      setFormData((prev) => ({
        ...prev,
        basicDetails: {
          ...prev.basicDetails,
          images: [...prev.basicDetails.images, currentImage.trim()],
        },
      }))
      setCurrentImage('')
    } else {
      toast.error('Please enter a valid image URL')
    }
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      basicDetails: {
        ...prev.basicDetails,
        images: prev.basicDetails.images.filter((_, i) => i !== index),
      },
    }))
  }

  const addFeature = () => {
    if (currentFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        additionalInfo: {
          ...prev.additionalInfo,
          features: [...prev.additionalInfo.features, currentFeature.trim()],
        },
      }))
      setCurrentFeature('')
    }
  }

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      additionalInfo: {
        ...prev.additionalInfo,
        features: prev.additionalInfo.features.filter((_, i) => i !== index),
      },
    }))
  }

  type FormDataSection =
    | 'basicDetails'
    | 'technicalDetails'
    | 'additionalInfo'
    | 'sellerDetails'
    | 'paymentToken'
    | 'destinationChainId'

  const updateFormData = (section: FormDataSection, field: string, value: any) => {
    setFormData((prev) => {
      if (section === 'paymentToken' || section === 'destinationChainId') {
        return {
          ...prev,
          [section]: value,
        }
      }
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }
    })
  }

  return (
    <div className="min-h-screen bg-black py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-white mb-8">List Your Car</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Details Section */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 space-y-6">
              <h2 className="text-2xl font-semibold text-white">Basic Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  placeholder="Car Name"
                  value={formData.basicDetails.name}
                  onChange={(e) => updateFormData('basicDetails', 'name', e.target.value)}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />

                <input
                  type="text"
                  placeholder="Make"
                  value={formData.basicDetails.make}
                  onChange={(e) => updateFormData('basicDetails', 'make', e.target.value)}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />

                <input
                  type="text"
                  placeholder="Model"
                  value={formData.basicDetails.model}
                  onChange={(e) => updateFormData('basicDetails', 'model', e.target.value)}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />

                <input
                  type="number"
                  placeholder="Year"
                  value={formData.basicDetails.year}
                  onChange={(e) => updateFormData('basicDetails', 'year', Number(e.target.value))}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />

                <input
                  type="number"
                  placeholder="VIN Number"
                  value={formData.basicDetails.vin}
                  onChange={(e) => updateFormData('basicDetails', 'vin', e.target.value)}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />

                <textarea
                  placeholder="Description"
                  value={formData.basicDetails.description}
                  onChange={(e) => updateFormData('basicDetails', 'description', e.target.value)}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white md:col-span-2"
                  rows={4}
                  required
                />
              </div>

              {/* Image URLs Section */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Car Images</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Enter image URL"
                    value={currentImage}
                    onChange={(e) => setCurrentImage(e.target.value)}
                    className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Add
                  </button>
                </div>

                {/* Image Preview */}
                {formData.basicDetails.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {formData.basicDetails.images.map((image, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={image}
                          alt={`Car image ${index + 1}`}
                          width={200}
                          height={150}
                          className="rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 rounded-full p-1"
                        >
                          <FaTimes className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chain Details Section */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-semibold text-white">Listing Chain</h2>
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-500 rounded-full">
                    Testnet
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <FaExchangeAlt className="text-purple-500" />
                  <span className="text-gray-400">
                    Connected to: {chain?.name || 'Not Connected'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Current Chain Display */}
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center gap-3">
                    {chain?.name && (
                      <div className="w-8 h-8 flex items-center justify-center">
                        {(() => {
                          const chainInfo = SUPPORTED_CHAINS.find((c) => c.id === chain.id)
                          if (chainInfo) {
                            const IconComponent = chainInfo.icon
                            return (
                              <IconComponent
                                className="w-6 h-6"
                                style={{ color: chainInfo.iconColor }}
                              />
                            )
                          }
                          return <FaEthereum className="w-6 h-6 text-gray-400" />
                        })()}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-white font-medium">
                        {chain?.name || 'Please Connect Wallet'}
                      </h3>
                      <p className="text-sm text-gray-400">Your car will be listed on this chain</p>
                    </div>
                  </div>
                </div>

                {/* Payment Token Selection */}
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Payment Token
                  </label>
                  <select
                    value={formData.paymentToken}
                    onChange={(e) => {
                      console.log('Selected Token:', e.target.value)
                      updateFormData('paymentToken', '', e.target.value)
                    }}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  >
                    <option value={ethers.ZeroAddress}>Native Token (ETH)</option>
                  </select>
                  <p className="mt-2 text-xs text-gray-400">
                    Currently only native token (ETH) is supported
                  </p>
                </div>

                {/* Cross-Chain Information */}
                <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <FaExchangeAlt className="text-purple-500" />
                    <h3 className="text-purple-400 font-medium">
                      Cross-Chain Purchase Information
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm">
                      Your car will be listed on {chain?.name || 'your current chain'}. Buyers can
                      purchase from any of these supported chains:
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {SUPPORTED_CHAINS.map((supportedChain) => (
                        <div
                          key={supportedChain.id}
                          className="flex items-center gap-2 bg-zinc-800/30 rounded-lg p-2"
                        >
                          <supportedChain.icon
                            className="w-4 h-4"
                            style={{ color: supportedChain.iconColor }}
                          />
                          <span className="text-sm text-gray-400">{supportedChain.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Details Section */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 space-y-6">
              <h2 className="text-2xl font-semibold text-white">Technical Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="number"
                  placeholder="Mileage"
                  value={formData.technicalDetails.mileage}
                  onChange={(e) => updateFormData('technicalDetails', 'mileage', e.target.value)}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />

                <input
                  type="text"
                  placeholder="Color"
                  value={formData.technicalDetails.color}
                  onChange={(e) => updateFormData('technicalDetails', 'color', e.target.value)}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />

                <select
                  value={formData.technicalDetails.condition}
                  onChange={(e) =>
                    updateFormData('technicalDetails', 'condition', Number(e.target.value))
                  }
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value={CarCondition.New}>New</option>
                  <option value={CarCondition.Used}>Used</option>
                  <option value={CarCondition.CertifiedPreOwned}>Certified Pre-Owned</option>
                </select>

                <select
                  value={formData.technicalDetails.transmission}
                  onChange={(e) =>
                    updateFormData('technicalDetails', 'transmission', Number(e.target.value))
                  }
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value={CarTransmission.Manual}>Manual</option>
                  <option value={CarTransmission.Automatic}>Automatic</option>
                </select>

                <select
                  value={formData.technicalDetails.fuelType}
                  onChange={(e) =>
                    updateFormData('technicalDetails', 'fuelType', Number(e.target.value))
                  }
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value={FuelType.Gasoline}>Gasoline</option>
                  <option value={FuelType.Diesel}>Diesel</option>
                  <option value={FuelType.Electric}>Electric</option>
                  <option value={FuelType.Hybrid}>Hybrid</option>
                </select>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Price</label>
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Price in ETH"
                        value={formData.technicalDetails.price}
                        onChange={(e) => {
                          const value = e.target.value
                          // Ensure the value is non-negative and has at most 18 decimal places
                          if (/^\d*\.?\d{0,18}$/.test(value) || value === '') {
                            updateFormData('technicalDetails', 'price', value)
                          }
                        }}
                        min="0"
                        step="0.000000000000000001" // 18 decimals for ETH
                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white pr-24"
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400">
                        <FaEthereum className="w-4 h-4" />
                        <span>
                          {
                            SUPPORTED_CHAINS.find((c) => c.id === formData.destinationChainId)
                              ?.currency
                          }
                        </span>
                      </div>
                    </div>

                    {/* Price Conversion Display */}
                    <div className="bg-zinc-800/30 rounded-lg p-4 space-y-4">
                      <div className="space-y-2">
                        {/* USD Conversion */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">USD Equivalent</span>
                          <div className="flex items-center gap-2">
                            {priceConversion.loading ? (
                              <div className="animate-pulse flex items-center gap-1">
                                <div className="h-4 w-16 bg-gray-700 rounded"></div>
                              </div>
                            ) : (
                              <>
                                <FaDollarSign className="w-3 h-3 text-green-500" />
                                <span className="text-white font-medium">
                                  {priceConversion.usd.toLocaleString('en-US', {
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Current Chain Price */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">
                            Price in {chain?.name || 'Current Chain'}
                          </span>
                          <div className="flex items-center gap-2">
                            <FaEthereum className="w-3 h-3 text-purple-500" />
                            <span className="text-white font-medium">
                              {formData.technicalDetails.price || '0.000'}{' '}
                              {chain?.nativeCurrency?.symbol || 'ETH'}
                            </span>
                          </div>
                        </div>

                        {/* Gas Fee Estimate */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Estimated Gas Fee</span>
                          <div className="flex items-center gap-1">
                            <FaEthereum className="w-3 h-3 text-purple-500" />
                            <span className="text-white">~0.002</span>
                          </div>
                        </div>

                        {/* Total */}
                        <div className="pt-2 border-t border-zinc-700">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Total Cost</span>
                            <div className="flex items-center gap-2">
                              <FaEthereum className="w-4 h-4 text-purple-500" />
                              <span className="text-white font-medium">
                                {formData.technicalDetails.price
                                  ? (Number(formData.technicalDetails.price) + 0.002).toFixed(6)
                                  : '0.000'}{' '}
                                {chain?.nativeCurrency?.symbol || 'ETH'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Listing Info */}
                        <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <FaExchangeAlt className="text-purple-500" />
                            <span>
                              Your car will be listed on {chain?.name || 'current chain'}. Buyers
                              can purchase using their preferred chain and token.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info Section */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 space-y-6">
              <h2 className="text-2xl font-semibold text-white">Additional Information</h2>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Location"
                  value={formData.additionalInfo.location}
                  onChange={(e) => updateFormData('additionalInfo', 'location', e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-400">Features</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a feature"
                      value={currentFeature}
                      onChange={(e) => setCurrentFeature(e.target.value)}
                      className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                    />
                    <button
                      type="button"
                      onClick={addFeature}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Add
                    </button>
                  </div>

                  {formData.additionalInfo.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.additionalInfo.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1 rounded-full"
                        >
                          <span className="text-white">{feature}</span>
                          <button
                            type="button"
                            onClick={() => removeFeature(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Seller Details Section */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 space-y-6">
              <h2 className="text-2xl font-semibold text-white">Seller Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.sellerDetails.sellerName}
                  onChange={(e) => updateFormData('sellerDetails', 'sellerName', e.target.value)}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={formData.sellerDetails.email}
                  onChange={(e) => updateFormData('sellerDetails', 'email', e.target.value)}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />

                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.sellerDetails.phoneNumber}
                  onChange={(e) => updateFormData('sellerDetails', 'phoneNumber', e.target.value)}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:opacity-50"
            >
              {loading ? 'Listing Car...' : 'List Car'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default ListCar
