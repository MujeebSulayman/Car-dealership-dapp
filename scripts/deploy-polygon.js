const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy HemDealer
  const HemDealer = await ethers.getContractFactory("HemDealer");
  const hemDealer = await HemDealer.deploy();
  await hemDealer.deployed();
  console.log("HemDealer deployed to:", hemDealer.address);

  // Deploy HemDealerCrossChain
  const HemDealerCrossChain = await ethers.getContractFactory("HemDealerCrossChain");
  const hemDealerCrossChain = await HemDealerCrossChain.deploy(
    hemDealer.address,
    "0xC499a572640B64eA1C8c194c43Bc3E19940719dC" // Across Router address
  );
  await hemDealerCrossChain.deployed();
  console.log("HemDealerCrossChain deployed to:", hemDealerCrossChain.address);

  // Set cross chain handler in HemDealer
  await hemDealer.setCrossChainHandler(hemDealerCrossChain.address);
  console.log("Cross chain handler set in HemDealer");

  // Update contract addresses
  const fs = require("fs");
  const contractAddresses = JSON.parse(
    fs.readFileSync("contracts/contractAddresses.json")
  );
  
  contractAddresses.polygon = {
    HemDealer: hemDealer.address,
    HemDealerCrossChain: hemDealerCrossChain.address,
    AcrossRouter: "0xC499a572640B64eA1C8c194c43Bc3E19940719dC"
  };

  fs.writeFileSync(
    "contracts/contractAddresses.json",
    JSON.stringify(contractAddresses, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
