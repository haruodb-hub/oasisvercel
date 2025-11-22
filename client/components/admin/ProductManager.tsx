import { useEffect, useMemo, useState } from "react";
import {
  getProducts,
  upsertProduct,
  deleteProduct,
  listCategories,
  setHidden,
  slugifyId,
  type ManagedProduct,
  exportOverrides,
  importOverrides,
  clearOverrides,
} from "@/lib/catalog";
import type { CatalogProduct } from "@/data/products";
import {
  getStock,
  setStock,
  exportInventory,
  importInventory,
  resetInventory,
} from "@/lib/inventory";

type Editable = ManagedProduct;

const EMPTY: Editable = {
  id: "",
  title: "",
  price: 0,
  image: "",
  images: [],
  description: "",
  category: "Abayas",
  isNew: false,
  isBestSeller: false,
  onSale: false,
  badge: "",
  colors: [],
  sizes: [],
  tags: [],
  hidden: false,
};

export default function ProductManager() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [editing, setEditing] = useState<Editable | null>(null);
  const [version, setVersion] = useState(0);

  const all = useMemo(() => getProducts({ includeHidden: true }), [version]);
  const categories = useMemo(() => ["all", ...listCategories()], [version]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "catalog_overrides") setVersion((v) => v + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return all.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [all, query, category]);

  const startNew = () => setEditing({ ...EMPTY });
  const duplicate = (p: CatalogProduct) =>
    setEditing({ ...(p as Editable), id: "", title: `${p.title} Copy` });

  const persist = () => {
    if (!editing) return;
    const id = editing.id?.trim() || slugifyId(editing.title);
    if (!editing.title.trim()) return alert("Title is required");
    if (!editing.image.trim()) return alert("Main image URL is required");
    if (!editing.price || editing.price < 0) return alert("Price must be >= 0");
    const toSave: Editable = {
      ...editing,
      id,
      images: normalizeList(editing.images),
      colors: normalizeList(editing.colors),
      tags: normalizeList(editing.tags),
      sizes: normalizeList(editing.sizes) as any,
      badge: editing.badge || undefined,
    } as Editable;
    upsertProduct(toSave);
    setVersion((v) => v + 1);
    setEditing({ ...toSave });
  };

  const remove = (id: string) => {
    if (
      !confirm(
        "Delete this product override? (Static products remain unaffected)",
      )
    )
      return;
    deleteProduct(id);
    setVersion((v) => v + 1);
    if (editing?.id === id) setEditing(null);
  };

  const toggleHidden = (p: Editable) => {
    setHidden(p.id, !p.hidden);
    setVersion((v) => v + 1);
    if (editing?.id === p.id) setEditing({ ...p, hidden: !p.hidden });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Controls and Filters */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Search products..."
            className="h-12 rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-12 rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            className="h-12 rounded-xl border border-primary/20 px-6 text-sm font-medium transition-all hover:bg-primary/10 hover:border-primary/40"
            onClick={startNew}
          >
            ➕ New Product
          </button>
        </div>

        {/* Data Management */}
        <div className="flex flex-wrap gap-2 justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              className="h-10 rounded-lg border border-primary/20 px-3 text-xs font-medium transition-all hover:bg-primary/10 hover:border-primary/40"
              onClick={() => alert(JSON.stringify(exportOverrides(), null, 2))}
            >
              📥 Export
            </button>
            <button
              className="h-10 rounded-lg border border-primary/20 px-3 text-xs font-medium transition-all hover:bg-primary/10 hover:border-primary/40"
              onClick={() => {
                const text = prompt("Paste products JSON overrides array");
                if (!text) return;
                try {
                  const data = JSON.parse(text);
                  importOverrides(data);
                  setVersion((v) => v + 1);
                } catch (e) {
                  alert("Invalid JSON");
                }
              }}
            >
              📤 Import
            </button>
            <button
              className="h-10 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 transition-all hover:bg-red-50 hover:border-red-400"
              onClick={() => {
                if (!confirm("Clear all product overrides?")) return;
                clearOverrides();
                setVersion((v) => v + 1);
              }}
            >
              🔄 Reset
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="h-10 rounded-lg border border-primary/20 px-3 text-xs font-medium transition-all hover:bg-primary/10 hover:border-primary/40"
              onClick={() => alert(JSON.stringify(exportInventory(), null, 2))}
            >
              📥 Stock
            </button>
            <button
              className="h-10 rounded-lg border border-primary/20 px-3 text-xs font-medium transition-all hover:bg-primary/10 hover:border-primary/40"
              onClick={() => {
                const text = prompt("Paste inventory JSON map");
                if (!text) return;
                try {
                  const data = JSON.parse(text);
                  importInventory(data);
                  setVersion((v) => v + 1);
                } catch (e) {
                  alert("Invalid JSON");
                }
              }}
            >
              📤 Stock
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setEditing(p as Editable)}
              className={`group relative rounded-xl border text-left transition-all duration-300 p-4 overflow-hidden ${
                editing?.id === p.id
                  ? "border-primary bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg"
                  : "border-primary/10 bg-gradient-to-br from-white to-primary/5 hover:border-primary/30 hover:shadow-md"
              }`}
            >
              {/* Product Image */}
              {p.image && (
                <div className="mb-3 h-40 w-full rounded-lg bg-primary/10 overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              )}

              {/* Product Info */}
              <div className="space-y-2">
                <h3 className="font-bold text-foreground line-clamp-2 text-sm">
                  {p.title}
                </h3>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>ID: <span className="font-mono text-primary">{p.id}</span></p>
                  <p>Category: <span className="font-medium">{p.category}</span></p>
                </div>

                {/* Price & Stock */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-primary/10">
                  <div className="rounded-lg bg-primary/10 p-2 text-center">
                    <div className="font-bold text-primary text-sm">
                      {formatCurrency(p.price)}
                    </div>
                    <p className="text-xs text-muted-foreground">Price</p>
                  </div>
                  <div className="rounded-lg bg-accent/10 p-2 text-center">
                    <div className="font-bold text-accent-foreground text-sm">
                      {stockSummary(p as any)}
                    </div>
                    <p className="text-xs text-muted-foreground">Stock</p>
                  </div>
                </div>

                {/* Flags */}
                {(p.isNew || p.isBestSeller || p.onSale) && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {p.isNew && <Badge>🆕 New</Badge>}
                    {p.isBestSeller && <Badge>⭐ Best</Badge>}
                    {p.onSale && <Badge>🏷️ Sale</Badge>}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-primary/10">
                  <button
                    className="flex-1 h-9 rounded-lg bg-primary/10 text-primary text-xs font-medium transition-all hover:bg-primary/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicate(p);
                    }}
                  >
                    📋 Dup
                  </button>
                  <button
                    className="flex-1 h-9 rounded-lg border border-primary/20 text-xs font-medium transition-all hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleHidden(p as Editable);
                    }}
                  >
                    {(p as Editable).hidden ? "👁️ Show" : "👁️‍🗨️ Hide"}
                  </button>
                  <button
                    className="flex-1 h-9 rounded-lg border border-red-200 text-red-600 text-xs font-medium transition-all hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(p.id);
                    }}
                  >
                    🗑️ Del
                  </button>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-white to-primary/5 p-12 text-center">
          <p className="text-muted-foreground text-sm">
            📦 No products found. Try adjusting your filters.
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-white to-primary/5 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              {editing.id ? "Edit Product" : "New Product"}
            </h2>
            <button
              className="text-2xl text-muted-foreground hover:text-foreground"
              onClick={() => setEditing(null)}
            >
              ✕
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="ID (slug)" hint="Leave blank to auto-generate">
              <input
                className="h-11 w-full rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                value={editing.id}
                onChange={(e) =>
                  setEditing({ ...editing, id: e.target.value })
                }
              />
            </Field>
            <Field label="Title">
              <input
                className="h-11 w-full rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
            </Field>
            <Field label="Price">
              <input
                type="number"
                min={0}
                className="h-11 w-full rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                value={editing.price}
                onChange={(e) =>
                  setEditing({ ...editing, price: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Category">
              <input
                list="catalog-categories"
                className="h-11 w-full rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                value={editing.category}
                onChange={(e) =>
                  setEditing({ ...editing, category: e.target.value as any })
                }
              />
              <datalist id="catalog-categories">
                {categories
                  .filter((c) => c !== "all")
                  .map((c) => (
                    <option key={c} value={c} />
                  ))}
              </datalist>
            </Field>
          </div>

          <Field label="Main Image URL" colSpan>
            <input
              className="h-11 w-full rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
              value={editing.image}
              onChange={(e) =>
                setEditing({ ...editing, image: e.target.value })
              }
            />
          </Field>

          <Field label="Additional Images (comma separated)" colSpan>
            <input
              className="h-11 w-full rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
              value={(editing.images || []).join(", ")}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  images: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field>

          <Field label="Description" colSpan>
            <textarea
              className="min-h-[100px] w-full rounded-xl border border-primary/20 px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent resize-none"
              value={editing.description}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Sizes">
              <input
                className="h-11 w-full rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                value={(editing.sizes || []).join(", ")}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    sizes: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean) as any,
                  })
                }
              />
            </Field>
            <Field label="Colors">
              <input
                className="h-11 w-full rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                value={(editing.colors || []).join(", ")}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    colors: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
            <Field label="Tags">
              <input
                className="h-11 w-full rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                value={(editing.tags || []).join(", ")}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    tags: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-4 border-t border-primary/10 pt-6">
            <Toggle
              label="🆕 New"
              checked={!!editing.isNew}
              onChange={(v) => setEditing({ ...editing, isNew: v })}
            />
            <Toggle
              label="⭐ Best Seller"
              checked={!!editing.isBestSeller}
              onChange={(v) => setEditing({ ...editing, isBestSeller: v })}
            />
            <Toggle
              label="🏷️ On Sale"
              checked={!!editing.onSale}
              onChange={(v) => setEditing({ ...editing, onSale: v })}
            />
            <Field label="Badge">
              <input
                className="h-11 w-full rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                value={editing.badge || ""}
                onChange={(e) =>
                  setEditing({ ...editing, badge: e.target.value })
                }
              />
            </Field>
          </div>

          {/* Stock Management */}
          <div className="border-t border-primary/10 pt-6 space-y-4">
            <h3 className="font-bold text-foreground">📦 Inventory</h3>
            {!editing.id ? (
              <p className="text-sm text-muted-foreground">
                Save product first to manage stock.
              </p>
            ) : editing.sizes && editing.sizes.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {editing.sizes.map((s) => (
                  <label
                    key={s}
                    className="flex items-center gap-2 rounded-lg border border-primary/20 px-4 py-2 text-sm"
                  >
                    <span className="font-medium">{s}:</span>
                    <input
                      type="number"
                      defaultValue={getStock(editing.id, s as any)}
                      className="h-9 w-16 rounded-lg border border-primary/20 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      onBlur={(e) =>
                        setStock(editing.id, Number(e.target.value), s as any)
                      }
                    />
                  </label>
                ))}
              </div>
            ) : (
              <label className="flex items-center gap-2 rounded-lg border border-primary/20 px-4 py-2 text-sm w-fit">
                <span className="font-medium">Total:</span>
                <input
                  type="number"
                  defaultValue={editing.id ? getStock(editing.id as any) : 0}
                  className="h-9 w-20 rounded-lg border border-primary/20 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  onBlur={(e) =>
                    editing.id &&
                    setStock(editing.id as any, Number(e.target.value))
                  }
                />
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 border-t border-primary/10 pt-6">
            <button
              className="h-11 rounded-lg border border-primary/20 px-6 font-medium text-primary transition-all hover:bg-primary/10 hover:border-primary/40"
              onClick={persist}
            >
              💾 Save
            </button>
            {editing.id && (
              <button
                className="h-11 rounded-lg border border-red-200 px-6 font-medium text-red-600 transition-all hover:bg-red-50 hover:border-red-400"
                onClick={() => remove(editing.id)}
              >
                🗑️ Delete
              </button>
            )}
            <label className="ml-auto inline-flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={!!editing.hidden}
                onChange={(e) =>
                  setEditing({ ...editing, hidden: e.target.checked })
                }
                className="h-4 w-4 rounded border-primary/30"
              />
              👁️‍🗨️ Hidden
            </label>
            <button
              className="h-11 rounded-lg border border-primary/20 px-6 font-medium text-foreground transition-all hover:bg-primary/5 hover:border-primary/40"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
      {children}
    </span>
  );
}

function Field({
  label,
  hint,
  colSpan,
  children,
}: {
  label: string;
  hint?: string;
  colSpan?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`grid gap-2 ${colSpan ? "md:col-span-2" : ""}`}
    >
      <span className="text-sm font-semibold text-foreground">
        {label}
        {hint ? (
          <span className="ml-2 text-muted-foreground text-xs">({hint})</span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-primary/30 cursor-pointer"
      />
      {label}
    </label>
  );
}

function stockSummary(p: CatalogProduct): string {
  if (p.sizes && p.sizes.length) {
    const parts = p.sizes.map((s) => `${s}:${getStock(p.id, s as any)}`);
    return `Stock ${parts.join(" ")}`;
  }
  return `Stock ${getStock(p.id)}`;
}

function normalizeList(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input))
    return input.map((s) => String(s).trim()).filter(Boolean);
  if (typeof input === "string")
    return input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}
