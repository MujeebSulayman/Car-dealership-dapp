import type { NextApiRequest, NextApiResponse } from 'next'
import { ethers } from 'ethers'

type QuoteResponse = {
  relayerFeeInUnits?: string
  relayerFeePct?: number
  inputAmount?: string
  error?: string
  message?: string
  outputAmount?: string
  timestamp?: number
  destinationChainId?: string
  originChainId?: string
  details?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QuoteResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { 
      amount, 
      destinationChainId, 
      originChainId 
    } = req.body

    // Basic validation
    if (!amount || !destinationChainId || !originChainId) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    // Mock quote generation
    const inputAmount = BigInt(amount)
    const relayerFeePct = 100 // 1% (integer basis points)
    const feeAmount = inputAmount * BigInt(relayerFeePct) / BigInt(10000)
    const outputAmount = inputAmount + feeAmount

    return res.status(200).json({
      inputAmount: amount,
      outputAmount: outputAmount.toString(),
      relayerFeePct: 1, // 1% as integer
      relayerFeeInUnits: feeAmount.toString(), // Actual fee in units
      timestamp: Math.floor(Date.now() / 1000),
      destinationChainId: destinationChainId,
      originChainId: originChainId
    })
  } catch (error) {
    console.error('Across Quote API Error:', error)
    return res.status(500).json({ 
      error: 'Failed to generate quote', 
      details: error instanceof Error ? error.message : 'Unknown error',
      relayerFeePct: 1, // Default safe value
      inputAmount: req.body.amount // Return original amount
    })
  }
}
