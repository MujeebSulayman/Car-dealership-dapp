import { motion } from 'framer-motion'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import { FaSearch, FaCar } from 'react-icons/fa'
import { useAccount } from 'wagmi'

const Hero = () => {
  const { address } = useAccount()

  return (
    <div className="relative min-h-screen">
      {/* Updated overlay opacity and gradient */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/hero-bg.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
      </div>

      {/* Updated padding for better mobile spacing */}
      <div className="relative z-10 pt-24 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-7xl mx-auto text-center"
        >
          {/* Updated heading with adjusted mobile font sizes */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4 sm:mb-6 tracking-tight">
            Discover & Trade Cars
            <span className="block text-blue-400 mt-2 sm:mt-3 text-3xl sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-blue-500 to-blue-400 text-transparent bg-clip-text">
              Across Blockchains
            </span>
          </h1>
          
         
          <p className="text-md sm:text-xl text-gray-300/90 mb-10 sm:mb-14 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
            The first decentralized marketplace for buying and selling vehicles across multiple blockchain networks.
            Secure, transparent, and borderless.
          </p>

         
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center mb-16 sm:mb-20 px-4 sm:px-0">
           
              <>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-500 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                >
                  <FaSearch className="mr-2" />
                  Browse Cars
                </Link>
                <Link
                  href="/sell-car"
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-lg text-blue-400 border-2 border-blue-400/30 hover:border-blue-400 hover:bg-blue-400/10 transition-all duration-300"
                >
                  <FaCar className="mr-2" />
                  List Your Car
                </Link>
              </>
            
          </div>

          {/* Updated feature cards with adjusted mobile font sizes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 max-w-5xl mx-auto px-4 sm:px-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 * index }}
                className="backdrop-blur-lg bg-white/5 rounded-xl p-6 sm:p-8 border border-white/10 hover:border-blue-500/30 transition-all duration-300"
              >
                <feature.icon className="h-6 w-6 sm:h-10 sm:w-10 text-blue-400 mx-auto mb-4 sm:mb-6" />
                <h3 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-3 text-white">{feature.title}</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

const features = [
  {
    title: 'Cross-Chain Trading',
    description: 'Buy and sell cars across different blockchain networks seamlessly',
    icon: FaCar,
  },
  {
    title: 'Secure Transactions',
    description: 'Smart contract powered escrow system for safe dealings',
    icon: FaSearch,
  },
  {
    title: 'NFT Ownership',
    description: 'Each vehicle is tokenized as a unique NFT with verified history',
    icon: FaCar,
  },
]

export default Hero
