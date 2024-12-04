import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { FaEthereum, FaFilter, FaSearch } from 'react-icons/fa'
import { CarStruct, CarCondition, FuelType, CarTransmission } from '@/utils/type.dt'
import Link from 'next/link'

interface CarListProps {
  cars: CarStruct[]
  loading: boolean
}

const CarList: React.FC<CarListProps> = ({ cars, loading }) => {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    condition: '',
    fuelType: '',
    transmission: '',
    priceRange: '',
  })
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const filteredCars = cars.filter((car) => {
    const matchesSearch =
      car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.model.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCondition = !filters.condition || car.condition.toString() === filters.condition
    const matchesFuelType = !filters.fuelType || car.fuelType.toString() === filters.fuelType
    const matchesTransmission =
      !filters.transmission || car.transmission.toString() === filters.transmission

    return matchesSearch && matchesCondition && matchesFuelType && matchesTransmission
  })

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="px-4 md:px-0 max-w-7xl mx-auto">
      {/* Search and Filter Section */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search cars..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800/50 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Filter button for mobile */}
          <button
            className="md:hidden flex items-center justify-center gap-2 bg-gray-800/50 rounded-lg px-4 py-3 text-white"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <FaFilter />
            Filters
          </button>

          {/* Mobile filters drawer */}
          {showMobileFilters && (
            <div className="fixed inset-0 bg-black/50 z-50 md:hidden">
              <div className="bg-gray-900 h-[70vh] w-full absolute bottom-0 rounded-t-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Filters</h3>
                  <button onClick={() => setShowMobileFilters(false)} className="text-gray-400">
                    Close
                  </button>
                </div>
                <div className="space-y-4">
                  <select
                    value={filters.condition}
                    onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                    className="w-full bg-gray-800/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Condition</option>
                    {Object.entries(CarCondition).map(
                      ([key, value]) =>
                        typeof value === 'number' && (
                          <option key={value} value={value}>
                            {key}
                          </option>
                        )
                    )}
                  </select>
                  <select
                    value={filters.fuelType}
                    onChange={(e) => setFilters({ ...filters, fuelType: e.target.value })}
                    className="w-full bg-gray-800/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Fuel Type</option>
                    {Object.entries(FuelType).map(
                      ([key, value]) =>
                        typeof value === 'number' && (
                          <option key={value} value={value}>
                            {key}
                          </option>
                        )
                    )}
                  </select>
                  <select
                    value={filters.transmission}
                    onChange={(e) => setFilters({ ...filters, transmission: e.target.value })}
                    className="w-full bg-gray-800/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Transmission</option>
                    {Object.entries(CarTransmission).map(
                      ([key, value]) =>
                        typeof value === 'number' && (
                          <option key={value} value={value}>
                            {key}
                          </option>
                        )
                    )}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Desktop filters - hide on mobile */}
          <div className="hidden md:grid grid-cols-4 gap-4">
            <select
              value={filters.condition}
              onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
              className="bg-gray-800/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Condition</option>
              {Object.entries(CarCondition).map(
                ([key, value]) =>
                  typeof value === 'number' && (
                    <option key={value} value={value}>
                      {key}
                    </option>
                  )
              )}
            </select>
            <select
              value={filters.fuelType}
              onChange={(e) => setFilters({ ...filters, fuelType: e.target.value })}
              className="bg-gray-800/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Fuel Type</option>
              {Object.entries(FuelType).map(
                ([key, value]) =>
                  typeof value === 'number' && (
                    <option key={value} value={value}>
                      {key}
                    </option>
                  )
              )}
            </select>
            <select
              value={filters.transmission}
              onChange={(e) => setFilters({ ...filters, transmission: e.target.value })}
              className="bg-gray-800/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Transmission</option>
              {Object.entries(CarTransmission).map(
                ([key, value]) =>
                  typeof value === 'number' && (
                    <option key={value} value={value}>
                      {key}
                    </option>
                  )
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6 text-gray-400">
        Found {filteredCars.length} {filteredCars.length === 1 ? 'car' : 'cars'}
      </div>

      {/* Cars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredCars.map((car, index) => (
          <Link href={`/cars/${car.id}`} key={car.id}>
            <motion.div
              key={car.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-800/30 rounded-xl overflow-hidden backdrop-blur-sm hover:shadow-xl transition-all duration-300 border border-gray-700/50 hover:border-purple-500/50"
            >
              <div className="relative aspect-[16/9] group">
                <Image
                  src={car.images[0]}
                  alt={car.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div
                  className={`absolute top-4 right-4 px-2 py-1 text-xs font-bold text-white rounded ${
                    car.sold ? 'bg-red-500' : 'bg-green-500'
                  }`}
                >
                  {car.sold ? 'Sold' : 'Available'}
                </div>
              </div>

              <div className="p-4 md:p-6">
                <div className="flex justify-between items-start mb-3 md:mb-4">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-white mb-1 md:mb-2">
                      {car.name}
                    </h3>
                  </div>
                  <div className="flex items-center text-white font-bold">
                    <FaEthereum className="text-purple-400 mr-1" />
                    {Number(car.price) / 10 ** 18}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-700/30 rounded-lg p-2">
                    <div className="text-gray-400 text-sm">Year</div>
                    <div className="text-white">{car.year.toString()}</div>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-2">
                    <div className="text-gray-400 text-sm">Mileage</div>
                    <div className="text-white">{car.mileage.toString()} km</div>
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/cars/${car.id}`)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  View Details
                </button>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {filteredCars.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No cars found matching your criteria</p>
        </div>
      )}
    </div>
  )
}

const LoadingState = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="bg-gray-800/30 rounded-xl overflow-hidden animate-pulse">
        <div className="aspect-[16/9] bg-gray-700/50" />
        <div className="p-6 space-y-4">
          <div className="h-6 bg-gray-700/50 rounded w-3/4" />
          <div className="h-4 bg-gray-700/50 rounded w-1/2" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 bg-gray-700/50 rounded" />
            <div className="h-12 bg-gray-700/50 rounded" />
          </div>
          <div className="h-12 bg-gray-700/50 rounded" />
        </div>
      </div>
    ))}
  </div>
)

export default CarList
