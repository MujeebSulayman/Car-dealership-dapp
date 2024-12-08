export const CHAIN_DATA = {
  ARBITRUM: {
    id: 421614,
    name: 'Arbitrum',
    logo: 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    status: 'commingSoon'
  },
  BASE: {
    id: 84532,
    name: 'Base',
    logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjEyOCIgY3k9IjEyOCIgcj0iMTI4IiBmaWxsPSIjMDUyNTJEIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTI3Ljk5OSA1NS45OTk5QzEyNy45OTkgNTUuOTk5OSAxNjcuOTk5IDExNiAxNjcuOTk5IDEzNkMxNjcuOTk5IDE1NiAxNDcuOTk5IDE3NiAxMjcuOTk5IDE3NkMxMDcuOTk5IDE3NiA4Ny45OTkgMTU2IDg3Ljk5OSAxMzZDODcuOTk5IDExNiAxMjcuOTk5IDU1Ljk5OTkgMTI3Ljk5OSA1NS45OTk5WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
    rpcUrl: 'https://goerli.base.org',
    status: 'commingSoon'
  },
  BLAST: {
    id: 168587773,
    name: 'Blast',
    logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjEyOCIgY3k9IjEyOCIgcj0iMTI4IiBmaWxsPSIjMEYwRjBGIi8+CjxwYXRoIGQ9Ik0xNzguMzMzIDEyOEwxMjggNzcuNjY2N0w3Ny42NjY3IDEyOEwxMjggMTc4LjMzM0wxNzguMzMzIDEyOFoiIGZpbGw9IiNGRjAwNzQiLz4KPC9zdmc+Cg==',
    rpcUrl: 'https://sepolia.blast.io',
    status: 'commingSoon'
  },
  ETHEREUM: {
    id: 11155111,
    name: 'Sepolia',
    logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    rpcUrl: 'https://rpc.sepolia.org',
    status: 'available'
  },
  OPTIMISM: {
    id: 11155420,
    name: 'Optimism',
    logo: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png',
    rpcUrl: 'https://sepolia.optimism.io',
    status: 'commingSoon'
  },
  POLYGON: {
    id: 80002,
    name: 'Polygon',
    logo: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
    rpcUrl: 'https://amoy.polygonscan.com/',
    status: 'available'
  }
} as const