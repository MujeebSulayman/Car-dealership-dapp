const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts to Polygon Amoy with account:", deployer.address);

  try {
    // Deploy HemDealer with explicit gas settings
    const HemDealer = await ethers.getContractFactory("HemDealer");
    console.log("Deploying HemDealer...");
    const hemDealer = await HemDealer.deploy(
      "HemDealer",
      "HDL",
      {
        gasPrice: ethers.utils.parseUnits("0.5", "gwei"),
        gasLimit: 2000000
      }
    );
    await hemDealer.deployed();
    console.log("HemDealer deployed to:", hemDealer.address);

    // Wait a bit before next deployment
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Deploy HemDealerCrossChain with explicit gas settings
    console.log("Deploying HemDealerCrossChain...");
    const HemDealerCrossChain = await ethers.getContractFactory("HemDealerCrossChain");
    const hemDealerCrossChain = await HemDealerCrossChain.deploy(
      hemDealer.address,
      "0xC499a572640B64eA1C8c194c43Bc3E19940719dC", // Across Router address
      {
        gasPrice: ethers.utils.parseUnits("0.5", "gwei"),
        gasLimit: 2000000
      }
    );
    await hemDealerCrossChain.deployed();
    console.log("HemDealerCrossChain deployed to:", hemDealerCrossChain.address);

    // Wait a bit before setting cross chain handler
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Set cross chain handler in HemDealer
    console.log("Setting cross chain handler...");
    const tx = await hemDealer.setCrossChainHandler(
      hemDealerCrossChain.address,
      {
        gasPrice: ethers.utils.parseUnits("0.5", "gwei"),
        gasLimit: 100000
      }
    );
    await tx.wait();
    console.log("Cross chain handler set in HemDealer");

    // Update contract addresses
    const fs = require("fs");
    const contractAddresses = JSON.parse(
      fs.readFileSync("contracts/contractAddresses.json")
    );
    
    contractAddresses.polygon_amoy = {
      HemDealer: hemDealer.address,
      HemDealerCrossChain: hemDealerCrossChain.address,
      AcrossRouter: "0xC499a572640B64eA1C8c194c43Bc3E19940719dC"
    };

    fs.writeFileSync(
      "contracts/contractAddresses.json",
      JSON.stringify(contractAddresses, null, 2)
    );

    console.log("Deployment completed successfully!");
  } catch (error) {
    console.error("Deployment failed with error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
