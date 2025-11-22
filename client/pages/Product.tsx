import { useParams, Link, useNavigate } from "react-router-dom";
import { getProducts } from "@/lib/catalog";
import { useState } from "react";
import { useCart } from "@/store/cart";
import { formatCurrency } from "@/lib/money";
import { toast } from "sonner";
import { getStock } from "@/lib/inventory";
import { buildSrcSet } from "@/lib/utils";

export default function Product() {
  const { id } = useParams();
  const product = getProducts({ includeHidden: true }).find((p) => p.id === id);
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState<string | undefined>(product?.sizes?.[0]);
  const navigate = useNavigate();

  if (!product) {
    return (
      <div className="py-16 text-center">
        <div className="text-2xl font-semibold">Product not found</div>
        <Link
          to="/shop"
          className="mt-3 inline-block text-primary underline-offset-4 hover:underline"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  const stock =
    product.sizes && size
      ? getStock(product.id, size as any)
      : getStock(product.id as any);
  const canAdd = (stock ?? 0) > 0 && qty <= (stock ?? 0);
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="grid gap-3">
        <img
          src={product.image}
          srcSet={buildSrcSet(product.image)}
          alt={product.title}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          sizes="(min-width:768px) 50vw, 100vw"
          className="aspect-[4/5] w-full rounded-xl border object-cover"
        />
        {product.images?.slice(1).map((src) => (
          <img
            key={src}
            src={src}
            srcSet={buildSrcSet(src)}
            alt={product.title}
            loading="lazy"
            decoding="async"
            sizes="(min-width:768px) 50vw, 100vw"
            className="aspect-[4/5] w-full rounded-xl border object-cover"
          />
        ))}
      </div>
      <div className="space-y-6">
        <div>
          <h1 className="font-['Playfair Display'] text-3xl font-extrabold tracking-tight md:text-4xl">
            {product.title}
          </h1>
          <div className="mt-2 text-2xl font-semibold">
            {formatCurrency(product.price)}
          </div>
        </div>
        <p className="text-muted-foreground">{product.description}</p>
        {product.sizes && (
          <div>
            <div className="mb-2 text-sm font-medium">Size</div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSize(s);
                    setQty(1);
                  }}
                  className={`rounded-md border px-3 py-2 text-sm ${size === s ? "border-primary" : ""}`}
                >
                  {s}
                </button>
              ))}
            </div>
            {size && (
              <div className="mt-2 text-xs text-muted-foreground">
                In stock: {stock}
              </div>
            )}
          </div>
        )}
        <div>
          <div className="mb-2 text-sm font-medium">Quantity</div>
          <div className="inline-flex items-center gap-2 rounded-md border px-2 py-1">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Decrease"
              className="px-2 py-1"
            >
              -
            </button>
            <span className="min-w-6 text-center">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(stock ?? 99, q + 1))}
              aria-label="Increase"
              className="px-2 py-1"
            >
              +
            </button>
          </div>
          {stock !== undefined && stock <= 0 && (
            <div className="mt-2 text-xs text-destructive">Out of stock</div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            disabled={!canAdd}
            onClick={() => {
              add(product.id, qty, size);
              toast.success("Added to cart");
            }}
            className="inline-flex flex-1 items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Add to Cart
          </button>
          <button
            disabled={!canAdd}
            onClick={() => {
              add(product.id, qty, size);
              navigate("/checkout");
            }}
            className="inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-semibold disabled:opacity-50"
          >
            Buy Now (COD/Manual)
          </button>
        </div>
        <div className="text-sm text-muted-foreground">
          Free express shipping on orders over ৳15,000 • 30-day returns
        </div>
      </div>
    </div>
  );
}
