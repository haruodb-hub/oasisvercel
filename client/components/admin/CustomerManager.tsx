import { useEffect, useMemo, useState } from "react";
import {
  loadCustomers,
  saveCustomers,
  upsertCustomer,
  deleteCustomer,
  addInteraction,
  type CustomerProfile,
  type CustomerStatus,
  getPurchaseStats,
} from "@/lib/customers";
import { formatCurrency } from "@/lib/money";

const STATUSES: CustomerStatus[] = [
  "lead",
  "active",
  "vip",
  "inactive",
  "banned",
];

export default function CustomerManager() {
  const [list, setList] = useState<CustomerProfile[]>(loadCustomers());
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CustomerStatus | "all">("all");
  const [minOrders, setMinOrders] = useState<number>(0);
  const [minSpent, setMinSpent] = useState<number>(0);
  const [editing, setEditing] = useState<CustomerProfile | null>(null);
  const stats = useMemo(() => getPurchaseStats(), [list]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "customers") setList(loadCustomers());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return list.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (q) {
        const inText = [c.name, c.email, c.phone, (c.tags || []).join(" ")]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!inText.includes(q)) return false;
      }
      const key = c.email?.toLowerCase() || c.phone || "";
      const st = stats[key] || { orders: 0, spent: 0 };
      if (st.orders < minOrders) return false;
      if (st.spent < minSpent) return false;
      return true;
    });
  }, [list, query, status, minOrders, minSpent, stats]);

  const onNew = () =>
    setEditing({
      id: "",
      name: "",
      email: "",
      phone: "",
      status: "lead",
      tags: [],
      notes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

  const persist = () => {
    if (!editing) return;
    if (!editing.name.trim()) return alert("Name is required");
    const next = upsertCustomer(editing);
    setList(next);
    const saved = editing.id ? next.find((c) => c.id === editing.id) : next[0];
    setEditing(saved || null);
  };

  const remove = (id: string) => {
    if (!confirm("Delete this customer?")) return;
    setList(deleteCustomer(id));
    if (editing?.id === id) setEditing(null);
  };

  const exportJson = () => alert(JSON.stringify(list, null, 2));
  const importJson = () => {
    const text = prompt("Paste customers JSON array");
    if (!text) return;
    try {
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error("Invalid JSON");
      saveCustomers(arr);
      setList(loadCustomers());
    } catch {
      alert("Invalid JSON");
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Filter Section */}
      <div className="space-y-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Search customers by name, email, phone..."
          className="w-full h-12 rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
          aria-label="Search customers"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="h-11 rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
            aria-label="Status filter"
          >
            <option value="all">📊 All Status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 h-11 rounded-xl border border-primary/20 px-4 transition-all focus-within:ring-2 focus-within:ring-primary/30">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Min Orders:
            </span>
            <input
              type="number"
              className="h-full flex-1 border-0 bg-transparent text-sm focus:outline-none"
              value={minOrders}
              onChange={(e) => setMinOrders(Number(e.target.value) || 0)}
              min={0}
            />
          </label>

          <label className="flex items-center gap-2 h-11 rounded-xl border border-primary/20 px-4 transition-all focus-within:ring-2 focus-within:ring-primary/30">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Min Spent:
            </span>
            <input
              type="number"
              className="h-full flex-1 border-0 bg-transparent text-sm focus:outline-none"
              value={minSpent}
              onChange={(e) => setMinSpent(Number(e.target.value) || 0)}
              min={0}
            />
          </label>

          <button
            className="h-11 rounded-xl border border-primary/20 px-4 text-sm font-medium transition-all hover:bg-primary/10 hover:border-primary/40"
            onClick={onNew}
          >
            ➕ New Customer
          </button>
        </div>

        {/* Import/Export */}
        <div className="flex gap-2 justify-end">
          <button
            className="h-10 rounded-lg border border-primary/20 px-3 text-xs font-medium transition-all hover:bg-primary/10 hover:border-primary/40"
            onClick={exportJson}
          >
            📥 Export
          </button>
          <button
            className="h-10 rounded-lg border border-primary/20 px-3 text-xs font-medium transition-all hover:bg-primary/10 hover:border-primary/40"
            onClick={importJson}
          >
            📤 Import
          </button>
        </div>
      </div>

      {/* Customers Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const key = c.email?.toLowerCase() || c.phone || "";
            const st = stats[key] || { orders: 0, spent: 0 };
            const statusColors: Record<string, { bg: string; text: string }> = {
              vip: { bg: "bg-amber-100", text: "text-amber-700" },
              active: { bg: "bg-green-100", text: "text-green-700" },
              lead: { bg: "bg-blue-100", text: "text-blue-700" },
              inactive: { bg: "bg-gray-100", text: "text-gray-700" },
              banned: { bg: "bg-red-100", text: "text-red-700" },
            };
            const colors = statusColors[c.status] || statusColors.lead;

            return (
              <button
                key={c.id}
                onClick={() => setEditing(c)}
                className={`group relative rounded-xl border text-left transition-all duration-300 p-5 ${
                  editing?.id === c.id
                    ? "border-primary bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg"
                    : "border-primary/10 bg-gradient-to-br from-white to-primary/5 hover:border-primary/30 hover:shadow-md"
                }`}
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-foreground line-clamp-2 flex-1">
                      {c.name}
                    </h3>
                    <span className={`flex-shrink-0 rounded-lg px-3 py-1 text-xs font-bold capitalize ${colors.bg} ${colors.text}`}>
                      {c.status}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {c.email && (
                      <p className="truncate">
                        <span className="font-medium">✉️</span> {c.email}
                      </p>
                    )}
                    {c.phone && (
                      <p className="truncate">
                        <span className="font-medium">📱</span> {c.phone}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="pt-3 border-t border-primary/10 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-primary/10 p-2 text-center">
                      <div className="text-lg font-bold text-primary">
                        {st.orders}
                      </div>
                      <p className="text-xs text-muted-foreground">Orders</p>
                    </div>
                    <div className="rounded-lg bg-accent/10 p-2 text-center">
                      <div className="text-lg font-bold text-accent-foreground">
                        {formatCurrency(st.spent)}
                      </div>
                      <p className="text-xs text-muted-foreground">Spent</p>
                    </div>
                  </div>

                  {/* Tags */}
                  {(c.tags || []).length > 0 && (
                    <div className="pt-3 border-t border-primary/10 flex flex-wrap gap-1">
                      {c.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                        >
                          #{tag}
                        </span>
                      ))}
                      {(c.tags || []).length > 3 && (
                        <span className="inline-block text-xs text-muted-foreground pt-0.5">
                          +{(c.tags || []).length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Click hint */}
                  <div className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    👆 Click to edit
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-white to-primary/5 p-12 text-center">
          <p className="text-muted-foreground text-sm">
            👥 No customers found. Try adjusting your filters or create a new customer.
          </p>
        </div>
      )}

      {/* Edit Modal/Panel */}
      {editing && (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-white to-primary/5 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              {editing.id ? "Edit Customer" : "New Customer"}
            </h2>
            <button
              className="text-2xl text-muted-foreground hover:text-foreground"
              onClick={() => setEditing(null)}
            >
              ✕
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="👤 Full Name">
              <input
                className="h-11 w-full rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </Field>

            <Field label="📊 Status">
              <select
                className="h-11 w-full rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                value={editing.status}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    status: e.target.value as CustomerStatus,
                  })
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="✉️ Email">
              <input
                className="h-11 w-full rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                value={editing.email || ""}
                onChange={(e) =>
                  setEditing({ ...editing, email: e.target.value })
                }
              />
            </Field>

            <Field label="📱 Phone">
              <input
                className="h-11 w-full rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                value={editing.phone || ""}
                onChange={(e) =>
                  setEditing({ ...editing, phone: e.target.value })
                }
              />
            </Field>

            <Field label="🏷️ Tags (comma separated)" colSpan>
              <input
                className="h-11 w-full rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                value={(editing.tags || []).join(", ")}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>

            <Field label="📝 Notes" colSpan>
              <textarea
                className="min-h-[100px] w-full rounded-xl border border-primary/20 px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent resize-none"
                value={editing.notes || ""}
                onChange={(e) =>
                  setEditing({ ...editing, notes: e.target.value })
                }
              />
            </Field>
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
            <button
              className="ml-auto h-11 rounded-lg border border-primary/20 px-6 font-medium text-foreground transition-all hover:bg-primary/5 hover:border-primary/40"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
          </div>

          {/* Interactions */}
          {editing.id && (
            <div className="border-t border-primary/10 pt-6 space-y-4">
              <h3 className="font-bold text-foreground">Recent Interactions</h3>
              <InteractionComposer
                onAdd={(t, note) =>
                  setList(addInteraction(editing.id!, { type: t, note }))
                }
              />
              <div className="divide-y rounded-lg border border-primary/10">
                {(editing.interactions || []).map((i) => (
                  <div key={i.id} className="grid gap-2 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="capitalize font-medium text-foreground">
                        {i.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(i.at).toLocaleString()}
                      </span>
                    </div>
                    {i.note && (
                      <div className="text-xs text-muted-foreground">
                        {i.note}
                      </div>
                    )}
                  </div>
                ))}
                {(editing.interactions || []).length === 0 && (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No interactions yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  colSpan,
}: {
  label: string;
  children: React.ReactNode;
  colSpan?: boolean;
}) {
  return (
    <label
      className={`grid gap-2 ${colSpan ? "md:col-span-2" : ""}`}
    >
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
    </label>
  );
}

function InteractionComposer({
  onAdd,
}: {
  onAdd: (type: InteractionType, note?: string) => void;
}) {
  type InteractionType = "note" | "call" | "email" | "meeting";
  const [type, setType] = useState<InteractionType>("note");
  const [note, setNote] = useState("");
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <select
        className="h-11 rounded-lg border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
        value={type}
        onChange={(e) => setType(e.target.value as InteractionType)}
        aria-label="Interaction type"
      >
        <option value="note">📝 Note</option>
        <option value="call">☎️ Call</option>
        <option value="email">✉️ Email</option>
        <option value="meeting">📅 Meeting</option>
      </select>
      <input
        className="h-11 flex-1 rounded-lg border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (optional)"
        aria-label="Interaction note"
      />
      <button
        className="h-11 rounded-lg border border-primary/20 px-6 font-medium transition-all hover:bg-primary/10 hover:border-primary/40 whitespace-nowrap"
        onClick={() => {
          onAdd(type, note);
          setNote("");
        }}
      >
        Add
      </button>
    </div>
  );
}
