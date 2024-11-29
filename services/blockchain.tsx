import { ethers } from 'ethers'
import address from '../contracts/contractAddresses.json'
import abi from '../artifacts/contracts/HemDealer.sol/HemDealer.json'
import crossChainAbi from '../artifacts/contracts/HemDealerCrossChain.sol/HemDealerCrossChain.json'
import { CarParams, CarStruct, SalesStruct } from '@/utils/type.dt'

const toWei = (num: number) => ethers.parseEther(num.toString())

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
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }
  try {
    const contract = await getEthereumContract()

    tx = await contract.listCar(
      car.basicDetails,
      car.technicalDetails,
      car.additionalInfo,
      car.sellerDetails,
      car.destinationChainId,
      car.paymentToken
    )

    await tx.wait()
    return Promise.resolve(tx)
  } catch (error) {
    reportError(error)
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
      const crossChainContract = await getCrossChainContract()
      tx = await crossChainContract.bridgePayment(
        car.paymentToken,
        car.price,
        car.seller.wallet,
        car.destinationChainId,
        { value: car.paymentToken === ethers.ZeroAddress ? car.price : 0 }
      )
    } else {
      tx = await contract.buyCar(carId, { value: car.price })
    }

    await tx.wait()
    return Promise.resolve(tx)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const initiateCrossChainTransfer = async (carId: number, targetChainId: number): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }

  try {
    const contract = await getCrossChainContract()
    tx = await contract.initiateCrossChainTransfer(carId, targetChainId)
    await tx.wait()
    return Promise.resolve(tx)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const bridgePayment = async (
  token: string, // Token address (ethers.ZeroAddress for ETH)
  amount: number, // Amount to bridge
  recipient: string, // Seller's address
  destinationChainId: number // Target chain ID
): Promise<void> => {
  if (!ethereum) {
    reportError('Please install a wallet provider')
    return Promise.reject(new Error('Browser provider not found'))
  }

  try {
    const contract = await getCrossChainContract()
    // If token is ETH (ZeroAddress), send ETH value
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
    const contract = await getCrossChainContract()
    tx = await contract.isSupportedToken(token)
    return Promise.resolve(tx)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
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
  getEthereumContract
}
