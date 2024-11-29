import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'

// Import all brand logos
import mercedesLogo from '@/public/images/brands/mercedes.png'
import bmwLogo from '@/public/images/brands/bmw.png'
import audiLogo from '@/public/images/brands/audi.png'
import porscheLogo from '@/public/images/brands/porsche.png'
import teslaLogo from '@/public/images/brands/tesla.png'
import ferrariLogo from '@/public/images/brands/ferrari.png'
import lamborghiniLogo from '@/public/images/brands/lamborghini.png'
import rollsRoyceLogo from '@/public/images/brands/rolls-royce.png'

const carBrands = [
  {
    name: 'Mercedes-Benz',
    logo: mercedesLogo,
  },
  {
    name: 'BMW',
    logo: bmwLogo,
  },
  {
    name: 'Audi',
    logo: audiLogo,
  },
  {
    name: 'Porsche',
    logo: porscheLogo,
  },
  {
    name: 'Tesla',
    logo: teslaLogo,
  },
  {
    name: 'Ferrari',
    logo: ferrariLogo,
  },
  {
    name: 'Lamborghini',
    logo: lamborghiniLogo,
  },
  {
    name: 'Rolls-Royce',
    logo: rollsRoyceLogo,
  },
]

const Makers = () => {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  const handleImageError = (brandName: string) => {
    setFailedImages((prev) => new Set(prev).add(brandName))
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
            Explore our collection of luxury vehicles from the world's most prestigious
            manufacturers
          </motion.p>
        </div>

        {/* Brands Row with Horizontal Scroll */}
        <div className="relative">
          {/* Gradient Overlays for Scroll Indication */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
          
          {/* Scrollable Container */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex space-x-6 min-w-max px-4 py-2">
              {carBrands.map((brand, index) => (
                <motion.div
                  key={brand.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="w-40"
                >
                  <div className="group relative bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-800/50 hover:border-purple-500/50 transition-all duration-300">
                    {/* Logo Container */}
                    <div className="relative h-20 w-full mb-4 transition-transform duration-300 group-hover:scale-110">
                      {!failedImages.has(brand.name) ? (
                        <Image
                          src={brand.logo}
                          alt={`${brand.name} logo`}
                          fill
                          className="object-contain filter brightness-90 group-hover:brightness-100 transition-all duration-300"
                          onError={() => handleImageError(brand.name)}
                          sizes="160px"
                          priority={index < 4}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-lg font-semibold text-purple-400">{brand.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Brand Name */}
                    <div className="text-center">
                      <h3 className="text-white font-semibold group-hover:text-purple-400 transition-colors duration-300">
                        {brand.name}
                      </h3>
                    </div>

                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 rounded-xl bg-purple-500/0 group-hover:bg-purple-500/5 transition-colors duration-300" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Makers
