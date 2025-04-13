import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaEthereum, FaList, FaLink } from 'react-icons/fa'
import { toast } from 'react-toastify'
import Link from 'next/link'
import Image from 'next/image'
import { ethers } from 'ethers'

import { getAllSales, getCar } from '@/services/blockchain'
import { SalesStruct, CarStruct } from '@/utils/type.dt'

interface EnhancedSaleStruct extends SalesStruct {
  carDetails?: CarStruct
}

const SalesHistoryPage: React.FC = () => {
  const [sales, setSales] = useState<EnhancedSaleStruct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSalesHistory = async () => {
      try {
        setLoading(true)
        setError(null)

        const salesData = await getAllSales()

        if (!salesData || salesData.length === 0) {
          console.warn('No sales data found')
          setSales([])
          setLoading(false)
          return
        }

        const enhancedSales = await Promise.all(
          salesData.map(async (sale) => {
            try {
              if (!sale.newCarId || typeof sale.newCarId !== 'number') {
                console.warn('Invalid car ID:', sale.newCarId)
                return null
              }

              const carDetails = await getCar(sale.newCarId)

              if (!carDetails) {
                console.warn(`No car details found for car ID ${sale.newCarId}`)
                return null
              }

              return { ...sale, carDetails }
            } catch (error) {
              console.error(`Failed to fetch car details for car ID ${sale.newCarId}:`, error)
              return null
            }
          })
        )

        const validSales = enhancedSales.filter((sale) => sale !== null) as EnhancedSaleStruct[]

        if (validSales.length === 0) {
          setError('No valid sales data could be retrieved.')
        }

        setSales(validSales)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching sales history:', error)
        setError('Failed to load sales history. Please try again later.')
        setSales([])
        setLoading(false)
      }
    }
    fetchSalesHistory()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 pt-24 text-white">Sales History</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Comprehensive record of all car sales transactions
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                repeat: Infinity,
                duration: 1,
                ease: 'linear',
              }}
              className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
            />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <FaList className="text-4xl mb-4" />
            <p className="text-xl font-semibold">{error}</p>
            <p className="text-sm mt-2">Please try again later.</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <FaList className="text-4xl mb-4" />
            <p className="text-xl font-semibold">No Sales History Found</p>
            <p className="text-sm mt-2">Looks like there are no sales records yet.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4"
          >
            {sales.map((sale) => (
              <motion.div
                key={sale.id}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="bg-gray-800 rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-2xl"
              >
                {sale.carDetails && (
                  <div className="relative">
                    <img
                      src={sale.carDetails.images[0] || '/placeholder-car.png'}
                      alt={`Car ${sale.newCarId}`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-0 left-0 bg-black bg-opacity-50 text-white px-2 py-1 m-2 rounded">
                      {sale.carDetails.make} {sale.carDetails.model}
                    </div>
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <FaEthereum className="mr-1 text-purple-400" />
                      <span className="font-bold text-white">
                        {(() => {
                          try {
                            const priceValue =
                              typeof sale.price === 'bigint'
                                ? sale.price
                                : typeof sale.price === 'string'
                                ? BigInt(sale.price)
                                : typeof sale.price === 'number'
                                ? BigInt(Math.round(sale.price))
                                : sale.price

                            return `${ethers.formatEther(priceValue)} ETH`
                          } catch (error) {
                            console.error('Error formatting price:', error)
                            return 'N/A'
                          }
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                        SOLD
                      </span>
                      <Link
                        href={`/cars/${sale.newCarId}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <FaLink className="inline-block mr-1" /> Details
                      </Link>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold">Car ID:</span> {sale.newCarId}
                    </p>
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold">Owner:</span>
                      <span className="ml-2 bg-gray-700 px-2 py-1 rounded text-xs">
                        {sale.carDetails?.owner ? (
                          <Link
                            href={`https://sepolia.etherscan.io/address/${sale.carDetails.owner}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            {sale.carDetails.owner.slice(0, 6)}...{sale.carDetails.owner.slice(-4)}
                          </Link>
                        ) : (
                          <span className="text-gray-400">Not Available</span>
                        )}
                      </span>
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default SalesHistoryPage
