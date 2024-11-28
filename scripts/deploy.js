require('dotenv').config()
const { ethers } = require('hardhat')

async function main() {
  console.log('Starting deployment Process')
  try {
    const [deployer] = await ethers.getSigners()
    console.log('Deploying contract with the account:', deployer.address)
    console.log('Account balance:', (await ethers.provider.getBalance(deployer.address)).toString())

    const HemDealer = await ethers.getContractFactory('HemDealer')
    console.log('Deploying HemDealer Contract')
    const hemDealer = await HemDealer.deploy()
    await hemDealer.waitForDeployment()

    console.log('HemDealer Contract deployed to:', await hemDealer.getAddress())

    const fs = require('fs')
    const contractsDir = __dirname + '/../contracts'

    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir)
    }

    fs.writeFileSync(
      contractsDir + '/contractAddress.json',
      JSON.stringify({ HemDealer: await hemDealer.getAddress() }, undefined, 2)
    )
    console.log('Contract address saved to contractAddress.json')

    if (process.env.ETHERSCAN_API_KEY) {
      console.log('Waiting for block confirmations...')
      await hemDealer.deployTransaction.wait(6)
      await verify(hemDealer.address, [])
    }
  } catch (error) {
    console.log('Error in deployment process:', error)
  }
}

async function verify(contractAddress, args) {
  console.log('Verifying contract...')
  try {
    await run('verify:verify', {
      address: contractAddress,
      constructorArguments: args,
    })
  } catch (e) {
    if (e.message.toLowerCase().includes('already verified')) {
      console.log('Already verified!')
    } else {
      console.log(e)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
