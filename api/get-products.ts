import { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PRODUCTS_FILE = join(process.cwd(), 'products-data.json');

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let products = [];

    // Try to read from file first
    if (existsSync(PRODUCTS_FILE)) {
      try {
        const data = readFileSync(PRODUCTS_FILE, 'utf-8');
        products = JSON.parse(data);
      } catch (fileError) {
        console.warn('Could not read products file:', fileError);
      }
    }

    // Check memory cache as fallback
    if (products.length === 0 && (global as any).__products_cache) {
      products = (global as any).__products_cache;
    }

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
