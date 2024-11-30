import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAccount } from 'wagmi'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'
import { FaUpload, FaCar, FaTimes } from 'react-icons/fa'
import { CarCondition, CarTransmission, FuelType } from '@/utils/type.dt'
import { listCar } from '@/services/blockchain'
import { ethers } from 'ethers'
import Image from 'next/image'

const ListCar = () => {
  const { address } = useAccount()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentFeature, setCurrentFeature] = useState('')
  const [currentImage, setCurrentImage] = useState('')

  const [formData, setFormData] = useState({
    // Basic Details
    name: '',
    description: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    images: [] as string[],

    // Technical Details
    mileage: '',
    color: '',
    condition: CarCondition.Used,
    transmission: CarTransmission.Automatic,
    fuelType: FuelType.Gasoline,
    price: '',

    // Additional Info
    location: '',
    features: [] as string[],
    
    // Seller Details
    sellerName: '',
    email: '',
    phoneNumber: '',
    profileImage: '',

    // Chain Details
    destinationChainId: 1,
    paymentToken: ethers.ZeroAddress,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!address) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      setLoading(true)

      const carParams = {
        basicDetails: {
          name: formData.name,
          images: formData.images,
          description: formData.description,
          make: formData.make,
          model: formData.model,
          year: Number(formData.year),
          vin: Number(formData.vin),
        },
        technicalDetails: {
          mileage: Number(formData.mileage),
          color: formData.color,
          condition: formData.condition,
          transmission: formData.transmission,
          fuelType: formData.fuelType,
          price: Number(formData.price),
        },
        additionalInfo: {
          location: formData.location,
          carHistory: '',
          features: formData.features,
        },
        sellerDetails: {
          wallet: address,
          sellerName: formData.sellerName,
          email: formData.email,
          phoneNumber: Number(formData.phoneNumber),
          profileImage: formData.profileImage,
        },
        destinationChainId: formData.destinationChainId,
        paymentToken: formData.paymentToken,
      }

      await listCar(carParams)
      toast.success('Car listed successfully!')
      router.push('/marketplace')
    } catch (error: any) {
      toast.error(error.message || 'Failed to list car')
    } finally {
      setLoading(false)
    }
  }

  const addImage = () => {
    if (currentImage.trim() && isValidUrl(currentImage)) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, currentImage.trim()]
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
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const addFeature = () => {
    if (currentFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, currentFeature.trim()]
      }))
      setCurrentFeature('')
    }
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
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
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />
                
                <input
                  type="text"
                  placeholder="Make"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />

                <input
                  type="text"
                  placeholder="Model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />

                <input
                  type="number"
                  placeholder="Year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />

                <input
                  type="number"
                  placeholder="VIN Number"
                  value={formData.vin}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />

                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white md:col-span-2"
                  rows={4}
                  required
                />
              </div>

              {/* Image URLs Section */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Car Images
                </label>
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
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {formData.images.map((image, index) => (
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

            {/* Technical Details Section */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 space-y-6">
              <h2 className="text-2xl font-semibold text-white">Technical Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="number"
                  placeholder="Mileage"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />

                <input
                  type="text"
                  placeholder="Color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />

                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: Number(e.target.value) })}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value={CarCondition.New}>New</option>
                  <option value={CarCondition.Used}>Used</option>
                  <option value={CarCondition.CertifiedPreOwned}>Certified Pre-Owned</option>
                </select>

                <select
                  value={formData.transmission}
                  onChange={(e) => setFormData({ ...formData, transmission: Number(e.target.value) })}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value={CarTransmission.Manual}>Manual</option>
                  <option value={CarTransmission.Automatic}>Automatic</option>
                </select>

                <select
                  value={formData.fuelType}
                  onChange={(e) => setFormData({ ...formData, fuelType: Number(e.target.value) })}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value={FuelType.Gasoline}>Gasoline</option>
                  <option value={FuelType.Diesel}>Diesel</option>
                  <option value={FuelType.Electric}>Electric</option>
                  <option value={FuelType.Hybrid}>Hybrid</option>
                </select>

                <input
                  type="number"
                  placeholder="Price (ETH)"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
            </div>

            {/* Additional Info Section */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 space-y-6">
              <h2 className="text-2xl font-semibold text-white">Additional Information</h2>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-400">
                    Features
                  </label>
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
                  
                  {formData.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.features.map((feature, index) => (
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
                  value={formData.sellerName}
                  onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                  required
                />

                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
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
