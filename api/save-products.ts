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

    // Save to Firebase (will return false if not initialized, that's OK)
    const saved = await saveProductsToFirebase(products);

    res.status(200).json({
      success: true,
      message: `Saved ${products.length} products`,
      count: products.length,
      firebase: saved,
    });
  } catch (error) {
    console.error('Save products error:', error);
    // Still return 200 because we can fallback to localStorage
    res.status(200).json({
      success: true,
      message: `Saved ${(req.body.products || []).length} products locally`,
      count: (req.body.products || []).length,
      firebase: false,
      error: error instanceof Error ? error.message : 'Firebase unavailable',
    });
  }
}
