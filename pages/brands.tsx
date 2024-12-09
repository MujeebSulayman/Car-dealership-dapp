import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Head from 'next/head'
import { FaSearch, FaFilter } from 'react-icons/fa'

// Import brand logos
import mercedesLogo from '@/public/images/brands/mercedes.png'
import bmwLogo from '@/public/images/brands/bmw.png'
import audiLogo from '@/public/images/brands/audi.png'
import porscheLogo from '@/public/images/brands/porsche.png'
import teslaLogo from '@/public/images/brands/tesla.png'
import ferrariLogo from '@/public/images/brands/ferrari.png'
import lamborghiniLogo from '@/public/images/brands/lamborghini.png'
import rollsRoyceLogo from '@/public/images/brands/rolls-royce.png'

interface Brand {
  name: string
  logo: any
  description: string
  country: string
  foundedYear: number
  supportedChains?: string[]
}

const carBrands: Brand[] = [
  {
    name: 'Mercedes-Benz',
    logo: mercedesLogo,
    description: 'Pioneering luxury automotive engineering',
    country: 'Germany',
    foundedYear: 1886,
    supportedChains: ['Ethereum', 'Polygon']
  },
  {
    name: 'BMW',
    logo: bmwLogo,
    description: 'The ultimate driving machine',
    country: 'Germany',
    foundedYear: 1916,
    supportedChains: ['Binance Smart Chain']
  },
  {
    name: 'Audi',
    logo: audiLogo,
    description: 'Vorsprung durch Technik',
    country: 'Germany',
    foundedYear: 1909,
    supportedChains: ['Ethereum']
  },
  {
    name: 'Porsche',
    logo: porscheLogo,
    description: 'High-performance sports cars',
    country: 'Germany',
    foundedYear: 1931,
    supportedChains: ['Polygon']
  },
  {
    name: 'Tesla',
    logo: teslaLogo,
    description: 'Electric vehicles and clean energy',
    country: 'United States',
    foundedYear: 2003,
    supportedChains: ['Ethereum', 'Binance Smart Chain']
  },
  {
    name: 'Ferrari',
    logo: ferrariLogo,
    description: 'Italian luxury sports cars',
    country: 'Italy',
    foundedYear: 1939,
    supportedChains: ['Polygon']
  },
  {
    name: 'Lamborghini',
    logo: lamborghiniLogo,
    description: 'Extreme performance and design',
    country: 'Italy',
    foundedYear: 1963,
    supportedChains: ['Ethereum']
  },
  {
    name: 'Rolls-Royce',
    logo: rollsRoyceLogo,
    description: 'Unparalleled luxury and craftsmanship',
    country: 'United Kingdom',
    foundedYear: 1904,
    supportedChains: ['Binance Smart Chain']
  }
]

const Brands: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedChain, setSelectedChain] = useState<string | null>(null)

  // Unique countries and chains
  const countries = [...new Set(carBrands.map(brand => brand.country))]
  const supportedChains = [...new Set(carBrands.flatMap(brand => brand.supportedChains || []))]

  // Filtered brands
  const filteredBrands = carBrands.filter(brand => 
    (brand.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     brand.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!selectedCountry || brand.country === selectedCountry) &&
    (!selectedChain || brand.supportedChains?.includes(selectedChain))
  )

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedCountry(null)
    setSelectedChain(null)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>HemDealer - Car Brands</title>
        <meta name="description" content="Explore premium car brands with blockchain integration" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 pt-24 text-white">
            Premium Car Brands
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Discover the world's most prestigious automotive manufacturers with blockchain-enabled marketplace
          </p>
        </motion.div>

        {/* Filters */}
        <div className="mb-12 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-grow">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800/50 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Country Filter */}
            <select
              value={selectedCountry || ''}
              onChange={(e) => setSelectedCountry(e.target.value || null)}
              className="bg-gray-800/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>

            {/* Blockchain Filter */}
            <select
              value={selectedChain || ''}
              onChange={(e) => setSelectedChain(e.target.value || null)}
              className="bg-gray-800/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Blockchains</option>
              {supportedChains.map(chain => (
                <option key={chain} value={chain}>{chain}</option>
              ))}
            </select>

            {/* Reset Filters */}
            {(searchTerm || selectedCountry || selectedChain) && (
              <button
                onClick={resetFilters}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-3 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Brands Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBrands.length > 0 ? (
            filteredBrands.map((brand, index) => (
              <motion.div
                key={brand.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-800/50 hover:border-purple-500/50 transition-all duration-300 group"
              >
                {/* Brand Logo */}
                <div className="relative h-32 w-full mb-6 transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src={brand.logo}
                    alt={`${brand.name} logo`}
                    fill
                    className="object-contain filter brightness-90 group-hover:brightness-100 transition-all duration-300"
                    sizes="300px"
                  />
                </div>

                {/* Brand Details */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2 text-white group-hover:text-purple-400 transition-colors">
                    {brand.name}
                  </h2>
                  <p className="text-gray-400 mb-4 text-sm">{brand.description}</p>
                  
                  {/* Brand Metadata */}
                  <div className="flex justify-between text-sm text-gray-500 mb-4">
                    <span>🌍 {brand.country}</span>
                    <span>🕰️ Founded {brand.foundedYear}</span>
                  </div>

                  {/* Blockchain Tags */}
                  {brand.supportedChains && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {brand.supportedChains.map(chain => (
                        <span 
                          key={chain} 
                          className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs"
                        >
                          {chain}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-12">
              No brands found matching your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Brands