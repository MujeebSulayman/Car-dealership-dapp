require('dotenv').config()
const { ethers } = require('hardhat')

async function main() {
  console.log('Starting deployment process...')
  try {
    const [deployer] = await ethers.getSigners()
    console.log('Deploying contracts with account:', deployer.address)
    console.log('Account balance:', (await ethers.provider.getBalance(deployer.address)).toString())

    // Get Across Protocol addresses from environment
    const acrossRouterAddress = process.env.ACROSS_ROUTER_ADDRESS
    const acrossSpokePoolAddress = process.env.ACROSS_SPOKE_POOL_ADDRESS

    if (!acrossRouterAddress || !acrossSpokePoolAddress) {
      throw new Error(
        'ACROSS_ROUTER_ADDRESS or ACROSS_SPOKE_POOL_ADDRESS not found in environment variables'
      )
    }

    // Properly format addresses using ethers
    const formattedRouterAddress = ethers.getAddress(acrossRouterAddress)
    const formattedSpokePoolAddress = ethers.getAddress(acrossSpokePoolAddress)

    // Deploy HemDealer first
    console.log('Deploying HemDealer Contract...')
    const HemDealer = await ethers.getContractFactory('HemDealer')
    const hemDealer = await HemDealer.deploy('HemDealer', 'HEMD')
    await hemDealer.waitForDeployment()
    const hemDealerAddress = await hemDealer.getAddress()
    console.log('HemDealer Contract deployed to:', hemDealerAddress)

    // Deploy HemDealerCrossChain
    console.log('Deploying HemDealerCrossChain Contract...')
    const HemDealerCrossChain = await ethers.getContractFactory('HemDealerCrossChain')
    const hemDealerCrossChain = await HemDealerCrossChain.deploy(
      hemDealerAddress,
      formattedSpokePoolAddress,
      formattedRouterAddress
    )
    await hemDealerCrossChain.waitForDeployment()
    const crossChainAddress = await hemDealerCrossChain.getAddress()
    console.log('HemDealerCrossChain Contract deployed to:', crossChainAddress)

    // Set cross-chain handler in HemDealer
    console.log('Setting CrossChain handler...')
    const setCrossChainTx = await hemDealer.setCrossChainHandler(crossChainAddress)
    await setCrossChainTx.wait()
    console.log('CrossChain handler set successfully')

    console.log('Deployment completed successfully')
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
