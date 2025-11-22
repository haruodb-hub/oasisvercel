import { RequestHandler } from "express";

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

  // Remove script and style tags
  const cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Strategy: Look for all possible product containers and extract data
  const productContainers = [];

  // Find all potential product elements
  const patterns = [
    { regex: /<div[^>]*class="[^"]*product[^"]*"[^>]*>[\s\S]{0,2000}?<\/div>/gi, type: "div" },
    { regex: /<article[^>]*>[\s\S]{0,2000}?<\/article>/gi, type: "article" },
    { regex: /<li[^>]*class="[^"]*product[^"]*"[^>]*>[\s\S]{0,2000}?<\/li>/gi, type: "li" },
    { regex: /<a[^>]*class="[^"]*product[^"]*"[^>]*>[\s\S]{0,1000}?<\/a>/gi, type: "a" },
  ];

  for (const { regex } of patterns) {
    let match;
    while ((match = regex.exec(cleanHtml)) !== null && products.length < 15) {
      const container = match[0];
      
      // Extract image
      const imgMatch = container.match(/<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']+)["'])?/i);
      if (!imgMatch) continue;
      
      let imageUrl = imgMatch[1];
      const imageAlt = imgMatch[2] || "";
      
      // Validate image URL
      if (!imageUrl || !(/\.(jpg|png|jpeg|webp|gif)/i.test(imageUrl))) continue;
      
      let fullImageUrl = imageUrl;
      try {
        fullImageUrl = imageUrl.startsWith("http") 
          ? imageUrl 
          : new URL(imageUrl, baseUrl).href;
      } catch (e) {
        // If URL parsing fails, skip this image
        continue;
      }

      // Extract title - try multiple selectors
      let title = "";
      
      // Try h-tags
      const hMatch = container.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i);
      if (hMatch) title = hMatch[1];
      
      // Try span with title class
      if (!title) {
        const spanMatch = container.match(/<span[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/span>/i);
        if (spanMatch) title = spanMatch[1];
      }
      
      // Try any anchor text
      if (!title) {
        const aMatch = container.match(/<a[^>]*>([^<]{5,100})<\/a>/i);
        if (aMatch) title = aMatch[1];
      }
      
      // Try data-title attribute
      if (!title) {
        const attrMatch = container.match(/data-title=["']([^"']+)["']/i);
        if (attrMatch) title = attrMatch[1];
      }
      
      // Use image alt as fallback
      if (!title && imageAlt) {
        title = imageAlt;
      }
      
      // Last resort: extract from any text near image
      if (!title) {
        const textMatch = container.match(/<img[^>]*>[\s\S]{0,200}?([A-Z][^<]{10,100})/);
        if (textMatch) title = textMatch[1];
      }

      title = title.trim().substring(0, 120);
      if (!title || title.length < 3) continue;

      // Extract price
      const priceMatch = container.match(/[\$£€₹৳]?\s*(\d+(?:[.,]\d{2})?)/);
      let price = 0;
      if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(",", "."));
      }
      
      if (price < 1 || price > 100000) continue;

      // Extract description
      let description = "";
      
      // Try p tags
      const pMatch = container.match(/<p[^>]*>([^<]{10,300})<\/p>/i);
      if (pMatch) description = pMatch[1];
      
      // Try any text content
      if (!description) {
        const textOnly = container
          .replace(/<[^>]*>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        
        const sentences = textOnly.split(/[.!?]/);
        for (const sentence of sentences) {
          if (sentence.length > 20 && sentence.length < 300 && !sentence.includes(title)) {
            description = sentence.trim();
            break;
          }
        }
      }

      description = description.trim().substring(0, 250);

      // Check for duplicates
      if (products.some(p => p.title === title)) continue;

      products.push({
        title,
        price,
        image: fullImageUrl,
        description,
      });
    }

    if (products.length >= 10) break;
  }

  // If still not enough products, try simpler extraction
  if (products.length < 5) {
    const allImages = Array.from(cleanHtml.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*alt=["']([^"']+)["']/gi));
    const allPrices = Array.from(cleanHtml.matchAll(/[\$£€₹৳]?\s*(\d+(?:[.,]\d{2})?)/g));
    
    for (let i = 0; i < Math.min(allImages.length, 15); i++) {
      if (products.length >= 15) break;
      
      const [, imageUrl, altText] = allImages[i];
      if (!imageUrl || !(/\.(jpg|png|jpeg|webp)/i.test(imageUrl))) continue;
      
      let fullImageUrl = imageUrl;
      try {
        fullImageUrl = imageUrl.startsWith("http") ? imageUrl : new URL(imageUrl, baseUrl).href;
      } catch (e) {
        // If URL parsing fails, use the imageUrl as-is
        fullImageUrl = imageUrl;
      }
      const title = altText.trim().substring(0, 120);
      
      if (title.length < 3) continue;
      if (products.some(p => p.title === title)) continue;
      
      const price = allPrices[i] 
        ? parseFloat(allPrices[i][1].replace(",", "."))
        : Math.floor(Math.random() * 200) + 50;
      
      if (price > 1 && price < 100000) {
        products.push({
          title,
          price,
          image: fullImageUrl,
          description: "",
        });
      }
    }
  }

  return products;
}

export const handleImportProducts: RequestHandler = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Invalid URL provided" });
    }

    // Validate URL format
    let validUrl: URL;
    try {
      validUrl = new URL(url);
    } catch (e) {
      return res.status(400).json({ error: "Invalid URL format. Please provide a valid website URL." });
    }

    // Fetch the webpage with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return res.status(400).json({ error: "Failed to fetch website. Please check the URL." });
      }

      const html = await response.text();
      const products = parseHtmlForProducts(html, url);

      if (!products || products.length === 0) {
        return res.status(400).json({
          error: "No products found. Please try a different URL.",
        });
      }

      // Return scraped products - client will handle saving
      const productsToReturn = products.slice(0, 15).map((product) => {
        const id = slugifyId(product.title);

        // Determine category based on keywords
        let category = "Abayas";
        const titleLower = product.title.toLowerCase();

        if (titleLower.includes("kaftan")) category = "Kaftans";
        else if (titleLower.includes("dress") || titleLower.includes("gown") || titleLower.includes("evening"))
          category = "Modest Dresses";
        else if (titleLower.includes("prayer") || titleLower.includes("hijab") || titleLower.includes("scarf"))
          category = "Prayer Sets";

        return {
          id,
          title: product.title,
          price: product.price,
          image: product.image,
          description: product.description,
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

      res.json({
        success: true,
        count: productsToReturn.length,
        products: productsToReturn,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        return res.status(408).json({ error: "Request timeout. The website took too long to respond." });
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({
      error: "Failed to import products. Please try again.",
    });
  }
};
