import { ethers } from 'ethers'
import address from '../contracts/contractAddresses.json'
import abi from '../artifacts/contracts/HemDealer.sol/HemDealer.json'
import crossChainAbi from '../artifacts/contracts/HemDealerCrossChain.sol/HemDealerCrossChain.json'
import { CarParams, CarStruct, SalesStruct } from '@/utils/type.dt'

const toWei = (num: number) => ethers.parseEther(num.toString())
const fromWei = (num: number) => ethers.formatEther(num)

let ethereum: any
let tx: any
let cachedProvider: ethers.BrowserProvider | null = null
let cachedContract: ethers.Contract | null = null

if (typeof window !== 'undefined') ethereum = (window as any).ethereum

const getEthereumContract = async () => {
  try {
    const accounts = await ethereum?.request?.({ method: 'eth_accounts' })

    if (accounts?.length > 0) {
      if (!cachedProvider) {
        cachedProvider = new ethers.BrowserProvider(ethereum)
      }
      if (!cachedContract) {
        const signer = await cachedProvider.getSigner()
        cachedContract = new ethers.Contract(address.HemDealer, abi.abi, signer)
      }
      return cachedContract
    } else {
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)
      const contract = new ethers.Contract(address.HemDealer, abi.abi, provider)
      return contract
    }
  } catch (error) {
    console.error('Failed to get Ethereum contract:', error)
    throw error
  }
}

// Reset cache when network or account changes
if (typeof window !== 'undefined') {
  ethereum?.on('chainChanged', () => {
    cachedProvider = null
    cachedContract = null
  })

  ethereum?.on('accountsChanged', () => {
    cachedProvider = null
    cachedContract = null
  })
}

const getCrossChainContract = async () => {
  try {
    const accounts = await ethereum?.request?.({ method: 'eth_accounts' })
    if (accounts?.length > 0) {
      const provider = new ethers.BrowserProvider(ethereum)
      const signer = await provider.getSigner()
      return new ethers.Contract(address.HemDealerCrossChain, crossChainAbi.abi, signer)
    } else {
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)
      return new ethers.Contract(address.HemDealerCrossChain, crossChainAbi.abi, provider)
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

const getCar = async (carId: number): Promise<CarStruct> => {
  try {
    const contract = await getEthereumContract()
    tx = await contract.getCar(carId)
    return Promise.resolve(tx)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const getAllCars = async (): Promise<CarStruct[]> => {
  try {
    const contract = await getEthereumContract()
    tx = await contract.getAllCars()
    return Promise.resolve(tx)
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
    tx = await contract.getAllSales()
    return Promise.resolve(tx)
  } catch (error) {
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
    const response = await fetch('https://api.across.to/api/v1/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amount.toString(),
        originToken: ethers.ZeroAddress,
        destinationChainId: destinationChainId,
        originChainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111'),
        destinationToken: ethers.ZeroAddress,
        receiveNativeToken: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const quote = await response.json()
    return {
      relayerFeePct: quote.relayerFeePct,
      quoteTimestamp: Math.floor(Date.now() / 1000),
      amount: quote.amount,
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
  sourceChainId: number,
  amount: string
): Promise<void> => {
  try {
    const contract = await getCrossChainContract()
    const { relayerFeePct, quoteTimestamp } = await getAcrossQuote(Number(amount), sourceChainId)

    tx = await contract.purchaseCarFromChain(carId, sourceChainId, relayerFeePct, quoteTimestamp, {
      value: ethers.parseEther(amount),
    })

    await tx.wait()
  } catch (error) {
    console.error('Error in cross-chain purchase:', error)
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
  getCrossChainContract
}

