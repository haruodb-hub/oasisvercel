import { VercelRequest, VercelResponse } from '@vercel/node';
import { saveProductsToFirebase } from './firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { products } = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Products must be an array' });
    }

    // Save to Firebase
    const saved = await saveProductsToFirebase(products);

    res.status(200).json({
      success: true,
      message: `Saved ${products.length} products`,
      count: products.length,
      firebase: saved,
    });
  } catch (error) {
    console.error('Save products error:', error);
    res.status(500).json({
      error: 'Failed to save products',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
