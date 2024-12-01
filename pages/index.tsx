import { useState, useEffect } from 'react'
import Hero from '@/components/Hero'
import Makers from '@/components/Makers'
import CarList from '@/components/CarList'
import { CarStruct } from '@/utils/type.dt'
import { motion } from 'framer-motion'
import { getEthereumContract } from '@/services/blockchain'

const Home = () => {
  const [cars, setCars] = useState<CarStruct[]>([])
  const [loading, setLoading] = useState(true)
  const [end, setEnd] = useState<number>(6)

  useEffect(() => {
    const loadCars = async () => {
      try {
        const contract = await getEthereumContract()
        const allCars = await contract.getAllCars()
        const available = allCars.filter((car: CarStruct) => !car.sold)
        setCars(available)
      } catch (error) {
        console.error('Error loading cars:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCars()
  }, [])

  return (
    <div className="bg-black">
      <Hero />
      <Makers />
      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Explore Our Collection</h1>
          <p className="text-gray-400 text-lg">
            Find your dream car from our carefully curated selection
          </p>
        </div>

        {cars.length > 0 ? (
          <>
            <CarList cars={cars.slice(0, end)} loading={loading} />
            {cars.length > end && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setEnd(end + 6)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg transition-all duration-300 font-medium"
                >
                  View More Cars
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-400 text-lg">
            {loading ? 'Finding the perfect cars for you...' : 'New vehicles coming soon. Check back later!'}
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
