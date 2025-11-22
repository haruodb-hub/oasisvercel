import ProductCard, { type Product } from "@/components/site/ProductCard";
import { Link } from "react-router-dom";
import { getContent } from "@/lib/cms";
import { getProducts } from "@/lib/catalog";
import { buildSrcSet } from "@/lib/utils";

const featured = getProducts()
  .filter((p) => p.isBestSeller || p.isNew || p.onSale)
  .slice(0, 4)
  .map((p) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    image: p.image,
    badge: p.isBestSeller
      ? "Bestseller"
      : p.isNew
        ? "New"
        : p.onSale
          ? "Sale"
          : undefined,
  }));

export default function Index() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border">
        <div className="relative grid grid-cols-1 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <img
              src={getContent(
                "hero_image",
                "https://images.pexels.com/photos/9880859/pexels-photo-9880859.jpeg",
              )}
              srcSet={buildSrcSet(
                getContent(
                  "hero_image",
                  "https://images.pexels.com/photos/9880859/pexels-photo-9880859.jpeg",
                )
              )}
              alt="Hero"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              sizes="100vw"
              className="h-[420px] w-full object-cover md:h-full"
            />
          </div>
          <div className="order-1 flex flex-col justify-center gap-6 bg-gradient-to-b from-primary/5 to-accent/10 p-8 md:order-2 md:p-12">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              New Season • SS25
            </span>
            <h1 className="font-['Playfair Display'] text-4xl font-extrabold tracking-tight md:text-5xl">
              {getContent(
                "hero_title",
                "Luxury Abayas Crafted for Royal Elegance",
              )}
            </h1>
            <p className="max-w-prose text-muted-foreground">
              {getContent(
                "hero_subtitle",
                "Discover exquisite abayas and modest wear blending timeless design with modern tailoring. Premium fabrics, handcrafted details, and silhouettes inspired by royalty.",
              )}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Shop Now
              </Link>
              <Link
                to="/new"
                className="inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-semibold"
              >
                Explore New Arrivals
              </Link>
            </div>
            <div className="flex items-center gap-6 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="inline-block h-6 w-6 rounded-full bg-amber-500/20 ring-1 ring-amber-500" />
                Premium Quality
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <span className="inline-block h-6 w-6 rounded-full bg-primary/20 ring-1 ring-primary" />
                Free Express Shipping
              </div>
              <div className="hidden items-center gap-2 md:flex">
                <span className="inline-block h-6 w-6 rounded-full bg-accent/20 ring-1 ring-accent" />
                30-Day Returns
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured categories */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-['Playfair Display'] text-2xl font-extrabold tracking-tight md:text-3xl">
            Featured Categories
          </h2>
          <Link
            to="/shop"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {[
            {
              title: getContent("cat1_title", "Abayas"),
              img: getContent("cat1_image", "https://images.pexels.com/photos/9880839/pexels-photo-9880839.jpeg"),
            },
            {
              title: getContent("cat2_title", "Kaftans"),
              img: getContent("cat2_image", "https://images.pexels.com/photos/18958578/pexels-photo-18958578.jpeg"),
            },
            {
              title: getContent("cat3_title", "Modest Dresses"),
              img: getContent("cat3_image", "https://images.pexels.com/photos/4678387/pexels-photo-4678387.jpeg"),
            },
            {
              title: getContent("cat4_title", "Prayer Sets"),
              img: getContent("cat4_image", "https://images.pexels.com/photos/7956906/pexels-photo-7956906.jpeg"),
            },
          ].map((c) => (
            <Link
              key={c.title}
              to="/shop"
              className="group overflow-hidden rounded-xl border"
            >
              <div className="relative aspect-[4/5] w-full">
                <img
                  src={c.img}
                  srcSet={buildSrcSet(c.img)}
                  alt={c.title}
                  loading="lazy"
                  decoding="async"
                  sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <div className="text-sm uppercase tracking-wider text-white/80">
                    Category
                  </div>
                  <div className="text-lg font-semibold">{c.title}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-['Playfair Display'] text-2xl font-extrabold tracking-tight md:text-3xl">
            Featured Pieces
          </h2>
          <Link
            to="/shop"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Shop all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Banner */}
      <section className="overflow-hidden rounded-2xl border">
        <div className="relative">
          <img
            src={getContent(
              "banner_image",
              "https://images.pexels.com/photos/1667451/pexels-photo-1667451.jpeg",
            )}
            srcSet={buildSrcSet(
              getContent(
                "banner_image",
                "https://images.pexels.com/photos/1667451/pexels-photo-1667451.jpeg",
              )
            )}
            alt="Banner"
            loading="lazy"
            decoding="async"
            sizes="100vw"
            className="h-72 w-full object-cover md:h-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="px-8 text-white md:px-12">
              <h3 className="font-['Playfair Display'] text-2xl font-extrabold tracking-tight md:text-3xl">
                {getContent("banner_title", "Crafted by Artisans")}
              </h3>
              <p className="mt-2 max-w-xl text-white/80">
                {getContent(
                  "banner_text",
                  "Every piece is meticulously designed and hand-finished using premium fabrics. Experience luxury that lasts beyond seasons.",
                )}
              </p>
              <Link
                to="/about"
                className="mt-4 inline-flex items-center justify-center rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm"
              >
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & newsletter */}
      <section className="grid gap-8 md:grid-cols-2">
        <div className="grid gap-4 rounded-2xl border p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Quality Guarantee</div>
              <p className="text-sm text-muted-foreground">
                Premium materials and impeccable craftsmanship. 30-day returns
                on all orders.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 3h18v18H3z" />
                <path d="M16 3v18" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Express Worldwide Shipping</div>
              <p className="text-sm text-muted-foreground">
                Complimentary express shipping on orders over ৳15,000. Duties
                included for select regions.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2l3 7h7l-5.5 4.2 2 7L12 17l-6.5 3.2 2-7L2 9h7z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">5-Star Rated</div>
              <p className="text-sm text-muted-foreground">
                Loved by thousands of customers around the world for fit, finish
                and feel.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border p-6 md:p-8">
          <div className="font-['Playfair Display'] text-2xl font-extrabold tracking-tight">
            Join the Circle
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Be first to know about new drops, exclusive collections and private
            sales.
          </p>
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="Enter your email"
              className="h-11 flex-1 rounded-md border bg-background px-3 text-sm"
            />
            <button className="inline-flex items-center justify-center rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
