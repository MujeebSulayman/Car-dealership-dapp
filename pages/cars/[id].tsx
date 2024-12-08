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
  FaExclamationTriangle,
  FaArrowRight,
} from 'react-icons/fa'
import { getCar, purchaseCarFromChain, deleteCar } from '@/services/blockchain'
import { CarStruct, CarCondition, CarTransmission, FuelType } from '@/utils/type.dt'
import { useAccount, useConnect } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import Lightbox from 'react-image-lightbox'
import 'react-image-lightbox/style.css'
import { toast } from 'react-toastify'
import { ethers } from 'ethers'
import CrossChainPurchaseModal from '@/components/CrossChainPurchaseModal'
import CrossChainTransferModal from '@/components/CrossChainTransferModal'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

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
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchCar = async () => {
      if (!id) return
      setLoading(true)
      try {
        const carData = await getCar(Number(id))
        if (!carData) {
          toast.error('This car listing has been deleted')
          router.push('/cars')
          return
        }
        setCar(carData)
      } catch (error) {
        console.error('Error fetching car:', error)
        toast.error('Error loading car details')
      } finally {
        setLoading(false)
      }
    }

    fetchCar()
  }, [id, router])

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

  const handlePurchase = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }
    setShowPurchaseModal(true)
  }

  const handleChainPurchase = async (chainId: number, price: string) => {
    setIsPurchasing(true)
    try {
      await purchaseCarFromChain(Number(id), chainId, price)
      toast.success('Purchase initiated successfully!')
      router.push(`/cars/${id}`)
    } catch (error: any) {
      console.error('Error purchasing car:', error)
      toast.error(error.message || 'Failed to purchase car')
    } finally {
      setIsPurchasing(false)
      setShowPurchaseModal(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteCar(Number(id))
      toast.success('Car deleted successfully')
      router.push('/')
    } catch (error) {
      console.error('Error deleting car:', error)
      toast.error('Failed to delete car')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
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
        <div className="flex flex-col mb-6">
          <div className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h1 className="text-xl sm:text-4xl font-bold text-white">{car.name}</h1>
              <div className="flex items-center py-2 rounded-lg">
                <FaEthereum className="text-purple-400 text-xl mr-2" />
                <span className="flex  text-white font-bold lg:text-3xl text-xl ">
                  {formatPrice(car.price)} ETH
                </span>
              </div>
            </div>

            {/* Location - Adjusted spacing */}
            <div className="flex items-center text-gray-400 mt-2">
              <FaMapMarkerAlt className="text-base sm:text-lg mr-1.5" />
              <span className="text-sm sm:text-base">{car.location}</span>
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
            <div className="fixed bottom-0 left-0 right-0 lg:relative lg:mt-6 space-y-4 p-4 bg-gray-900/95 backdrop-blur-sm lg:bg-transparent lg:p-0">
              {address && address.toLowerCase() === car.owner.toLowerCase() ? (
                <div className="space-y-3">
                  <button
                    onClick={() => router.push(`/cars/edit/${id}`)}
                    disabled={car.sold}
                    className={`w-full px-6 py-3 ${
                      car.sold
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700'
                    } text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium`}
                  >
                    {car.sold ? 'Car Already Sold' : 'Edit Listing'}
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={isDeleting}
                    className="w-full px-6 py-3 border-2 border-purple-600 text-purple-500 rounded-lg hover:bg-purple-600/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Listing'}
                  </button>
                </div>
              ) : isConnected ? (
                <button
                  onClick={handlePurchase}
                  disabled={loading || isPurchasing || isLoading || car.sold}
                  className={`w-full px-6 py-3 ${
                    car.sold
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700'
                  } text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium`}
                >
                  {car.sold
                    ? 'Car Already Sold'
                    : isPurchasing
                    ? 'Processing Purchase...'
                    : isLoading
                    ? 'Loading...'
                    : 'Purchase Now'}
                </button>
              ) : (
                <button
                  onClick={() => connect({ connector: new InjectedConnector() })}
                  className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium"
                >
                  Connect Wallet
                </button>
              )}
            </div>

            <div className="pb-24 lg:pb-0">
              {/* Cross-Chain Transfer - Only show for owner */}
              {isConnected && address?.toLowerCase() === car.owner.toLowerCase() && (
                <div className="bg-gray-800/30 rounded-xl p-6 backdrop-blur-sm">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-md font-semibold text-white">Cross-Chain Transfer</h3>
                      <div className="flex items-center mt-1 text-sm space-x-2">
                        <FaExchangeAlt className="h-4 w-4 text-purple-400" />
                        <span className="text-gray-400">Bridge to Another Chain</span>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 space-y-4">
                      <div className="flex items-start gap-3">
                        <Image
                          src="/images/assets/across.png"
                          alt="Across Protocol"
                          width={24}
                          height={24}
                          className="rounded-full mt-1"
                        />
                        <p className="text-gray-400 text-sm">
                          Transfer your car listing to another blockchain network using Across
                          Protocol's secure cross-chain bridge. Enjoy optimized fees and fast
                          finality.
                        </p>
                      </div>

                      <button
                        onClick={() => setShowTransferModal(true)}
                        className="w-full mt-2 px-6 py-3 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                      >
                        <span>Start Transfer</span>
                        <FaArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cross-Chain Transfer Modal */}
            <CrossChainTransferModal
              isOpen={showTransferModal}
              onClose={() => setShowTransferModal(false)}
              carId={Number(id)}
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
      <Transition appear show={showDeleteModal} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => !isDeleting && setShowDeleteModal(false)}
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
            <div className="fixed inset-0 bg-black/80" />
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gradient-to-b from-gray-900 to-black p-6 text-left align-middle shadow-xl transition-all border border-gray-800">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100/10">
                    <FaExclamationTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <Dialog.Title as="h3" className="text-xl font-bold text-center text-white mb-4">
                    Delete Car Listing
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-gray-300 text-center">
                      Are you sure you want to delete this car listing? This action cannot be
                      undone.
                    </p>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button
                      type="button"
                      className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium disabled:opacity-50"
                      onClick={() => setShowDeleteModal(false)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          <span>Deleting...</span>
                        </div>
                      ) : (
                        'Delete'
                      )}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      <CrossChainPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        carPrice={formatPrice(car?.price || 0)}
        onPurchase={handleChainPurchase}
      />
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
