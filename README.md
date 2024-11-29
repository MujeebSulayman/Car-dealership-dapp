# HemDealer - Cross-Chain NFT Vehicle Marketplace

A decentralized marketplace for tokenizing and trading vehicles across multiple blockchain networks, powered by the Across Protocol for secure cross-chain transactions.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Solidity](https://img.shields.io/badge/Solidity-0.8.19-blue)
![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-4.x-blue)

## Overview

HemDealer is a sophisticated smart contract system that enables:
- Vehicle tokenization as NFTs (ERC721)
- Cross-chain vehicle listings and transfers
- Multi-token payment support
- Secure ownership management
- Comprehensive vehicle metadata storage

## Technical Architecture

### Core Components

1. **Token Standards**
   - ERC721 for NFT functionality
   - ERC20 for payment tokens
   - SafeERC20 for secure token transfers

2. **Security Features**
   - OpenZeppelin's ReentrancyGuard
   - Ownable access control
   - Cross-chain message verification
   - Slippage protection (0.5% max)
   - Transfer timeout mechanisms (24 hours)

3. **Data Structures**
