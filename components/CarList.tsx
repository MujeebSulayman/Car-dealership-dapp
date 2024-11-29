import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { FaEthereum, FaMapMarkerAlt, FaClock } from 'react-icons/fa'
import { CarStruct } from '@/utils/type.dt'

interface CarListProps {
  cars: CarStruct[]
  loading?: boolean
}

const CarList = ({ cars, loading }: CarListProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <div
            key={index}
            className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/50 animate-pulse"
          >
            <div className="aspect-[16/9] rounded-lg bg-zinc-800/50 mb-4" />
            <div className="h-6 bg-zinc-800/50 rounded w-3/4 mb-2" />
            <div className="h-4 bg-zinc-800/50 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {cars.map((car, index) => (
        <motion.div
          key={car.id.toString()}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Link href={`/cars/${car.id}`}>
            <div className="group bg-zinc-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-zinc-800/50 hover:border-purple-500/50 transition-all duration-300">
              {/* Car Image */}
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={car.images[0]}
                  alt={car.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Car Details */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors duration-300">
                    {car.name}
                  </h3>
                  <div className="flex items-center text-purple-400">
                    <FaEthereum className="mr-1" />
                    <span>{car.price} ETH</span>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-400 mb-3">
                  <div className="flex items-center mr-4">
                    <FaMapMarkerAlt className="mr-1" />
                    {car.location}
                  </div>
                  <div className="flex items-center">
                    <FaClock className="mr-1" />
                    {car.year}
                  </div>
                </div>

                {/* Car Specs */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-zinc-800/30 rounded-lg p-2 text-center">
                    <span className="text-gray-400">Mileage</span>
                    <p className="text-white font-medium">{car.mileage} km</p>
                  </div>
                  <div className="bg-zinc-800/30 rounded-lg p-2 text-center">
                    <span className="text-gray-400">Condition</span>
                    <p className="text-white font-medium">{car.condition}</p>
                  </div>
                </div>

                {/* Seller Info */}
                <div className="mt-4 pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full overflow-hidden relative mr-2">
                      <Image
                        src={car.seller.profileImage}
                        alt={car.seller.sellerName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-sm text-gray-400">{car.seller.sellerName}</span>
                  </div>
                  <span className="text-sm text-purple-400">
                    {car.sold ? 'Sold' : 'Available'}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}

export default CarList
