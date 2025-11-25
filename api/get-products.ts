import { VercelRequest, VercelResponse } from '@vercel/node';
import { getProductsFromFirebase } from './firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let products = await getProductsFromFirebase();

    res.status(200).json({
      success: true,
      count: products.length,
      products: products,
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      error: 'Failed to retrieve products',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
