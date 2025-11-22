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
import { formatCurrency } from "@/lib/money";
import { Search, Plus, Copy2, Trash2, Eye, EyeOff, Download, Upload, RefreshCw } from "lucide-react";

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
  const [sortBy, setSortBy] = useState<"name" | "price" | "newest">("name");
  const [editing, setEditing] = useState<Editable | null>(null);
  const [version, setVersion] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
    let result = all.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q)) ||
        p.id.toLowerCase().includes(q)
      );
    });

    // Sort
    if (sortBy === "price") result.sort((a, b) => a.price - b.price);
    if (sortBy === "newest") result.reverse();

    return result;
  }, [all, query, category, sortBy]);

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
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleHidden = (p: Editable) => {
    setHidden(p.id, !p.hidden);
    setVersion((v) => v + 1);
    if (editing?.id === p.id) setEditing({ ...p, hidden: !p.hidden });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  const bulkHide = () => {
    selectedIds.forEach((id) => {
      setHidden(id, true);
    });
    setVersion((v) => v + 1);
    setSelectedIds(new Set());
  };

  const bulkShow = () => {
    selectedIds.forEach((id) => {
      setHidden(id, false);
    });
    setVersion((v) => v + 1);
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">📦 Products</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <button
          onClick={startNew}
          className="h-11 px-6 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-white font-medium flex items-center gap-2 hover:shadow-lg transition-all"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Filters Section */}
      <div className="space-y-4 bg-white rounded-xl border border-primary/10 p-5">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, ID, tags..."
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-primary/20 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 px-4 rounded-lg border border-primary/20 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Categories" : c}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-11 px-4 rounded-lg border border-primary/20 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
            <option value="newest">Newest First</option>
          </select>

          {/* Selection Count */}
          {selectedIds.size > 0 && (
            <div className="h-11 px-4 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
              <span className="text-sm font-medium text-primary">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-primary hover:underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-primary/10">
          {filtered.length > 0 && (
            <>
              <label className="h-9 px-3 rounded-lg border border-primary/20 flex items-center gap-2 text-sm font-medium cursor-pointer hover:bg-primary/5 transition-all">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filtered.length && filtered.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 cursor-pointer"
                />
                Select All
              </label>

              {selectedIds.size > 0 && (
                <>
                  <button
                    onClick={bulkShow}
                    className="h-9 px-3 rounded-lg border border-primary/20 text-sm font-medium flex items-center gap-1 hover:bg-primary/5 transition-all"
                  >
                    <Eye size={14} /> Show
                  </button>
                  <button
                    onClick={bulkHide}
                    className="h-9 px-3 rounded-lg border border-primary/20 text-sm font-medium flex items-center gap-1 hover:bg-primary/5 transition-all"
                  >
                    <EyeOff size={14} /> Hide
                  </button>
                </>
              )}
            </>
          )}

          <div className="flex-1" />

          {/* Data Tools */}
          <button
            className="h-9 px-3 rounded-lg border border-primary/20 text-sm font-medium flex items-center gap-1 hover:bg-primary/5 transition-all"
            onClick={() => alert(JSON.stringify(exportOverrides(), null, 2))}
          >
            <Download size={14} /> Export
          </button>
          <button
            className="h-9 px-3 rounded-lg border border-primary/20 text-sm font-medium flex items-center gap-1 hover:bg-primary/5 transition-all"
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
            <Upload size={14} /> Import
          </button>
          <button
            className="h-9 px-3 rounded-lg border border-red-200 text-red-600 text-sm font-medium flex items-center gap-1 hover:bg-red-50 transition-all"
            onClick={() => {
              if (!confirm("Clear all product overrides?")) return;
              clearOverrides();
              setVersion((v) => v + 1);
            }}
          >
            <RefreshCw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const isSelected = selectedIds.has(p.id);
            return (
              <div
                key={p.id}
                className={`group relative rounded-xl border transition-all duration-300 overflow-hidden ${
                  editing?.id === p.id
                    ? "border-primary ring-2 ring-primary/30 shadow-lg"
                    : "border-primary/10 hover:border-primary/30 hover:shadow-md"
                } ${isSelected ? "ring-2 ring-primary/50 border-primary/50" : ""}`}
              >
                {/* Select Checkbox */}
                <label
                  className="absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 border-white bg-primary/80 flex items-center justify-center cursor-pointer hover:bg-primary transition-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(p.id)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </label>

                {/* Product Image */}
                {p.image && (
                  <div className="relative h-40 w-full bg-primary/10 overflow-hidden cursor-pointer" onClick={() => setEditing(p as Editable)}>
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {(p as Editable).hidden && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">HIDDEN</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Product Info */}
                <div
                  className="p-4 space-y-3 cursor-pointer hover:bg-primary/5 transition-colors"
                  onClick={() => setEditing(p as Editable)}
                >
                  {/* Title & Category */}
                  <div>
                    <h3 className="font-bold text-foreground line-clamp-2 text-sm">
                      {p.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{p.category}</p>
                  </div>

                  {/* Price & Stock */}
                  <div className="grid grid-cols-2 gap-2">
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
                  <div className="flex gap-2 pt-2 border-t border-primary/10">
                    <button
                      className="flex-1 h-9 rounded-lg bg-primary/10 text-primary text-xs font-medium transition-all hover:bg-primary/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicate(p);
                      }}
                      title="Duplicate"
                    >
                      <Copy2 size={14} className="mx-auto" />
                    </button>
                    <button
                      className="flex-1 h-9 rounded-lg border border-primary/20 text-xs font-medium transition-all hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleHidden(p as Editable);
                      }}
                      title={`${(p as Editable).hidden ? "Show" : "Hide"}`}
                    >
                      {(p as Editable).hidden ? (
                        <Eye size={14} className="mx-auto" />
                      ) : (
                        <EyeOff size={14} className="mx-auto" />
                      )}
                    </button>
                    <button
                      className="flex-1 h-9 rounded-lg border border-red-200 text-red-600 text-xs font-medium transition-all hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(p.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 size={14} className="mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-white to-primary/5 p-12 text-center">
          <p className="text-muted-foreground text-sm mb-4">
            📦 No products found. Try adjusting your filters or create a new product.
          </p>
          <button
            onClick={startNew}
            className="h-10 px-6 rounded-lg border border-primary/20 text-primary font-medium hover:bg-primary/5 transition-all"
          >
            + Create First Product
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-primary/20 bg-white p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between sticky top-0 bg-white pb-4 border-b border-primary/10">
              <h2 className="text-2xl font-bold text-foreground">
                {editing.id ? "✏️ Edit Product" : "➕ New Product"}
              </h2>
              <button
                className="text-2xl text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setEditing(null)}
              >
                ✕
              </button>
            </div>

            {/* Main Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="ID (slug)" hint="Leave blank to auto-generate">
                <input
                  className="h-11 w-full rounded-lg border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={editing.id}
                  onChange={(e) => setEditing({ ...editing, id: e.target.value })}
                />
              </Field>
              <Field label="Title" hint="Product name">
                <input
                  className="h-11 w-full rounded-lg border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </Field>
              <Field label="Price">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="h-11 w-full rounded-lg border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                />
              </Field>
              <Field label="Category">
                <input
                  list="catalog-categories"
                  className="h-11 w-full rounded-lg border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value as any })}
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

            {/* Images */}
            <div className="space-y-3 border-t border-primary/10 pt-4">
              <h3 className="font-bold text-foreground">🖼️ Images</h3>
              <Field label="Main Image URL" colSpan>
                <div className="flex gap-3">
                  <input
                    className="flex-1 h-11 rounded-lg border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={editing.image}
                    onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                    placeholder="https://..."
                  />
                  {editing.image && (
                    <img
                      src={editing.image}
                      alt="Preview"
                      className="w-11 h-11 rounded-lg object-cover border border-primary/10"
                    />
                  )}
                </div>
              </Field>
              <Field label="Additional Images (comma separated)" colSpan>
                <input
                  className="h-11 w-full rounded-lg border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                  placeholder="url1, url2, url3"
                />
              </Field>
            </div>

            {/* Description */}
            <Field label="Description" colSpan>
              <textarea
                className="min-h-[100px] w-full rounded-lg border border-primary/20 px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="Detailed product description..."
              />
            </Field>

            {/* Attributes */}
            <div className="space-y-3 border-t border-primary/10 pt-4">
              <h3 className="font-bold text-foreground">📋 Attributes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Sizes">
                  <input
                    className="h-11 w-full rounded-lg border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                    placeholder="S, M, L, XL"
                  />
                </Field>
                <Field label="Colors">
                  <input
                    className="h-11 w-full rounded-lg border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                    placeholder="Black, White, Blue"
                  />
                </Field>
                <Field label="Tags">
                  <input
                    className="h-11 w-full rounded-lg border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                    placeholder="premium, luxury, sale"
                  />
                </Field>
              </div>
            </div>

            {/* Flags */}
            <div className="space-y-3 border-t border-primary/10 pt-4">
              <h3 className="font-bold text-foreground">🏷️ Flags</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                    className="h-11 w-full rounded-lg border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={editing.badge || ""}
                    onChange={(e) => setEditing({ ...editing, badge: e.target.value })}
                    placeholder="New, Hot, etc"
                  />
                </Field>
              </div>
            </div>

            {/* Stock Management */}
            <div className="border-t border-primary/10 pt-4 space-y-4">
              <h3 className="font-bold text-foreground">📦 Inventory</h3>
              {!editing.id ? (
                <p className="text-sm text-muted-foreground bg-primary/5 rounded-lg p-3">
                  💡 Save product first to manage stock levels.
                </p>
              ) : editing.sizes && editing.sizes.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {editing.sizes.map((s) => (
                    <label
                      key={s}
                      className="flex items-center gap-2 rounded-lg border border-primary/20 px-4 py-2"
                    >
                      <span className="font-medium text-sm flex-shrink-0">{s}:</span>
                      <input
                        type="number"
                        defaultValue={getStock(editing.id, s as any)}
                        className="flex-1 h-9 rounded-lg border border-primary/20 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        onBlur={(e) =>
                          setStock(editing.id, Number(e.target.value), s as any)
                        }
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <label className="flex items-center gap-2 rounded-lg border border-primary/20 px-4 py-2 w-fit">
                  <span className="font-medium text-sm">Total Stock:</span>
                  <input
                    type="number"
                    defaultValue={editing.id ? getStock(editing.id as any) : 0}
                    className="w-20 h-9 rounded-lg border border-primary/20 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    onBlur={(e) =>
                      editing.id && setStock(editing.id as any, Number(e.target.value))
                    }
                  />
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 border-t border-primary/10 pt-6">
              <button
                className="h-11 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-white px-6 font-medium hover:shadow-lg transition-all"
                onClick={persist}
              >
                💾 Save Product
              </button>
              {editing.id && (
                <button
                  className="h-11 rounded-lg border border-red-200 text-red-600 px-6 font-medium hover:bg-red-50 transition-all"
                  onClick={() => {
                    if (confirm("Delete this product?")) {
                      remove(editing.id);
                      setEditing(null);
                    }
                  }}
                >
                  🗑️ Delete
                </button>
              )}
              <label className="ml-auto inline-flex items-center gap-2 text-sm font-medium h-11">
                <input
                  type="checkbox"
                  checked={!!editing.hidden}
                  onChange={(e) => setEditing({ ...editing, hidden: e.target.checked })}
                  className="h-4 w-4 rounded border-primary/30"
                />
                👁️‍🗨️ Hidden from store
              </label>
              <button
                className="h-11 rounded-lg border border-primary/20 px-6 font-medium text-foreground hover:bg-primary/5 transition-all"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
            </div>
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
    <label className={`grid gap-2 ${colSpan ? "md:col-span-2" : ""}`}>
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
    return `${parts.join(" ")}`;
  }
  return `${getStock(p.id)}`;
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
