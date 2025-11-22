import { useState } from "react";

export default function ProductManagerSimple() {
  const [count, setCount] = useState(0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">📦 Products Manager</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Simple test component to verify loading works
        </p>
      </div>

      <div className="rounded-2xl border border-primary/10 bg-white p-6">
        <p className="text-lg font-semibold text-foreground mb-4">
          Component loaded successfully! ✅
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          This is a simplified test to verify the ProductManager tab loads correctly.
        </p>
        <button
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition"
        >
          Click me: {count}
        </button>
      </div>
    </div>
  );
}
