<p align="center">
  <img src="https://user-images.githubusercontent.com/26466516/107675802-36216b80-6c77-11eb-8db1-4d3407dc53d9.png" alt="Next.js and TypeScript">
</p>

<p align="center">
  <img src="https://img.shields.io/static/v1?label=PRs&message=welcome&style=for-the-badge&color=24B36B&labelColor=000000" alt="PRs welcome!" />
  <img alt="License" src="https://img.shields.io/github/license/chhpt/typescript-nextjs-starter?style=for-the-badge&color=24B36B&labelColor=000000">
</p>

<br>

# HemDealer - Cross-Chain Car Dealership DApp

A decentralized car dealership platform built on blockchain technology, enabling cross-chain car listings and transactions. The platform supports multiple payment tokens and features a comprehensive car management system.

## Features

- **Cross-Chain Compatibility**: List and trade cars across different blockchain networks
- **Multiple Payment Options**: Support for ETH and various ERC20 tokens
- **Comprehensive Car Listings**: Detailed car information including:
  - Basic details (name, make, model, year, VIN)
  - Technical specifications (mileage, condition, transmission, fuel type)
  - Additional information (location, features, seller details)
- **Smart Contract Security**:
  - Reentrancy protection
  - Access control mechanisms
  - Slippage protection (0.5% max)
  - Cross-chain transfer timeout safety

## Tech Stack

- **Frontend**: Next.js 13, React 18, Tailwind CSS
- **Blockchain**: Solidity 0.8.19, Hardhat
- **Libraries**: 
  - OpenZeppelin Contracts
  - Ethers.js
  - Redux Toolkit

## Dependencies

Install these prerequisites:
- Node.js & NPM: https://nodejs.org
- Hardhat: https://hardhat.org/
- Ethers.js: https://ethers.org/
- Tailwind CSS: https://tailwindcss.com/

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/YourUsername/hem-dealer-dapp.git
```

2. Install dependencies:
```bash
cd hem-dealer-dapp
yarn install
```

3. Start Hardhat node:
```bash
yarn hardhat node
```

4. Deploy contracts:
```bash
yarn hardhat run scripts/deploy.js --network localhost
```

5. Start the frontend:
```bash
yarn dev
```

Visit: http://localhost:3000

## Smart Contract Features

### Car Management
- List new cars with detailed information
- Update existing car listings
- Delete car listings
- View individual and all car listings

### Sales Features
- Purchase cars using ETH or supported ERC20 tokens
- Cross-chain transfers with built-in safety mechanisms
- View all sales history

### Cross-Chain Functionality
- Initiate cross-chain transfers
- Complete cross-chain transfers
- Cancel timed-out transfers
- Bridge assets using Across Protocol

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

 