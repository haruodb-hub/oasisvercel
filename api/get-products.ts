import { VercelRequest, VercelResponse } from '@vercel/node';
import { getProductsFromFirebase } from './firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let products = await getProductsFromFirebase();

    // If Firebase returns empty, it might not be initialized
    // In that case, return empty (frontend will use localStorage)
    if (!Array.isArray(products)) {
      products = [];
    }

    res.status(200).json({
      success: true,
      count: products.length,
      products: products,
    });
  } catch (error) {
    console.error('Get products error:', error);
    // Return empty array instead of error
    res.status(200).json({
      success: false,
      count: 0,
      products: [],
      error: error instanceof Error ? error.message : 'Failed to retrieve products',
    });
  }
}
