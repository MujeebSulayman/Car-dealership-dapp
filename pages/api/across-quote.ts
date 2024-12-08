import type { NextApiRequest, NextApiResponse } from 'next'

type QuoteResponse = {
  relayerFeeInUnits?: string
  relayerFeePct?: number
  inputAmount?: string
  error?: string
  message?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QuoteResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const response = await fetch('https://across.to/api/v1/quote', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Across API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      return res.status(response.status).json({ 
        message: 'Failed to fetch quote from Across Protocol',
        error: errorText
      })
    }

    const data = await response.json()
    console.log('Quote response:', data)
    res.status(200).json(data)
  } catch (error) {
    console.error('Error in across quote API:', error)
    res.status(500).json({ 
      message: 'Failed to fetch quote from Across Protocol',
      error: error instanceof Error ? error.message : String(error)
    })
  }
}
