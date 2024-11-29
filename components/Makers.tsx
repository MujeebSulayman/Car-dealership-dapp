import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

const carBrands = [
  {
    name: 'Mercedes-Benz',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/original/mercedes-benz.png',
    models: '24+ Models',
  },
  {
    name: 'BMW',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/original/bmw.png',
    models: '18+ Models',
  },
  {
    name: 'Audi',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/original/audi.png',
    models: '20+ Models',
  },
  {
    name: 'Porsche',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/original/porsche.png',
    models: '12+ Models',
  },
  {
    name: 'Tesla',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/original/tesla.png',
    models: '6+ Models',
  },
  {
    name: 'Ferrari',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/original/ferrari.png',
    models: '8+ Models',
  },
  {
    name: 'Lamborghini',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/original/lamborghini.png',
    models: '10+ Models',
  },
  {
    name: 'Rolls-Royce',
    logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/original/rolls-royce.png',
    models: '5+ Models',
  },
]

const Makers = () => {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  const handleImageError = (brandName: string) => {
    setFailedImages(prev => new Set(prev).add(brandName))
  }

  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
          >
            Premium Car Brands
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto"
          >
            Explore our collection of luxury vehicles from the world's most prestigious manufacturers
          </motion.p>
        </div>

        {/* Brands Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
          {carBrands.map((brand, index) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={`/cars/brands/${brand.name.toLowerCase()}`}>
                <div className="group relative bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-800/50 hover:border-purple-500/50 transition-all duration-300">
                  {/* Logo Container */}
                  <div className="relative h-24 w-full mb-4 transition-transform duration-300 group-hover:scale-110">
                    {!failedImages.has(brand.name) ? (
                      <Image
                        src={brand.logo}
                        alt={`${brand.name} logo`}
                        fill
                        className="object-contain filter brightness-90 group-hover:brightness-100 transition-all duration-300"
                        onError={() => handleImageError(brand.name)}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-lg font-semibold text-purple-400">{brand.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Brand Info */}
                  <div className="text-center">
                    <h3 className="text-white font-semibold mb-1 group-hover:text-purple-400 transition-colors duration-300">
                      {brand.name}
                    </h3>
                    <p className="text-sm text-gray-400 group-hover:text-purple-300/80 transition-colors duration-300">
                      {brand.models}
                    </p>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 rounded-xl bg-purple-500/0 group-hover:bg-purple-500/5 transition-colors duration-300" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link href="/cars/brands">
            <button className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
              View All Brands
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

export default Makers
