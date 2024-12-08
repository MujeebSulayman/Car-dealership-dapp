export const chainConfig = {
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
    contracts: {
      HemDealer: '0x27ac084312e314837ac262999dc53e19d037C7b2',
      HemDealerCrossChain: '0x702a8cBFBEF7b4e25054549e945559666cDdD476',
      AcrossRouter: '0xC499a572640B64eA1C8c194c43Bc3E19940719dC'
    },
    explorer: 'https://sepolia.etherscan.io'
  }
}
