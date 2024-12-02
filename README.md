# HemDealer: Cross-Chain Car Marketplace

![HemDealer Hero](public/images/assets/hero-banner.png)

HemDealer is a decentralized application (DApp) designed for buying, selling, and managing cars in a cross-chain environment. Built using Solidity, it leverages the Ethereum blockchain, ERC721 standards, and the Across Protocol to facilitate seamless transactions across different blockchain networks.

![Solidity](https://img.shields.io/badge/Solidity-0.8.19-blue)
![Ethereum](https://img.shields.io/badge/Ethereum-Enabled-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Across Protocol](https://img.shields.io/badge/Across-Integrated-purple)

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [Setup & Installation](#setup--installation)
- [Deployment](#deployment)
- [Usage](#usage)
- [Testing](#testing)
- [Contributing](#contributing)

## Features

### Core Features
- **NFT Car Listings:** Tokenize vehicles as ERC721 NFTs with comprehensive metadata
- **Cross-Chain Transfers:** Seamless vehicle transfers between different blockchain networks using Across Protocol
- **Native Token Payments:** Support for ETH and network native tokens
- **Secure Ownership:** ERC721-based ownership management with cross-chain verification
- **Advanced Search:** Filter cars by make, model, year, and other attributes
- **Event Tracking:** Comprehensive event logging for all marketplace activities

### Car Management
- **Detailed Car Profiles:** Comprehensive vehicle information including:
  - Basic details (make, model, year, VIN)
  - Technical specifications
  - Multiple image support
  - Condition assessment
  - Price history
- **Listing Management:** Create, update, and delete car listings
- **Ownership History:** Track all previous owners and sales

### Security Features
- **ReentrancyGuard Protection:** Prevent reentrancy attacks
- **Cross-Chain Verification:** Secure message verification via Across Protocol
- **Slippage Protection:** Maximum 0.5% slippage tolerance
- **Transfer Timeout:** 24-hour safety window for cross-chain transfers
- **Access Controls:** Role-based permissions system
- **Payment Validation:** Automatic payment verification and processing

### Seller Features
- **Seller Profiles:** Detailed seller information and history
- **Multiple Listings:** Manage multiple car listings
- **Sales Analytics:** Track listing performance and sales history
- **Cross-Chain Management:** List cars on multiple chains

### Buyer Features
- **Secure Payments:** Protected native token transactions
- **Cross-Chain Shopping:** Browse and buy cars across different networks
- **Purchase History:** Track all vehicle purchases
- **Transfer Tracking:** Real-time cross-chain transfer status

### Technical Features
- **Gas Optimization:** Efficient contract design for lower transaction costs
- **Event Logging:** Comprehensive event emission for frontend tracking
- **Upgradeable Design:** Modular contract architecture
- **Bridge Integration:** Seamless Across Protocol integration
- **Batch Operations:** Support for multiple car operations
- **Emergency Controls:** Admin functions for emergency situations

## Architecture

### Core Components

1. **Smart Contracts**
   - `HemDealer.sol`: Main marketplace contract (ERC721)
   - `HemDealerCrossChain.sol`: Cross-chain transfer handler
   - Across Protocol integration for secure cross-chain messaging

2. **Frontend Integration**
   - Web3 provider integration (ethers.js)
   - MetaMask and Rainbow Wallet support
   - Real-time transaction tracking
   - Responsive UI for car listings

## Smart Contracts

### HemDealer.sol
Primary marketplace contract handling:
- Car listings and sales
- Ownership management (ERC721)
- Payment processing
- Cross-chain coordination

### HemDealerCrossChain.sol
Manages cross-chain operations:
- Transfer initiation and completion
- Message verification via Across Protocol
- Payment bridging
- Timeout handling (24-hour safety)

## Setup & Installation

1. Clone the repository:
```bash
git clone https://github.com/MujeebSulayman/Car-dealership-dapp.git
cd Car-dealership-dapp
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```plaintext
# RPC and API Keys
NEXT_PUBLIC_RPC_URL=your_sepolia_rpc_url
NEXT_PUBLIC_ALCHEMY_ID=your_alchemy_id
PRIVATE_KEY=your_private_key

# Across Protocol Addresses (Sepolia)
ACROSS_ROUTER_ADDRESS=0xC499a572640B64eA1C8c194c43Bc3E19940719dC
ACROSS_SPOKE_POOL_ADDRESS=0x7376B2F28E58a7E7103d4185daC1e2c0E272C8A9
```

## Deployment

1. Deploy to Sepolia testnet:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

2. Verify contracts:
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> "HemDealer" "HEMD"
```

## Usage

### Listing a Car
```typescript
const listCar = async (car: CarParams) => {
  const contract = await getEthereumContract()
  await contract.listCar(
    car.basicDetails,
    car.technicalDetails,
    car.additionalInfo,
    car.sellerDetails,
    car.destinationChainId,
    car.paymentToken
  )
}
```

### Cross-Chain Transfer
```typescript
const transfer = async (carId: number, destinationChain: number) => {
  // Get quote from Across Protocol
  const quote = await getAcrossQuote(amount, destinationChain)
  
  const contract = await getCrossChainContract()
  await contract.initiateCrossChainTransfer(
    carId,
    destinationChain,
    quote.relayerFeePct,
    quote.quoteTimestamp
  )
}
```

## Testing

Run the test suite:
```bash
npx hardhat test
```

Generate coverage report:
```bash
npx hardhat coverage
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Socials

- [X (Twitter)](https://x.com/TheHemjay)
- [GitHub](https://github.com/MujeebSulayman)

## Security Features

- ReentrancyGuard implementation
- Ownership validation
- Cross-chain message verification
- Slippage protection (0.5% max)
- Transfer timeout (24 hours)
- Comprehensive access controls

## License

MIT License - see LICENSE.md for details
