import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import { FaPlus, FaTimes, FaUser, FaCamera } from 'react-icons/fa'
import Image from 'next/image'
import { CarCondition, CarTransmission, FuelType, CarParams } from '@/utils/type.dt'
import { listCar } from '@/services/blockchain'

const avatars = ['/images/avatar/Ape_Avatar.jpg', '/images/avatar/Takashi.png']
const getRandomAvatar = () => avatars[Math.floor(Math.random() * avatars.length)]

const ListCarPage = () => {
  const router = useRouter()
  const { address } = useAccount()
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [featureInput, setFeatureInput] = useState('')

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
    if (featureInput.trim() && !formData.additionalInfo.features.includes(featureInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        additionalInfo: {
          ...prev.additionalInfo,
          features: [...prev.additionalInfo.features, featureInput.trim()],
        },
      }))
      setFeatureInput('')
    }
  }

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      additionalInfo: {
        ...prev.additionalInfo,
        features: prev.additionalInfo.features.filter((_, i) => i !== index),
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await listCar(formData)
      router.push('/cars')
    } catch (error) {
      console.error('Error listing car:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white">List Your Vehicle</h1>
          <p className="mt-2 text-gray-400">Enter your car details to list it on the marketplace</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image Upload Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Vehicle Images</h2>
            <div className="flex items-center space-x-4 mb-4">
              <input
                type="url"
                placeholder="Enter image URL"
                className="flex-1 bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="bg-blue-600 p-2 rounded-lg text-white hover:bg-blue-700"
              >
                <FaPlus />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {formData.basicDetails.images.map((url, index) => (
                <div key={index} className="relative group">
                  <Image
                    src={url}
                    alt={`Vehicle ${index + 1}`}
                    width={300}
                    height={200}
                    className="rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-red-500 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FaTimes className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Basic Details Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Basic Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Vehicle Name</label>
                <input
                  type="text"
                  value={formData.basicDetails.name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      basicDetails: { ...prev.basicDetails, name: e.target.value },
                    }))
                  }
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter vehicle name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Make</label>
                <input
                  type="text"
                  value={formData.basicDetails.make}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      basicDetails: { ...prev.basicDetails, make: e.target.value },
                    }))
                  }
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter make"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Model</label>
                <input
                  type="text"
                  value={formData.basicDetails.model}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      basicDetails: { ...prev.basicDetails, model: e.target.value },
                    }))
                  }
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter model"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Year</label>
                <input
                  type="number"
                  value={formData.basicDetails.year}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      basicDetails: { ...prev.basicDetails, year: Number(e.target.value) },
                    }))
                  }
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter year"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">VIN</label>
                <input
                  type="text"
                  value={formData.basicDetails.vin}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      basicDetails: { ...prev.basicDetails, vin: e.target.value },
                    }))
                  }
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter VIN"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                <textarea
                  value={formData.basicDetails.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      basicDetails: { ...prev.basicDetails, description: e.target.value },
                    }))
                  }
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white h-32"
                  placeholder="Enter vehicle description"
                />
              </div>
            </div>
          </motion.div>

          {/* Technical Details Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800/50 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Technical Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Mileage</label>
                <input
                  type="number"
                  value={formData.technicalDetails.mileage}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      technicalDetails: {
                        ...prev.technicalDetails,
                        mileage: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter mileage"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Color</label>
                <input
                  type="text"
                  value={formData.technicalDetails.color}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      technicalDetails: { ...prev.technicalDetails, color: e.target.value },
                    }))
                  }
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter color"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Condition</label>
                <select
                  value={formData.technicalDetails.condition}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      technicalDetails: {
                        ...prev.technicalDetails,
                        condition: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
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
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      technicalDetails: {
                        ...prev.technicalDetails,
                        transmission: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                >
                  <option value={CarTransmission.Automatic}>Automatic</option>
                  <option value={CarTransmission.Manual}>Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Fuel Type</label>
                <select
                  value={formData.technicalDetails.fuelType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      technicalDetails: {
                        ...prev.technicalDetails,
                        fuelType: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                >
                  <option value={FuelType.Gasoline}>Gasoline</option>
                  <option value={FuelType.Diesel}>Diesel</option>
                  <option value={FuelType.Electric}>Electric</option>
                  <option value={FuelType.Hybrid}>Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Price</label>
                <input
                  type="text"
                  value={formData.technicalDetails.price}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      technicalDetails: { ...prev.technicalDetails, price: e.target.value },
                    }))
                  }
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter price"
                />
              </div>
            </div>
          </motion.div>

          {/* Additional Information Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800/50 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Additional Information</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.additionalInfo.location}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      additionalInfo: { ...prev.additionalInfo, location: e.target.value },
                    }))
                  }
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Features</label>
                <div className="flex items-center space-x-4 mb-4">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    className="flex-1 bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                    placeholder="Add a feature"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="bg-blue-600 p-2 rounded-lg text-white hover:bg-blue-700"
                  >
                    <FaPlus />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.additionalInfo.features.map((feature, index) => (
                    <div
                      key={index}
                      className="bg-gray-700/50 rounded-lg px-3 py-1 text-white flex items-center space-x-2"
                    >
                      <span>{feature}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <FaTimes size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Seller Details Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-800/50 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Seller Details</h2>

            <div className="flex flex-col md:flex-row gap-8 mb-6">
              {/* Avatar Display */}
              <div className="flex flex-col items-center space-y-2">
                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-700">
                  <Image
                    src={formData.sellerDetails.profileImage}
                    alt="Seller Avatar"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <span className="text-sm text-gray-400">Profile Picture</span>
              </div>

              {/* Seller Information */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Seller Name
                  </label>
                  <input
                    type="text"
                    value={formData.sellerDetails.sellerName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sellerDetails: { ...prev.sellerDetails, sellerName: e.target.value },
                      }))
                    }
                    className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.sellerDetails.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sellerDetails: { ...prev.sellerDetails, email: e.target.value },
                      }))
                    }
                    className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.sellerDetails.phoneNumber || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sellerDetails: {
                          ...prev.sellerDetails,
                          phoneNumber: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="flex items-center">
                  <div className="bg-gray-700/50 rounded-lg px-4 py-2 text-gray-400 w-full">
                    <div className="flex items-center space-x-2">
                      <FaUser className="text-gray-500" />
                      <span className="text-sm truncate">{address || 'Wallet not connected'}</span>
                    </div>
                  </div>
                </div>
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
              className="bg-blue-600 px-8 py-3 rounded-lg text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
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
