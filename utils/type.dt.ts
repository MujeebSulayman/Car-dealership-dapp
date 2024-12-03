import { BigNumberish } from 'ethers'

export enum CarCondition {
  New,
  Used,
  CertifiedPreOwned
}

export enum CarTransmission {
  Manual,
  Automatic
}

export enum FuelType {
  Gasoline,
  Diesel,
  Electric,
  Hybrid
}

export interface SellerDetails {
  wallet: string
  sellerName: string
  email: string
  phoneNumber: number
  profileImage: string
}

export interface CarBasicDetails {
  name: string
  images: string[]
  description: string
  make: string
  model: string
  year: number
  vin: string
}

export interface CarTechnicalDetails {
  mileage: number
  color: string
  condition: CarCondition
  transmission: CarTransmission
  fuelType: FuelType
  price: BigNumberish
}

export interface CarAdditionalInfo {
  location: string
  carHistory?: string
  features: string[]
}

export interface CarStruct {
  id: number
  owner: string
  name: string
  images: string[]
  description: string
  make: string
  model: string
  year: number
  vin: string
  mileage: number
  color: string
  condition: CarCondition
  transmission: CarTransmission
  fuelType: FuelType
  price: BigNumberish
  location: string
  features: string[]
  seller: SellerDetails
  sold: boolean
  deleted: boolean
  destinationChainId: number
  paymentToken: string
  sourceChainId: number
}

export interface SalesStruct {
  id: number
  newCarId: number
  price: number
  owner: string
}

export interface CarParams {
  basicDetails: CarBasicDetails
  technicalDetails: CarTechnicalDetails
  additionalInfo: CarAdditionalInfo
  sellerDetails: SellerDetails
  destinationChainId: number
  paymentToken: string
}
