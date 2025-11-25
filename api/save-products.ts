import { VercelRequest, VercelResponse } from '@vercel/node';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PRODUCTS_FILE = join(process.cwd(), 'products-data.json');

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { products } = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Products must be an array' });
    }

    // Save to file (will be lost on redeploy, but temporary storage works)
    try {
      writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
    } catch (fileError) {
      console.warn('Could not write to filesystem:', fileError);
      // Fall back to memory storage (not persistent)
    }

    // Store in memory for current instance
    (global as any).__products_cache = products;

    res.status(200).json({
      success: true,
      message: `Saved ${products.length} products`,
      count: products.length,
    });
  } catch (error) {
    console.error('Save products error:', error);
    res.status(500).json({
      error: 'Failed to save products',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
