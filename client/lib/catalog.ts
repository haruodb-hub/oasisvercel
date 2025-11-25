import {
  products as baseProducts,
  type CatalogProduct,
  type Size,
} from "@/data/products";
import { slugify as slugifyBase } from "@/lib/cms";

export type ManagedProduct = CatalogProduct & { hidden?: boolean };

const KEY = "catalog_overrides";

export function loadOverrides(): ManagedProduct[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as ManagedProduct[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveOverrides(list: ManagedProduct[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getProducts(opts?: {
  includeHidden?: boolean;
}): CatalogProduct[] {
  const overrides = loadOverrides();
  const map = new Map<string, ManagedProduct>();
  baseProducts.forEach((p) => map.set(p.id, { ...p }));
  overrides.forEach((p) => map.set(p.id, p));
  const merged = Array.from(map.values());
  return merged.filter((p) =>
    opts?.includeHidden ? true : !(p as ManagedProduct).hidden,
  );
}

export function getProductById(id: string): CatalogProduct | undefined {
  return getProducts({ includeHidden: true }).find((p) => p.id === id);
}

export function listCategories(): CatalogProduct["category"][] {
  return Array.from(
    new Set(getProducts({ includeHidden: true }).map((p) => p.category)),
  );
}

export function searchProducts(query: string): CatalogProduct[] {
  const q = query.toLowerCase();
  return getProducts().filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q) ||
      (p.tags || []).some((t) => t.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q),
  );
}

export function upsertProduct(
  input: Partial<ManagedProduct> & { title: string; price: number },
): ManagedProduct[] {
  const list = loadOverrides();
  const id = input.id ? slugifyId(input.id) : slugifyId(input.title);
  const now: ManagedProduct = {
    ...(getProductById(id) || ({} as ManagedProduct)),
    ...input,
    id,
  } as ManagedProduct;
  const idx = list.findIndex((p) => p.id === id);
  if (idx >= 0) list[idx] = now;
  else list.unshift(now);
  saveOverrides(list);
  return list;
}

export function deleteProduct(id: string): ManagedProduct[] {
  const list = loadOverrides();
  const next = list.filter((p) => p.id !== id);
  saveOverrides(next);
  return next;
}

export function setHidden(id: string, hidden: boolean): ManagedProduct[] {
  const list = loadOverrides();
  const idx = list.findIndex((p) => p.id === id);
  if (idx >= 0) list[idx] = { ...list[idx], hidden };
  else list.unshift({ ...(getProductById(id) as ManagedProduct), hidden });
  saveOverrides(list);
  return list;
}

export function ensureSizes(sizes?: Size[] | string[]): Size[] | undefined {
  if (!sizes) return undefined;
  const clean = sizes
    .map((s) => String(s).toUpperCase().trim())
    .filter(Boolean) as Size[];
  return clean.length ? (clean as Size[]) : undefined;
}

export function exportOverrides(): ManagedProduct[] {
  return loadOverrides();
}

export function importOverrides(input: unknown): ManagedProduct[] {
  const arr = Array.isArray(input) ? (input as ManagedProduct[]) : [];
  const cleaned = arr
    .filter((p) => p && typeof p === "object")
    .map((p) => ({
      ...p,
      id: slugifyId((p as any).id || (p as any).title || "product"),
    })) as ManagedProduct[];
  saveOverrides(cleaned);
  return cleaned;
}

export function clearOverrides(): void {
  saveOverrides([]);
}

export async function syncFromServer(): Promise<void> {
  try {
    const response = await fetch("/api/get-products");
    if (!response.ok) return;
    
    const data = await response.json();
    if (data.products && Array.isArray(data.products)) {
      importOverrides(data.products);
    }
  } catch (error) {
    console.warn("Could not sync products from server:", error);
  }
}

export function slugifyId(s: string): string {
  return slugifyBase(s);
}
