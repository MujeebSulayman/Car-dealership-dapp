import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAccount } from 'wagmi'
import { getCar, updateCar } from '@/services/blockchain'
import { CarParams, CarStruct } from '@/utils/type.dt'
import { toast } from 'react-hot-toast'

const EditCar = () => {
  const router = useRouter()
  const { id } = router.query
  const { address } = useAccount()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [car, setCar] = useState<CarStruct | null>(null)
  const [formData, setFormData] = useState<CarParams | null>(null)

  useEffect(() => {
    const loadCar = async () => {
      if (!id) return
      try {
        const carData = await getCar(Number(id))
        setCar(carData)
        // Convert car data to form data format
        setFormData({
          basicDetails: {
            name: carData.name,
            images: carData.images,
            description: carData.description,
            make: carData.make,
            model: carData.model,
            year: carData.year,
            vin: carData.vin,
          },
          technicalDetails: {
            mileage: carData.mileage,
            color: carData.color,
            condition: carData.condition,
            transmission: carData.transmission,
            fuelType: carData.fuelType,
            price: carData.price.toString(),
          },
          additionalInfo: {
            location: carData.location,
            carHistory: '',
            features: carData.features,
          },
          sellerDetails: carData.seller,
          destinationChainId: carData.destinationChainId,
          paymentToken: carData.paymentToken,
        })
      } catch (error) {
        console.error('Error loading car:', error)
        toast.error('Failed to load car details')
      } finally {
        setLoading(false)
      }
    }

    loadCar()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!car || !formData || !address) return
    setSaving(true)
    try {
      await updateCar(car.id, formData)
      toast.success('Car updated successfully')
      router.push(`/cars/${car.id}`)
    } catch (error) {
      console.error('Error updating car:', error)
      toast.error('Failed to update car')
    } finally {
      setSaving(false)
    }
  }

  // Add your form JSX here - you can reuse most of the form from the list car page
  // Just pre-populate the fields with formData values
  
  return (
    <div className="min-h-screen bg-black py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Edit Car Listing</h1>
        {/* Add your form JSX here */}
      </div>
    </div>
  )
}

export default EditCar 