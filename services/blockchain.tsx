import { ethers } from 'ethers'
import abi from '../artifacts/contracts/HemDealer.sol/HemDealer.json'
import crossChainAbi from '../artifacts/contracts/HemDealerCrossChain.sol/HemDealerCrossChain.json'
import { CarParams, CarStruct, SalesStruct } from '@/utils/type.dt'
import { chainConfig } from '../config/chains'

const toWei = (num: number) => ethers.parseEther(num.toString())
const fromWei = (num: number) => ethers.formatEther(num)

let ethereum: any
let tx: any
let cachedProvider: ethers.BrowserProvider | null = null
let cachedContract: ethers.Contract | null = null
let cachedChainId: number | null = null

if (typeof window !== 'undefined') ethereum = (window as any).ethereum

const getChainConfig = (chainId: number) => {
  return Object.values(chainConfig).find(chain => chain.chainId === chainId)
}

const switchNetwork = async (chainId: number) => {
  const config = getChainConfig(chainId)
  if (!config) throw new Error('Unsupported chain')

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    })
  } catch (error: any) {
    if (error.code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${chainId.toString(16)}`,
          chainName: config.name,
          rpcUrls: [config.rpcUrl],
          blockExplorerUrls: [config.explorer],
          nativeCurrency: {
            name: chainId === 11155111 ? 'ETH' : 'AMOY',
            symbol: chainId === 11155111 ? 'ETH' : 'AMOY',
            decimals: 18
          }
        }]
      })
    } else {
      throw error
    }
  }
}

const getEthereumContract = async (chainId?: number) => {
  try {
    const accounts = await ethereum?.request?.({ method: 'eth_accounts' })
    const currentChainId = chainId || (await ethereum?.request({ method: 'eth_chainId' }))
    const parsedChainId = Number(currentChainId)
    console.log('Current Chain ID:', parsedChainId)
    
    const config = getChainConfig(parsedChainId)
    
    if (!config) {
      console.error('Unsupported Chain Configuration:', {
        chainId: parsedChainId,
        availableChains: Object.values(chainConfig).map(chain => chain.chainId)
      })
      throw new Error(`Unsupported chain: ${parsedChainId}`)
    }

    if (accounts?.length > 0) {
      if (!cachedProvider || cachedChainId !== parsedChainId) {
        cachedProvider = new ethers.BrowserProvider(ethereum)
        cachedChainId = parsedChainId
      }
      if (!cachedContract || cachedChainId !== parsedChainId) {
        const signer = await cachedProvider.getSigner()
        cachedContract = new ethers.Contract(config.contracts.HemDealer, abi.abi, signer)
        cachedChainId = parsedChainId
      }
      return cachedContract
    } else {
      const provider = new ethers.JsonRpcProvider(config.rpcUrl)
      const contract = new ethers.Contract(config.contracts.HemDealer, abi.abi, provider)
      return contract
    }
  } catch (error) {
    console.error('Failed to get Ethereum contract:', error)
    throw error
  }
}

const getCrossChainContract = async (chainId?: number) => {
  try {
    const accounts = await ethereum?.request?.({ method: 'eth_accounts' })
    const currentChainId = chainId || (await ethereum?.request({ method: 'eth_chainId' }))
    const config = getChainConfig(Number(currentChainId))
    
    if (!config) throw new Error('Unsupported chain')

    if (accounts?.length > 0) {
      const provider = new ethers.BrowserProvider(ethereum)
      const signer = await provider.getSigner()
      return new ethers.Contract(config.contracts.HemDealerCrossChain, crossChainAbi.abi, signer)
    } else {
      const provider = new ethers.JsonRpcProvider(config.rpcUrl)
      return new ethers.Contract(config.contracts.HemDealerCrossChain, crossChainAbi.abi, provider)
    }
  } catch (error) {
    console.error('Failed to get CrossChain contract:', error)
    throw error
  }
}

const listCar = async (car: CarParams): Promise<void> => {
  if (!ethereum) {
    console.error('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }
  try {
    const isSupported = await isSupportedToken(car.paymentToken)

    if (!isSupported) {
      console.error('Payment token not supported:', car.paymentToken)
      return Promise.reject(new Error('Unsupported payment token'))
    }

    if (car.paymentToken !== ethers.ZeroAddress) {
      return Promise.reject(new Error('Only native token is supported'))
    }
    const formattedCar = {
      ...car,
      basicDetails: {
        ...car.basicDetails,
        year: Number(car.basicDetails.year),
        vin: car.basicDetails.vin.toString(),
      },
      technicalDetails: {
        ...car.technicalDetails,
        mileage: Number(car.technicalDetails.mileage),
        condition: Number(car.technicalDetails.condition),
        transmission: Number(car.technicalDetails.transmission),
        fuelType: Number(car.technicalDetails.fuelType),
        price: ethers.parseEther(car.technicalDetails.price.toString()),
      },
    }

    console.log('Sending car data to blockchain:', formattedCar)

    const contract = await getEthereumContract()
    const gasPrice = await cachedProvider?.getFeeData()

    // Estimate gas with a fallback
    const gasLimit = await contract.listCar.estimateGas(
      formattedCar.basicDetails,
      formattedCar.technicalDetails,
      formattedCar.additionalInfo,
      formattedCar.sellerDetails,
      formattedCar.destinationChainId,
      formattedCar.paymentToken
    ).catch(() => BigInt(500000)) 

    tx = await contract.listCar(
      formattedCar.basicDetails,
      formattedCar.technicalDetails,
      formattedCar.additionalInfo,
      formattedCar.sellerDetails,
      formattedCar.destinationChainId,
      formattedCar.paymentToken,
      {
        gasLimit: gasLimit,
        maxFeePerGas: gasPrice?.maxFeePerGas || undefined,
        maxPriorityFeePerGas: gasPrice?.maxPriorityFeePerGas || undefined,
      }
    )

    console.log('Transaction hash:', tx.hash)
    await tx.wait()
    console.log('Transaction confirmed')
    return Promise.resolve(tx)
  } catch (error: any) {
    console.error('Contract call failed:', {
      error,
      message: error.message,
      data: error.data,
      args: error.errorArgs,
    })
    return Promise.reject(error)
  }
}

const updateCar = async (carId: number, car: CarParams): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }

  try {
    const contract = await getEthereumContract()
    const gasPrice = await cachedProvider?.getFeeData()

    const gasLimit = await contract.updateCar.estimateGas(
      carId,
      car.basicDetails,
      car.technicalDetails,
      car.additionalInfo,
      car.sellerDetails
    ).catch(() => BigInt(400000))

    tx = await contract.updateCar(
      carId,
      car.basicDetails,
      car.technicalDetails,
      car.additionalInfo,
      car.sellerDetails,
      {
        gasLimit: gasLimit,
        maxFeePerGas: gasPrice?.maxFeePerGas || undefined,
        maxPriorityFeePerGas: gasPrice?.maxPriorityFeePerGas || undefined,
      }
    )

    await tx.wait()
    return Promise.resolve(tx)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const deleteCar = async (carId: number): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }

  try {
    const contract = await getEthereumContract()
    
    const gasLimit = await contract.deleteCar.estimateGas(carId).catch(() => BigInt(300000))
    const gasPrice = await cachedProvider?.getFeeData()
    
    tx = await contract.deleteCar(carId, {
      gasLimit: gasLimit,
      maxFeePerGas: gasPrice?.maxFeePerGas || undefined,
      maxPriorityFeePerGas: gasPrice?.maxPriorityFeePerGas || undefined,
    })
    
    await tx.wait()
    return Promise.resolve(tx)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const getCar = async (carId: number): Promise<CarStruct | null> => {
  try {
    const contract = await getEthereumContract()
    tx = await contract.getCar(carId)
    return Promise.resolve(tx)
  } catch (error: any) {
    if (error?.reason === "Car has been deleted") {
      return Promise.resolve(null)
    }
    reportError(error)
    return Promise.reject(error)
  }
}

const getAllCars = async (): Promise<CarStruct[]> => {
  try {
    // Default to Sepolia if no chain is selected
    const defaultChainId = 11155111 // Sepolia
    const contract = await getEthereumContract(defaultChainId)
    const cars = await contract.getAllCars()
    return Promise.resolve(cars)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const getMyCars = async (): Promise<CarStruct[]> => {
  try {
    const contract = await getEthereumContract()
    tx = await contract.getMyCars()
    return Promise.resolve(tx)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const getAllSales = async (): Promise<SalesStruct[]> => {
  try {
    const contract = await getEthereumContract()
    console.log('Getting sales from contract:', contract.address)
    tx = await contract.getAllSales()
    console.log('Raw sales data:', tx)
    return Promise.resolve(tx)
  } catch (error) {
    console.error('Error in getAllSales:', error)
    reportError(error)
    return Promise.reject(error)
  }
}

const buyCar = async (carId: number): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }

  try {
    const contract = await getEthereumContract()
    const car = await contract.getCar(carId)
    const gasPrice = await cachedProvider?.getFeeData()
    const chainId = await ethereum.request({ method: 'eth_chainId' })
    const currentChainId = parseInt(chainId as string, 16)

    if (car.destinationChainId !== currentChainId) {
      // Cross-chain purchase
      const crossChainContract = await getCrossChainContract()
      const quote = await getAcrossQuote(
        Number(ethers.formatEther(car.price)),
        car.destinationChainId
      )

      // First bridge the payment
      const totalAmount = Number(car.price) + (Number(car.price) * quote.relayerFeePct) / 10000
      const gasLimit = await crossChainContract.bridgePayment.estimateGas(
        totalAmount,
        car.seller.wallet,
        car.destinationChainId,
        quote.relayerFeePct,
        quote.quoteTimestamp,
        { value: totalAmount }
      ).catch(() => BigInt(350000))

      tx = await crossChainContract.bridgePayment(
        totalAmount,
        car.seller.wallet,
        car.destinationChainId,
        quote.relayerFeePct,
        quote.quoteTimestamp,
        {
          value: totalAmount,
          gasLimit: gasLimit,
          maxFeePerGas: gasPrice?.maxFeePerGas || undefined,
          maxPriorityFeePerGas: gasPrice?.maxPriorityFeePerGas || undefined,
        }
      )
      await tx.wait()

      // Then initiate the cross-chain transfer
      const transferGasLimit = await crossChainContract.initiateCrossChainTransfer.estimateGas(
        carId,
        car.destinationChainId,
        quote.relayerFeePct,
        quote.quoteTimestamp,
        { value: totalAmount }
      ).catch(() => BigInt(450000))

      tx = await crossChainContract.initiateCrossChainTransfer(
        carId,
        car.destinationChainId,
        quote.relayerFeePct,
        quote.quoteTimestamp,
        {
          value: totalAmount,
          gasLimit: transferGasLimit,
          maxFeePerGas: gasPrice?.maxFeePerGas || undefined,
          maxPriorityFeePerGas: gasPrice?.maxPriorityFeePerGas || undefined,
        }
      )
    } else {
      // Same chain purchase
      const gasLimit = await contract.buyCar.estimateGas(
        carId,
        0, // relayerFeePct
        Math.floor(Date.now() / 1000), // quoteTimestamp
        { value: car.price }
      ).catch(() => BigInt(350000))

      tx = await contract.buyCar(carId, 0, Math.floor(Date.now() / 1000), {
        value: car.price,
        gasLimit: gasLimit,
        maxFeePerGas: gasPrice?.maxFeePerGas || undefined,
        maxPriorityFeePerGas: gasPrice?.maxPriorityFeePerGas || undefined,
      })
    }

    await tx.wait()
    return Promise.resolve(tx)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const initiateCrossChainTransfer = async (
  carId: number,
  destinationChainId: number
): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }

  try {
    const quote = await getAcrossQuote(0, destinationChainId)
    const contract = await getEthereumContract()

    tx = await contract.initiateCrossChainTransfer(
      carId,
      destinationChainId,
      quote.relayerFeePct,
      quote.quoteTimestamp
    )

    await tx.wait()
    return Promise.resolve(tx)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const bridgePayment = async (
  token: string,
  amount: number,
  recipient: string,
  destinationChainId: number
): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }

  try {
    const contract = await getCrossChainContract()
    const value = token === ethers.ZeroAddress ? toWei(amount) : 0
    tx = await contract.bridgePayment(token, toWei(amount), recipient, destinationChainId, {
      value,
    })
    await tx.wait()
    return Promise.resolve(tx)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const getAcrossQuote = async (
  amount: number,
  destinationChainId: number
): Promise<{ relayerFeePct: number; quoteTimestamp: number; amount: string }> => {
  try {
    console.log('Requesting quote for amount:', amount, 'to chain:', destinationChainId)
    const response = await fetch('/api/across-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenSymbol: 'ETH',
        amount: amount.toString(),
        destinationChainId: destinationChainId,
        originChainId: 11155111,
        destinationAddress: '0x0000000000000000000000000000000000000000',
        timestamp: Math.floor(Date.now() / 1000),
        skipAmountLimit: true
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Quote API error:', errorData)
      throw new Error(errorData.error || 'Failed to fetch quote from Across Protocol')
    }

    const data = await response.json()
    console.log('Received quote data:', data)
    return {
      relayerFeePct: data.relayerFeePct,
      quoteTimestamp: data.timestamp,
      amount: data.updatedOutputAmount || data.outputAmount
    }
  } catch (error) {
    console.error('Error getting Across quote:', error)
    throw error
  }
}

const isSupportedToken = async (token: string): Promise<boolean> => {
  try {
    console.log('Checking token support for:', token)
    if (token === ethers.ZeroAddress) {
      console.log('Native token is always supported')
      return true
    }

    try {
      const contract = await getCrossChainContract()
      const result = await contract.supportedTokens(token)
      console.log('Token support result:', result)
      return result
    } catch (error) {
      console.warn('Error checking token support, defaulting to native token only:', error)
      return token === ethers.ZeroAddress
    }
  } catch (error) {
    console.error('Error in isSupportedToken:', error)
    return token === ethers.ZeroAddress
  }
}

const cancelTimedOutTransfer = async (carId: number): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }

  try {
    const crossChainContract = await getCrossChainContract()
    const gasPrice = await cachedProvider?.getFeeData()
    
    const gasLimit = await crossChainContract.cancelTimedOutTransfer.estimateGas(carId)
      .catch(() => BigInt(300000))

    tx = await crossChainContract.cancelTimedOutTransfer(carId, {
      gasLimit: gasLimit,
      maxFeePerGas: gasPrice?.maxFeePerGas || undefined,
      maxPriorityFeePerGas: gasPrice?.maxPriorityFeePerGas || undefined,
    })

    await tx.wait()
    return Promise.resolve(tx)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const isTransferTimedOut = async (carId: number): Promise<boolean> => {
  try {
    const crossChainContract = await getCrossChainContract()
    return await crossChainContract.isTransferTimedOut(carId)
  } catch (error) {
    console.error('Error checking transfer timeout:', error)
    return false
  }
}

const purchaseCarFromChain = async (
  carId: number,
  chainId: number,
  price: string
) => {
  try {
    const contract = await getEthereumContract()
    if (!contract) throw new Error('Contract not initialized')

    // If same chain (Sepolia to Sepolia), do direct purchase
    if (chainId === 11155111) {
      try {
        const tx = await contract.buyCar(
          carId,
          0,
          Math.floor(Date.now() / 1000),
          {
            value: ethers.parseEther(price)
          }
        )
        await tx.wait()
        return tx
      } catch (error: any) {
        if (error?.message?.includes('insufficient funds')) {
          throw new Error('Insufficient funds to cover car price and gas fees. Please ensure you have enough ETH for both the car price and transaction fees.')
        } else if (error?.message?.includes('user rejected')) {
          throw new Error('Transaction was rejected by user')
        } else if (error?.message?.includes('Invalid purchase')) {
          throw new Error('This car is not available for purchase')
        } else {
          throw error
        }
      }
    }

    // Otherwise, proceed with cross-chain purchase
    try {
      const quote = await getAcrossQuote(Number(ethers.parseEther(price)), chainId)
      const tx = await contract.buyCar(
        carId,
        quote.relayerFeePct,
        quote.quoteTimestamp,
        {
          value: ethers.parseEther(quote.amount)
        }
      )
      await tx.wait()
      return tx
    } catch (error: any) {
      if (error?.message?.includes('insufficient funds')) {
        throw new Error('Insufficient funds to cover car price, bridge fees, and gas fees. Please ensure you have enough ETH.')
      } else if (error?.message?.includes('user rejected')) {
        throw new Error('Transaction was rejected by user')
      } else if (error?.message?.includes('Invalid purchase')) {
        throw new Error('This car is not available for purchase')
      } else {
        throw error
      }
    }
  } catch (error) {
    console.error('Error purchasing car:', error)
    throw error
  }
}

const validateQuote = async (
  contract: ethers.Contract,
  amount: number,
  relayerFeePct: number,
  quoteTimestamp: number
): Promise<boolean> => {
  try {
    return await contract.validateQuote(toWei(amount), relayerFeePct, quoteTimestamp)
  } catch (error) {
    console.error('Quote validation failed:', error)
    return false
  }
}

export {
  listCar,
  updateCar,
  deleteCar,
  getCar,
  getAllCars,
  getMyCars,
  getAllSales,
  buyCar,
  initiateCrossChainTransfer,
  bridgePayment,
  isSupportedToken,
  cancelTimedOutTransfer,
  getEthereumContract,
  validateQuote,
  isTransferTimedOut,
  getAcrossQuote,
  toWei,
  fromWei,
  purchaseCarFromChain,
  getCrossChainContract,
  switchNetwork
}
