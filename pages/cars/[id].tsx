import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'

import {
  FaEthereum,
  FaCar,
  FaGasPump,
  FaTachometerAlt,
  FaPaintBrush,
  FaMapMarkerAlt,
  FaClock,
  FaCalendar,
  FaShieldAlt,
  FaHistory,
  FaExchangeAlt,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaWallet,
} from 'react-icons/fa'
import {
  deleteCar,
  getCar,
  getEthereumContract,
  initiateCrossChainTransfer,
} from '@/services/blockchain'
import { CarStruct, CarCondition, CarTransmission, FuelType } from '@/utils/type.dt'
import { useAccount, useConnect } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import Lightbox from 'react-image-lightbox'
import 'react-image-lightbox/style.css'
import { toast } from 'react-toastify'
import { ethers } from 'ethers'
import { CrossChainTransferModal } from '@/components/CrossChainTransferModal'

const formatPrice = (price: bigint | string | number): string => {
  try {
    if (typeof price === 'number') {
      return price.toString()
    }
    const cleanPrice = price.toString().replace(' ETH', '')
    return ethers.formatEther(cleanPrice)
  } catch (error) {
    console.error('Error formatting price:', error)
    return '0'
  }
}

const CarDetailsPage = () => {
  const router = useRouter()
  const { id } = router.query
  const [car, setCar] = useState<CarStruct | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const { address, isConnected } = useAccount()
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  })
  const [isOpen, setIsOpen] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)
  const [destinationChain, setDestinationChain] = useState<number>(0)
  const [showTransferModal, setShowTransferModal] = useState(false)

  useEffect(() => {
    const loadCar = async () => {
      if (!id) return
      try {
        const carData = await getCar(Number(id))
        setCar(carData)
      } catch (error) {
        console.error('Error loading car:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCar()
  }, [id])

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: car?.name,
          text: `Check out this car: ${car?.name}`,
          url: window.location.href,
        })
        .then(() => console.log('Successful share'))
        .catch((error) => console.error('Error sharing:', error))
    } else {
      alert('Web Share API is not supported in your browser.')
    }
  }

  const handleBuyCar = async () => {
    if (!car) return
    try {
      const contract = await getEthereumContract()
      const transaction = await contract.buyCar(
        car.id,
        0, // relayerFeePct
        Math.floor(Date.now() / 1000), // quoteTimestamp
        {
          value: car.price, // The price is already in wei from the contract
        }
      )
      await transaction.wait()
      toast.success('Car purchased successfully!')
      router.reload()
    } catch (error) {
      console.error('Error purchasing car:', error)
      toast.error('Failed to purchase car. Please try again.')
    }
  }

  const handleDeleteCar = async () => {
    if (!car) return
    if (!confirm('Are you sure you want to delete this listing?')) return

    try {
      const contract = await getEthereumContract()
      const transaction = await contract.deleteCar(car.id)
      await transaction.wait()
      toast.success('Car listing deleted successfully!')
      router.push('/cars')
    } catch (error) {
      console.error('Error deleting car:', error)
      toast.error('Failed to delete car listing. Please try again.')
    }
  }

  const handleCrossChainTransfer = async () => {
    if (!car) return
    setIsTransferring(true)
    try {
      await initiateCrossChainTransfer(car.id, destinationChain)
      toast.success('Cross-chain transfer initiated successfully!')
      router.reload()
    } catch (error) {
      console.error('Error initiating cross-chain transfer:', error)
      toast.error('Failed to initiate cross-chain transfer')
    } finally {
      setIsTransferring(false)
      setShowTransferModal(false)
    }
  }

  if (loading || !car) {
    return <LoadingState />
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-gray-900 to-black">
      {/* Top Navigation Bar */}
      <nav className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Listings
            </button>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleShare}
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                Share
              </button>
              <button className="text-purple-400 hover:text-purple-300 transition-colors">
                Save
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Car Title and Price Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
          <div className="w-full">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{car.name}</h1>
            <div className="flex flex-wrap items-center text-gray-400 gap-2 mb-4">
              <div className="flex items-center">
                <FaMapMarkerAlt className="mr-2" />
                <span>{car.location}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center">
                <FaClock className="mr-2" />
              </div>
            </div>
            <div className="flex items-center text-2xl sm:text-3xl font-bold text-white">
              <FaEthereum className="mr-2 text-purple-400" />
              <span>{formatPrice(car.price)} ETH</span>
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div
                className="relative aspect-[4/3] sm:aspect-[16/9] rounded-xl overflow-hidden cursor-pointer"
                onClick={() => setIsOpen(true)}
              >
                <Image
                  src={car.images[selectedImage]}
                  alt={car.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4">
                {car.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-[4/3] sm:aspect-[16/9] rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-purple-500 scale-105'
                        : 'border-transparent hover:border-purple-500/50'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${car.name} view ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Lightbox for image zoom and navigation */}
            {isOpen && (
              <Lightbox
                mainSrc={car.images[selectedImage]}
                nextSrc={car.images[(selectedImage + 1) % car.images.length]}
                prevSrc={car.images[(selectedImage + car.images.length - 1) % car.images.length]}
                onCloseRequest={() => setIsOpen(false)}
                onMovePrevRequest={() =>
                  setSelectedImage((selectedImage + car.images.length - 1) % car.images.length)
                }
                onMoveNextRequest={() => setSelectedImage((selectedImage + 1) % car.images.length)}
              />
            )}

            {/* Car Specifications */}
            <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                Specifications
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <SpecItem icon={FaCar} label="Make" value={car.make} />
                <SpecItem icon={FaCar} label="Model" value={car.model} />
                <SpecItem icon={FaCalendar} label="Year" value={car.year.toString()} />
                <SpecItem icon={FaTachometerAlt} label="Mileage" value={`${car.mileage} km`} />
                <SpecItem icon={FaGasPump} label="Fuel Type" value={FuelType[car.fuelType]} />
                <SpecItem icon={FaPaintBrush} label="Color" value={car.color} />
                <SpecItem
                  icon={FaCar}
                  label="Transmission"
                  value={CarTransmission[car.transmission]}
                />
                <SpecItem
                  icon={FaShieldAlt}
                  label="Condition"
                  value={CarCondition[car.condition]}
                />
              </div>
            </div>

            {/* Features */}
            <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Features</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {car.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-gray-300 space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-800/30 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-6">Description</h2>
              <p className="text-gray-300 leading-relaxed">{car.description}</p>
            </div>
          </div>

          {/* Right Column - Actions and Additional Info */}
          <div className="space-y-4 sm:space-y-6">
            {/* Seller Details */}
            <div className="bg-gray-800/30 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <FaUser className="mr-2 text-purple-400" />
                Seller Information
              </h3>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden relative">
                    <Image
                      src={car.seller.profileImage || '/images/default-avatar.png'}
                      alt={car.seller.sellerName}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-white">{car.seller.sellerName}</h4>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center text-gray-300">
                  <FaMapMarkerAlt className="mr-2 text-purple-400" />
                  <span>{car.location}</span>
                </div>
                {car.seller.email && (
                  <div className="flex items-center text-gray-300">
                    <FaEnvelope className="mr-2 text-purple-400" />
                    <span>{car.seller.email}</span>
                  </div>
                )}
                {car.seller.phoneNumber > 0 && (
                  <div className="flex items-center text-gray-300">
                    <FaPhone className="mr-2 text-purple-400" />
                    <span>
                      {String(car.seller.phoneNumber).replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}
                    </span>
                  </div>
                )}
                <div className="flex items-center text-gray-300">
                  <FaWallet className="mr-2 text-purple-400" />
                  <span className="text-sm break-all">{car.seller.wallet}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons - Make them sticky on mobile */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/95 backdrop-blur-sm lg:relative lg:bg-gray-800/30 lg:p-6 lg:rounded-xl z-50">
              <div className="max-w-7xl mx-auto flex flex-col gap-2">
                {isConnected ? (
                  <>
                    {address?.toLowerCase() === car.owner.toLowerCase() ? (
                      <>
                        <button
                          onClick={() => router.push(`/cars/edit/${id}`)}
                          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                        >
                          Edit Listing
                        </button>
                        <button
                          onClick={handleDeleteCar}
                          className="w-full border border-red-500 text-red-500 py-3 rounded-lg font-semibold hover:bg-red-500/10 transition-colors"
                        >
                          Delete Listing
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleBuyCar}
                          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                        >
                          Buy Now
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => connect()}
                    className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>

            {/* Add padding at the bottom to account for fixed buttons on mobile */}
            <div className="pb-24 lg:pb-0">
              {/* Cross-Chain Transfer - Only show for owner */}
              {isConnected && address?.toLowerCase() === car.owner.toLowerCase() && (
                <div className="bg-gray-800/30 rounded-xl p-6 backdrop-blur-sm">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <FaExchangeAlt className="mr-2 text-purple-400" />
                    Cross-Chain Transfer
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Transfer this car NFT to another blockchain network using Across Protocol
                  </p>
                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="w-full border border-purple-400 text-purple-400 py-3 rounded-lg font-semibold hover:bg-purple-400/10 transition-colors"
                  >
                    Bridge to Another Chain
                  </button>
                </div>
              )}

              <CrossChainTransferModal
                isOpen={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                onTransfer={handleCrossChainTransfer}
                isTransferring={isTransferring}
                currentChainId={Number(process.env.NEXT_PUBLIC_CHAIN_ID)}
              />

              {/* History */}
              <div className="bg-gray-800/30 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <FaHistory className="mr-2 text-purple-400" />
                  History
                </h3>
                <div className="space-y-4">
                  <HistoryItem action="Listed" date="2 days ago" price="45 ETH" />
                  <HistoryItem action="Price Changed" date="5 days ago" price="50 ETH" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const SpecItem = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="space-y-1">
    <div className="flex items-center text-purple-400">
      <Icon className="mr-2" />
      <span className="text-sm text-gray-400">{label}</span>
    </div>
    <div className="text-white font-medium">{value}</div>
  </div>
)

const HistoryItem = ({ action, date, price }: { action: string; date: string; price: string }) => (
  <div className="flex items-center justify-between text-sm">
    <div className="text-gray-400">
      <span className="text-white">{action}</span> • {date}
    </div>
    <div className="flex items-center text-white">
      <FaEthereum className="mr-1 text-purple-400" />
      {formatPrice(price)} ETH
    </div>
  </div>
)

const LoadingState = () => (
  <div className="min-h-screen bg-black py-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="animate-pulse">
        <div className="h-96 bg-gray-800 rounded-xl mb-8" />
        <div className="h-8 bg-gray-800 rounded w-3/4 mb-4" />
        <div className="h-4 bg-gray-800 rounded w-1/2 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="h-4 bg-gray-800 rounded w-full" />
            <div className="h-4 bg-gray-800 rounded w-3/4" />
            <div className="h-4 bg-gray-800 rounded w-5/6" />
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-800 rounded w-full" />
            <div className="h-4 bg-gray-800 rounded w-3/4" />
            <div className="h-4 bg-gray-800 rounded w-5/6" />
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default CarDetailsPage
