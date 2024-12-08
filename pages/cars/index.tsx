import { useState, useEffect } from 'react'
import CarList from '@/components/CarList'
import { CarStruct } from '@/utils/type.dt'
import { getEthereumContract } from '@/services/blockchain'

const CarsPage = () => {
  const [cars, setCars] = useState<CarStruct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCars = async () => {
      try {
        const contract = await getEthereumContract()
        const allCars = await contract.getAllCars()
        setCars(allCars)
      } catch (error) {
        console.error('Error loading cars:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCars()
  }, [])

  return (
    <div className="py-32 a min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-center text-white mb-8">
          Explore Our Web3 Car Collection
        </h1>
        <p className="text-center text-gray-400 mb-12">
          Discover the future of automotive technology with our exclusive selection of blockchain-enabled vehicles.
        </p>
        <CarList cars={cars} loading={loading} />
      </div>
    </div>
  )
}

export default CarsPage
