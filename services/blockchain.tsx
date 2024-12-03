import { ethers } from 'ethers'
import address from '../contracts/contractAddresses.json'
import abi from '../artifacts/contracts/HemDealer.sol/HemDealer.json'
import crossChainAbi from '../artifacts/contracts/HemDealerCrossChain.sol/HemDealerCrossChain.json'
import { CarParams, CarStruct, SalesStruct } from '@/utils/type.dt'

const toWei = (num: number) => ethers.parseEther(num.toString())
const fromWei = (num: number) => ethers.formatEther(num)

let ethereum: any
let tx: any

if (typeof window !== 'undefined') ethereum = (window as any).ethereum

const getEthereumContract = async () => {
  try {
    const accounts = await ethereum?.request?.({ method: 'eth_accounts' })

    if (accounts?.length > 0) {
      const provider = new ethers.BrowserProvider(ethereum)
      const signer = await provider.getSigner()
      const contracts = new ethers.Contract(address.HemDealer, abi.abi, signer)
      return contracts
    } else {
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)
      const contracts = new ethers.Contract(address.HemDealer, abi.abi, provider)
      return contracts
    }
  } catch (error) {
    console.error('Failed to get Ethereum contract:', error)
    throw error
  }
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

    console.log('Token support verified, proceeding with listing')

    const contract = await getEthereumContract()

    const provider = new ethers.BrowserProvider(ethereum)
    const network = await provider.getNetwork()
    const currentChainId = Number(network.chainId)

    if (car.destinationChainId === currentChainId) {
      console.warn('Destination chain is same as current chain')
    }

    tx = await contract.listCar(
      car.basicDetails,
      car.technicalDetails,
      car.additionalInfo,
      car.sellerDetails,
      car.destinationChainId,
      car.paymentToken,
      {
        gasLimit: 3000000,
      }
    )

    console.log('Transaction sent:', tx.hash)
    await tx.wait()
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

    tx = await contract.updateCar(
      carId,
      car.basicDetails,
      car.technicalDetails,
      car.additionalInfo,
      car.sellerDetails
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
    tx = await contract.deleteCar(carId)
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

    // Check if cross-chain purchase is needed
    const provider = contract.runner as ethers.Provider
    const network = await provider.getNetwork()

    if (car.destinationChainId !== network.chainId) {
      // Get quote for cross-chain transfer
      const quote = await getAcrossQuote(
        Number(ethers.formatEther(car.price)),
        car.destinationChainId
      )

      // Calculate total amount including relayer fee
      const totalAmount = Number(car.price) + (Number(car.price) * quote.relayerFeePct) / 10000

      tx = await contract.buyCar(carId, quote.relayerFeePct, quote.quoteTimestamp, {
        value: totalAmount,
      })
    } else {
      // Same chain purchase - pass 0 for relayerFeePct and current timestamp
      tx = await contract.buyCar(
        carId,
        0, // relayerFeePct
        Math.floor(Date.now() / 1000), // quoteTimestamp
        { value: car.price }
      )
    }

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
): Promise<{ relayerFeePct: number; quoteTimestamp: number }> => {
  try {
    // Call Across API to get quote
    const response = await fetch('https://across-v2-api.herokuapp.com/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: toWei(amount).toString(),
        originToken: ethers.ZeroAddress,
        destinationChainId: destinationChainId,
        originChainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111'),
        destinationToken: ethers.ZeroAddress,
        receiveNativeToken: true,
      }),
    })

    const quote = await response.json()
    return {
      relayerFeePct: quote.relayerFeePct,
      quoteTimestamp: Math.floor(Date.now() / 1000),
    }
  } catch (error) {
    console.error('Error getting Across quote:', error)
    throw error
  }
}

const initiateCrossChainTransfer = async (carId: number, targetChainId: number): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }

  try {
    const contract = await getCrossChainContract()
    const car = await getCar(carId)

    // Get quote from Across
    const quote = await getAcrossQuote(Number(ethers.formatEther(car.price)), targetChainId)

    // Calculate total amount including relayer fee
    const totalAmount = Number(car.price) + (Number(car.price) * quote.relayerFeePct) / 10000

    tx = await contract.initiateCrossChainTransfer(
      carId,
      targetChainId,
      quote.relayerFeePct,
      quote.quoteTimestamp,
      { value: totalAmount }
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

const isSupportedToken = async (token: string): Promise<boolean> => {
  try {
    console.log('Checking token support for:', token)

    // Always allow native token (address(0))
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
    const contract = await getCrossChainContract()
    tx = await contract.cancelTimedOutTransfer(carId)
    await tx.wait()
    return Promise.resolve(tx)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const handleError = (error: any) => {
  if (error.code === 4001) {
    return 'Transaction rejected by user'
  }
  if (error.code === -32603) {
    return 'Internal JSON-RPC error. Check gas settings'
  }
  return error.message || 'Unknown error occurred'
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

const isTransferTimedOut = async (carId: number): Promise<boolean> => {
  try {
    const contract = await getCrossChainContract()
    return await contract.isTransferTimedOut(carId)
  } catch (error) {
    console.error('Error checking transfer timeout:', error)
    throw error
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
}
