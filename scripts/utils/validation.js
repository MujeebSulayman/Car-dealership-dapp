const { ethers } = require('hardhat')

function validateAndFormatAddress(address) {
  try {
    return ethers.getAddress(address)
  } catch (error) {
    throw new Error(`Invalid address format for ${address}: ${error.message}`)
  }
}

function validateAddresses(addresses) {
  return Object.entries(addresses).reduce((acc, [key, address]) => {
    acc[key] = validateAndFormatAddress(address)
    return acc
  }, {})
}

module.exports = {
  validateAndFormatAddress,
  validateAddresses,
}
