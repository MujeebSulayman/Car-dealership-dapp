import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { getCar, updateCar, deleteCar } from '@/services/blockchain'
import { CarParams, CarCondition, CarTransmission, FuelType } from '@/utils/type.dt'
import { toast } from 'react-toastify'
import { FaPlus, FaTimes } from 'react-icons/fa'
import Link from 'next/link'
import { ethers } from 'ethers'

const EditCarPage = () => {
  const router = useRouter()
  const { id } = router.query
  const { address } = useAccount()
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [featureInput, setFeatureInput] = useState('')
  const [formData, setFormData] = useState<CarParams>({
    basicDetails: {
      name: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      vin: '',
      images: [],
      description: '',
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
      sellerName: '',
      email: '',
      phoneNumber: 0,
      wallet: address || '',
      profileImage: '',
    },
    destinationChainId: 0,
    paymentToken: '',
  })

  useEffect(() => {
    const loadCar = async () => {
      if (!id) return
      try {
        const carData = await getCar(Number(id))
        if (carData.owner.toLowerCase() !== address?.toLowerCase()) {
          toast.error('You are not authorized to edit this car')
          router.push(`/cars/${id}`)
          return
        }
        setFormData({
          basicDetails: {
            name: carData.name,
            make: carData.make,
            model: carData.model,
            year: carData.year,
            vin: carData.vin,
            images: carData.images,
            description: carData.description,
          },
          technicalDetails: {
            mileage: carData.mileage,
            color: carData.color,
            condition: carData.condition,
            transmission: carData.transmission,
            fuelType: carData.fuelType,
            price: ethers.formatEther(carData.price),
          },
          additionalInfo: {
            location: carData.location,
            features: carData.features,
          },
          sellerDetails: {
            sellerName: carData.seller.sellerName,
            email: carData.seller.email,
            phoneNumber: carData.seller.phoneNumber,
            wallet: carData.seller.wallet,
            profileImage: carData.seller.profileImage,
          },
          destinationChainId: 0,
          paymentToken: '',
        })
      } catch (error) {
        console.error('Error loading car:', error)
        toast.error('Error loading car details')
      } finally {
        setLoading(false)
      }
    }

    loadCar()
  }, [id, address, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !address) return

    setLoading(true)
    try {
      const formDataToSubmit = {
        ...formData,
        technicalDetails: {
          ...formData.technicalDetails,
          price: ethers.parseEther(formData.technicalDetails.price.toString()).toString(),
        },
      }
      await updateCar(Number(id), formDataToSubmit)
      toast.success('Car updated successfully!')
      router.push(`/cars/${id}`)
    } catch (error: any) {
      console.error('Error updating car:', error)
      toast.error(error.message || 'Error updating car')
    } finally {
      setLoading(false)
    }
  }

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
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
    setFormData(prev => ({
      ...prev,
      additionalInfo: {
        ...prev.additionalInfo,
        features: prev.additionalInfo.features.filter((_, i) => i !== index),
      },
    }))
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this car?')) return

    setIsDeleting(true)
    try {
      await deleteCar(id)
      toast.success('Car deleted successfully')
      router.push('/')
    } catch (error) {
      console.error('Error deleting car:', error)
      toast.error('Failed to delete car')
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black pt-20">Loading...</div>
  }

  return (
    <div className="py-20 bg-black min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Car Listing</h1>
            <p className="text-gray-400 mt-2">Update your car's details</p>
          </div>
          <Link
            href={`/cars/${id}`}
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            Back to Car
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Basic Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.basicDetails.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    basicDetails: { ...prev.basicDetails, name: e.target.value },
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter car name"
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
                    basicDetails: { ...prev.basicDetails, make: e.target.value },
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter car make"
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
                    basicDetails: { ...prev.basicDetails, model: e.target.value },
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter car model"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Year</label>
                <input
                  type="number"
                  value={formData.basicDetails.year.toString()}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    basicDetails: { ...prev.basicDetails, year: Number(e.target.value) },
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
                    basicDetails: { ...prev.basicDetails, vin: e.target.value },
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
                    basicDetails: { ...prev.basicDetails, description: e.target.value },
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white h-32"
                  placeholder="Enter vehicle description"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6">
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
                    technicalDetails: { 
                      ...prev.technicalDetails, 
                      price: e.target.value 
                    },
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter price in ETH"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Mileage</label>
                <input
                  type="number"
                  value={formData.technicalDetails.mileage.toString()}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    technicalDetails: { ...prev.technicalDetails, mileage: Number(e.target.value) },
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
                    technicalDetails: { ...prev.technicalDetails, color: e.target.value },
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
                    technicalDetails: { ...prev.technicalDetails, condition: Number(e.target.value) },
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
                    technicalDetails: { ...prev.technicalDetails, transmission: Number(e.target.value) },
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  required
                >
                  <option value={CarTransmission.Automatic}>Automatic</option>
                  <option value={CarTransmission.Manual}>Manual</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Additional Information</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.additionalInfo.location}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    additionalInfo: { ...prev.additionalInfo, location: e.target.value },
                  }))}
                  className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter location"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Features</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    className="w-full bg-gray-700/50 rounded-lg px-4 py-2 text-white"
                    placeholder="Add a feature"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <FaPlus />
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {formData.additionalInfo.features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-700/50 rounded-lg px-4 py-2 text-white">
                      <span>{feature}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Seller Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.sellerDetails.sellerName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    sellerDetails: { ...prev.sellerDetails, sellerName: e.target.value },
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
                    sellerDetails: { ...prev.sellerDetails, email: e.target.value },
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
                  value={formData.sellerDetails.phoneNumber.toString()}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    sellerDetails: { ...prev.sellerDetails, phoneNumber: Number(e.target.value) },
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
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || isDeleting}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete Car'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditCarPage
