require('dotenv').config()
const { ethers } = require('hardhat')

async function main() {
  console.log('Starting deployment process...')
  try {
    const [deployer] = await ethers.getSigners()
    console.log('Deploying contracts with account:', deployer.address)
    console.log('Account balance:', (await ethers.provider.getBalance(deployer.address)).toString())

    // Deploy HemDealer first
    const HemDealer = await ethers.getContractFactory('HemDealer')
    console.log('Deploying HemDealer Contract...')
    const hemDealer = await HemDealer.deploy('HemDealer', 'HEMD') // Add constructor arguments
    await hemDealer.waitForDeployment()
    const hemDealerAddress = await hemDealer.getAddress()
    console.log('HemDealer Contract deployed to:', hemDealerAddress)

    // Get the Across Router address from environment variables
    const acrossRouterAddress = process.env.ACROSS_ROUTER_ADDRESS
    if (!acrossRouterAddress) {
      throw new Error('ACROSS_ROUTER_ADDRESS not found in environment variables')
    }

    // Deploy HemDealerCrossChain
    const HemDealerCrossChain = await ethers.getContractFactory('HemDealerCrossChain')
    console.log('Deploying HemDealerCrossChain Contract...')
    const hemDealerCrossChain = await HemDealerCrossChain.deploy(
      hemDealerAddress,
      acrossRouterAddress
    )
    await hemDealerCrossChain.waitForDeployment()
    const hemDealerCrossChainAddress = await hemDealerCrossChain.getAddress()
    console.log('HemDealerCrossChain Contract deployed to:', hemDealerCrossChainAddress)

    // Set the cross-chain handler in HemDealer
    console.log('Setting CrossChainHandler in HemDealer...')
    const setCrossChainTx = await hemDealer.setCrossChainHandler(hemDealerCrossChainAddress)
    await setCrossChainTx.wait()
    console.log('CrossChainHandler set successfully')

    // Save contract addresses
    const fs = require('fs')
    const contractsDir = __dirname + '/../contracts'

    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir, { recursive: true })
    }

    fs.writeFileSync(
      contractsDir + '/contractAddresses.json',
      JSON.stringify(
        {
          HemDealer: hemDealerAddress,
          HemDealerCrossChain: hemDealerCrossChainAddress,
          AcrossRouter: acrossRouterAddress,
        },
        undefined,
        2
      )
    )
    console.log('Contract addresses saved to contractAddresses.json')
  } catch (error) {
    console.error('Error in deployment process:', error)
    throw error
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
