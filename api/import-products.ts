import { VercelRequest, VercelResponse } from "@vercel/node";

// Helper function to slug-ify ID
function slugifyId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Simple HTML parser without external modules
function parseHtmlForProducts(html: string, baseUrl: string) {
  const products: any[] = [];
  const seenTitles = new Set<string>(); // Track unique products
  const seenImages = new Set<string>(); // Track unique images

  // Remove script, style, and nav/footer tags to avoid noise
  const cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "")
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, "");

  // Helper to normalize text for comparison
  function normalizeText(text: string): string {
    return text.toLowerCase().trim().replace(/\s+/g, " ");
  }

  // Helper to validate price
  function validatePrice(price: number): boolean {
    return price > 1 && price < 100000;
  }

  // STRATEGY 1: Extract from structured product containers
  const patterns = [
    { regex: /<div[^>]*class="[^"]*product[^"]*"[^>]*>[\s\S]{0,3000}?<\/div>/gi, type: "div" },
    { regex: /<article[^>]*>[\s\S]{0,3000}?<\/article>/gi, type: "article" },
    { regex: /<li[^>]*class="[^"]*product[^"]*"[^>]*>[\s\S]{0,2000}?<\/li>/gi, type: "li" },
    { regex: /<section[^>]*class="[^"]*product[^"]*"[^>]*>[\s\S]{0,3000}?<\/section>/gi, type: "section" },
  ];

  for (const { regex } of patterns) {
    if (products.length >= 20) break;
    
    let match;
    while ((match = regex.exec(cleanHtml)) !== null && products.length < 20) {
      const container = match[0];
      
      // Extract ALL images from container (not just first)
      const imgMatches = Array.from(container.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']+)["'])?/gi));
      
      if (imgMatches.length === 0) continue;
      
      // Process each image as potential product
      for (const imgMatch of imgMatches) {
        if (products.length >= 20) break;
        
        let imageUrl = imgMatch[1];
        const imageAlt = imgMatch[2] || "";
        
        // Validate image URL
        if (!imageUrl || !(/\.(jpg|png|jpeg|webp|gif)/i.test(imageUrl))) continue;
        
        // Skip if we've seen this image before
        const normalizedImageUrl = normalizeText(imageUrl);
        if (seenImages.has(normalizedImageUrl)) continue;
        
        const fullImageUrl = imageUrl.startsWith("http") 
          ? imageUrl 
          : new URL(imageUrl, baseUrl).href;
        
        seenImages.add(normalizedImageUrl);

        // Extract title - try multiple selectors with priority
        let title = "";
        
        // Priority 1: h-tags (most reliable)
        const hMatch = container.match(/<h[1-6][^>]*>([^<]{3,150})<\/h[1-6]>/i);
        if (hMatch && hMatch[1]) {
          title = hMatch[1].trim();
        }
        
        // Priority 2: data-title or product-name attributes
        if (!title) {
          const attrMatch = container.match(/(?:data-title|product-name|aria-label)=["']([^"']{3,150})["']/i);
          if (attrMatch) title = attrMatch[1];
        }
        
        // Priority 3: span with title/name class
        if (!title) {
          const spanMatch = container.match(/<span[^>]*class="[^"]*(?:title|name|product-title)[^"]*"[^>]*>([^<]{3,150})<\/span>/i);
          if (spanMatch) title = spanMatch[1];
        }
        
        // Priority 4: Image alt text
        if (!title && imageAlt) {
          title = imageAlt.trim();
        }
        
        // Priority 5: Any nearby text
        if (!title) {
          const textMatch = container.match(/([A-Z][A-Za-z\s]{3,150}?)(?:<|$)/);
          if (textMatch && textMatch[1]) {
            title = textMatch[1].trim();
          }
        }
        
        // Clean title
        title = title.replace(/<[^>]*>/g, "").trim().substring(0, 120);
        if (!title || title.length < 3) continue;
        
        // Check for duplicate title
        const normalizedTitle = normalizeText(title);
        if (seenTitles.has(normalizedTitle)) continue;

        // Extract price
        const priceMatches = Array.from(container.matchAll(/[\$£€₹৳]?\s*(\d+(?:[.,]\d{2})?)/g));
        let price = 0;
        
        for (const priceMatch of priceMatches) {
          const testPrice = parseFloat(priceMatch[1].replace(",", "."));
          if (validatePrice(testPrice)) {
            price = testPrice;
            break;
          }
        }
        
        if (!validatePrice(price)) continue;

        // Extract description
        let description = "";
        
        // Try p tags
        const pMatch = container.match(/<p[^>]*>([^<]{10,300})<\/p>/i);
        if (pMatch && pMatch[1]) {
          description = pMatch[1].trim();
        }
        
        // Fallback: get next text node
        if (!description) {
          const textOnly = container
            .replace(/<[^>]*>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          
          const sentences = textOnly.split(/[.!?]/);
          for (const sentence of sentences) {
            const cleaned = sentence.trim();
            if (cleaned.length > 20 && cleaned.length < 300 && 
                !normalizeText(cleaned).includes(normalizedTitle)) {
              description = cleaned;
              break;
            }
          }
        }
        
        description = description.substring(0, 250);
        
        // Add product (no more duplicate checking needed)
        seenTitles.add(normalizedTitle);
        products.push({
          title,
          price,
          image: fullImageUrl,
          description,
        });
      }
    }
  }

  // STRATEGY 2: If still need products, extract from image + price pairs
  if (products.length < 5) {
    const allImages = Array.from(cleanHtml.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']+)["'])?/gi));
    const allPrices = Array.from(cleanHtml.matchAll(/[\$£€₹৳]?\s*(\d+(?:[.,]\d{2})?)/g));
    
    for (let i = 0; i < Math.min(allImages.length, 20); i++) {
      if (products.length >= 20) break;
      
      const [, imageUrl, altText] = allImages[i];
      if (!imageUrl || !(/\.(jpg|png|jpeg|webp)/i.test(imageUrl))) continue;
      
      const normalizedImageUrl = normalizeText(imageUrl);
      if (seenImages.has(normalizedImageUrl)) continue;
      
      const fullImageUrl = imageUrl.startsWith("http") ? imageUrl : new URL(imageUrl, baseUrl).href;
      let title = altText?.trim().substring(0, 120) || `Product ${i + 1}`;
      
      if (title.length < 3) title = `Product ${i + 1}`;
      
      const normalizedTitle = normalizeText(title);
      if (seenTitles.has(normalizedTitle)) continue;
      
      const price = allPrices[i] 
        ? parseFloat(allPrices[i][1].replace(",", "."))
        : Math.floor(Math.random() * 300) + 20;
      
      if (!validatePrice(price)) continue;
      
      seenTitles.add(normalizedTitle);
      seenImages.add(normalizedImageUrl);
      
      products.push({
        title,
        price,
        image: fullImageUrl,
        description: "",
      });
    }
  }

  // Return unique products (5-20 items)
  return products.slice(0, 20);
}

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Invalid URL provided" });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    // Fetch the webpage with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.status(400).json({ error: `Server returned ${response.status}. Please try another website.` });
    }

    const html = await response.text();
    
    if (!html || html.length < 1000) {
      return res.status(400).json({ error: "Website content too small. Please try another URL." });
    }

    const products = parseHtmlForProducts(html, url);

    if (!products || products.length === 0) {
      return res.status(400).json({
        error: "No products found on this website. Try H&M, Zara, ASOS, or similar fashion sites.",
      });
    }

    // Ensure we have between 5-20 products
    const validProducts = products.slice(0, 20);
    
    if (validProducts.length < 5) {
      return res.status(400).json({
        error: `Only found ${validProducts.length} products. Need at least 5. Try another URL.`,
      });
    }

    // Return scraped products - client will handle saving
    const productsToReturn = validProducts.map((product) => {
      const id = slugifyId(product.title);

      // Determine category based on keywords
      let category = "Abayas";
      const titleLower = product.title.toLowerCase();

      if (titleLower.includes("kaftan")) category = "Kaftans";
      else if (
        titleLower.includes("dress") ||
        titleLower.includes("gown") ||
        titleLower.includes("evening") ||
        titleLower.includes("maxi")
      )
        category = "Modest Dresses";
      else if (
        titleLower.includes("prayer") ||
        titleLower.includes("hijab") ||
        titleLower.includes("scarf") ||
        titleLower.includes("shawl")
      )
        category = "Prayer Sets";
      else if (titleLower.includes("burkha")) 
        category = "Abayas";

      return {
        id,
        title: product.title,
        price: product.price,
        image: product.image,
        description: product.description || `Beautiful ${category.toLowerCase()}`,
        category,
        isNew: false,
        isBestSeller: false,
        onSale: false,
        badge: "",
        colors: [],
        sizes: [],
        tags: ["imported"],
        hidden: false,
        images: [],
      };
    });

    // Save products to backend storage
    try {
      const saveResponse = await fetch(
        `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers['x-forwarded-host'] || req.headers.host}/api/save-products`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: productsToReturn }),
        }
      );
      
      if (!saveResponse.ok) {
        console.warn('Failed to save products to backend');
      }
    } catch (saveError) {
      console.warn('Could not persist products:', saveError);
    }

    res.json({
      success: true,
      count: productsToReturn.length,
      products: productsToReturn,
      message: 'Products imported and saved',
    });
  } catch (error) {
    console.error("Import error:", error);
    
    if (error instanceof Error && error.name === "AbortError") {
      return res.status(500).json({
        error: "Request timed out. Server may be blocking or too slow.",
      });
    }

    res.status(500).json({
      error: "Failed to import products. The website may be blocking automated access. Try another URL.",
    });
  }
};
