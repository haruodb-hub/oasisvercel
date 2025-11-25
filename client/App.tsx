import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import Layout from "@/components/site/Layout";
import PlaceholderPage from "@/components/site/PlaceholderPage";
import { CartProvider } from "@/store/cart";
import { AuthProvider } from "@/store/auth";
import { syncFromServer } from "@/lib/catalog";

const Index = lazy(() => import("./pages/Index"));
const Shop = lazy(() => import("./pages/Shop"));
const Product = lazy(() => import("./pages/Product"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const NewArrivals = lazy(() => import("./pages/NewArrivals"));
const BestSellers = lazy(() => import("./pages/BestSellers"));
const Sale = lazy(() => import("./pages/Sale"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Policies = lazy(() => import("./pages/Policies"));
const Account = lazy(() => import("./pages/Account"));
const Login = lazy(() => import("./pages/Login"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UserDashboard = lazy(() => import("./pages/dashboard/UserDashboard"));

const queryClient = new QueryClient();

const AppContent = () => {
  useEffect(() => {
    // Sync products from server on app load
    syncFromServer();
  }, []);

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route
            path="/order-confirmation"
            element={<OrderConfirmation />}
          />
          <Route path="/new" element={<NewArrivals />} />
          <Route path="/bestsellers" element={<BestSellers />} />
          <Route path="/sale" element={<Sale />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/account" element={<Account />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route
            path="*"
            element={
              <PlaceholderPage
                title="Page Not Found"
                description="The page you are looking for does not exist."
              />
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

// Ensure we don't call createRoot multiple times during HMR
const container = document.getElementById("root")!;
const w = window as unknown as { __appRoot?: ReturnType<typeof createRoot> };
if (!w.__appRoot) {
  w.__appRoot = createRoot(container);
}
w.__appRoot.render(<App />);

