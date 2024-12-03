import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import { FaPlus, FaTimes, FaUser, FaCamera } from 'react-icons/fa'
import Image from 'next/image'
import { CarCondition, CarTransmission, FuelType, CarParams } from '@/utils/type.dt'
import { listCar } from '@/services/blockchain'
import { ethers, parseEther } from 'ethers'

const avatars = ['/images/avatar/Ape_Avatar.jpg', '/images/avatar/Takashi.png']
const getRandomAvatar = () => avatars[Math.floor(Math.random() * avatars.length)]

const ListCarPage = () => {
  const router = useRouter()
  const { address } = useAccount()
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [featureInput, setFeatureInput] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<CarParams>({
    basicDetails: {
      name: '',
      images: [],
      description: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      vin: '',
    },
    technicalDetails: {
      mileage: 0,
      color: '',
      condition: CarCondition.New,
      transmission: CarTransmission.Automatic,
      fuelType: FuelType.Gasoline,
      price: '',
    },
    additionalInfo: {
      location: '',
      carHistory: '',
      features: [],
    },
    sellerDetails: {
      wallet: address || '',
      sellerName: '',
      email: '',
      phoneNumber: 0,
      profileImage: getRandomAvatar(),
    },
    destinationChainId: 11155111,
    paymentToken: '0x0000000000000000000000000000000000000000',
  })

  const handleAddImage = () => {
    if (imageUrl && !formData.basicDetails.images.includes(imageUrl)) {
      setFormData((prev) => ({
        ...prev,
        basicDetails: {
          ...prev.basicDetails,
          images: [...prev.basicDetails.images, imageUrl],
        },
      }))
      setImageUrl('')
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      basicDetails: {
        ...prev.basicDetails,
        images: prev.basicDetails.images.filter((_, i) => i !== index),
      },
    }))
  }

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        additionalInfo: {
          ...prev.additionalInfo,
          features: [...prev.additionalInfo.features, featureInput.trim()]
        }
      }))
      setFeatureInput('')
    }
  }

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalInfo: {
        ...prev.additionalInfo,
        features: prev.additionalInfo.features.filter((_, i) => i !== index)
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask')
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum)
      const network = await provider.getNetwork()

      // Debug log
      console.log('Form data before conversion:', formData)

      const formDataWithWei = {
        ...formData,
        technicalDetails: {
          ...formData.technicalDetails,
          price: parseEther(formData.technicalDetails.price.toString()),
          mileage: Number(formData.technicalDetails.mileage),
          condition: Number(formData.technicalDetails.condition),
          transmission: Number(formData.technicalDetails.transmission),
          fuelType: Number(formData.technicalDetails.fuelType),
        },
        additionalInfo: {
          ...formData.additionalInfo,
          carHistory: '',
          location: formData.additionalInfo.location || '',
          features: formData.additionalInfo.features || [],
        },
        basicDetails: {
          ...formData.basicDetails,
          year: Number(formData.basicDetails.year),
          vin: formData.basicDetails.vin.toString(),
        },
        destinationChainId: Number(network.chainId)
      }

      // Debug log
      console.log('Form data after conversion:', formDataWithWei)

      try {
        const result = await listCar(formDataWithWei as CarParams)
        console.log('Transaction result:', result)
        router.push('/cars')
      } catch (txError: any) {
        console.error('Transaction error details:', {
          error: txError,
          message: txError.message,
          code: txError.code,
          data: txError.data,
          transaction: txError.transaction
        })
        throw new Error(`Transaction failed: ${txError.message}`)
      }
    } catch (error: any) {
      console.error('Error listing car:', error)
      setError(error.message || 'Failed to list car')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-20 bg-black min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">List Your Car</h1>
        
    

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Details */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800/50 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Basic Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.basicDetails.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    basicDetails: { ...prev.basicDetails, name: e.target.value }
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter vehicle name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Make</label>
                <input
                  type="text"
                  value={formData.basicDetails.make}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    basicDetails: { ...prev.basicDetails, make: e.target.value }
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter make"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Model</label>
                <input
                  type="text"
                  value={formData.basicDetails.model}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    basicDetails: { ...prev.basicDetails, model: e.target.value }
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter model"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Year</label>
                <input
                  type="number"
                  value={formData.basicDetails.year}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    basicDetails: { ...prev.basicDetails, year: Number(e.target.value) }
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter year"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">VIN</label>
                <input
                  type="text"
                  value={formData.basicDetails.vin}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    basicDetails: { ...prev.basicDetails, vin: e.target.value }
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter VIN"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                <textarea
                  value={formData.basicDetails.description}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    basicDetails: { ...prev.basicDetails, description: e.target.value }
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white h-32"
                  placeholder="Enter vehicle description"
                  required
                />
              </div>

              {/* Images Section */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">Images</label>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                    placeholder="Enter image URL"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="bg-purple-600 p-2 rounded-lg hover:bg-purple-700"
                  >
                    <FaPlus className="text-white" />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.basicDetails.images.map((url, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={url}
                        alt={`Car image ${index + 1}`}
                        width={200}
                        height={150}
                        className="rounded-lg object-cover w-full h-32"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FaTimes className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Technical Details */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Technical Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Price (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.technicalDetails.price.toString()}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    technicalDetails: { ...prev.technicalDetails, price: e.target.value }
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter price in ETH"
                  min="0.001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Mileage</label>
                <input
                  type="number"
                  value={formData.technicalDetails.mileage}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    technicalDetails: { ...prev.technicalDetails, mileage: Number(e.target.value) }
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter mileage"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Color</label>
                <input
                  type="text"
                  value={formData.technicalDetails.color}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    technicalDetails: { ...prev.technicalDetails, color: e.target.value }
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter color"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Condition</label>
                <select
                  value={formData.technicalDetails.condition}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    technicalDetails: { ...prev.technicalDetails, condition: Number(e.target.value) }
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  required
                >
                  <option value={CarCondition.New}>New</option>
                  <option value={CarCondition.Used}>Used</option>
                  <option value={CarCondition.CertifiedPreOwned}>Certified Pre-Owned</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Transmission</label>
                <select
                  value={formData.technicalDetails.transmission}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    technicalDetails: { ...prev.technicalDetails, transmission: Number(e.target.value) }
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  required
                >
                  <option value={CarTransmission.Automatic}>Automatic</option>
                  <option value={CarTransmission.Manual}>Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Fuel Type</label>
                <select
                  value={formData.technicalDetails.fuelType}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    technicalDetails: { ...prev.technicalDetails, fuelType: Number(e.target.value) }
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  required
                >
                  <option value={FuelType.Gasoline}>Gasoline</option>
                  <option value={FuelType.Diesel}>Diesel</option>
                  <option value={FuelType.Electric}>Electric</option>
                  <option value={FuelType.Hybrid}>Hybrid</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Additional Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.additionalInfo.location}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    additionalInfo: { ...prev.additionalInfo, location: e.target.value }
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter location"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Features</label>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    className="flex-1 bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                    placeholder="Enter feature"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="bg-purple-600 p-2 rounded-lg hover:bg-purple-700"
                  >
                    <FaPlus className="text-white" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.additionalInfo.features.map((feature, index) => (
                    <div
                      key={index}
                      className="bg-gray-700/50 rounded-full px-3 py-1 text-sm text-white flex items-center space-x-2"
                    >
                      <span>{feature}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Seller Details */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800/50 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Seller Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.sellerDetails.sellerName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    sellerDetails: { ...prev.sellerDetails, sellerName: e.target.value }
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.sellerDetails.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    sellerDetails: { ...prev.sellerDetails, email: e.target.value }
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.sellerDetails.phoneNumber}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    sellerDetails: { ...prev.sellerDetails, phoneNumber: Number(e.target.value) }
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Wallet Address</label>
                <input
                  type="text"
                  value={formData.sellerDetails.wallet}
                  disabled
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white opacity-50"
                />
              </div>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-end"
          >
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 px-8 py-3 rounded-lg text-white font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                  <span>Listing...</span>
                </div>
              ) : (
                'List Vehicle'
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  )
}

export default ListCarPage
