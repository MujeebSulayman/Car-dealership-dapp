import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getMyCars } from '@/services/blockchain'
import { CarStruct } from '@/utils/type.dt'
import CarList from '@/components/CarList'
import Header from '@/components/Header'

const MyListings: React.FC = () => {
  const [myCars, setMyCars] = useState<CarStruct[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchMyCars = async () => {
      try {
        const cars = await getMyCars()
        setMyCars(cars)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching my cars:', error)
        setLoading(false)
      }
    }

    fetchMyCars()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white">
    
      <div className="container mx-auto px-4 py-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold pt-24 mb-12 text-center text-white"
        >
          My Car Listings
        </motion.h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-purple-600"></div>
          </div>
        ) : myCars.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center text-gray-400 text-xl"
          >
            You haven't listed any cars yet. 
            <br />
            <a href="/cars/list" className="text-purple-600 hover:underline mt-4 inline-block">
              List your first car now!
            </a>
          </motion.div>
        ) : (
          <CarList cars={myCars} loading={loading} />
        )}
      </div>
    </div>
  )
}

export default MyListings