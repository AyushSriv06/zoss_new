import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Index from "./pages/Index";
import UsageBenefits from "./pages/UsageBenefits";
import SubscriptionModel from "./pages/SubscriptionModel";
import Blogs from "./pages/Blogs";
import ContactUs from "./pages/ContactUs";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";
import LoginForm from "./components/auth/LoginForm";
import SignupForm from "./components/auth/SignupForm";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import Products from "./pages/dashboard/Products";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminUserDetail from "./pages/admin/AdminUserDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes with header/footer */}
            <Route path="/" element={
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <Index />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/usage-benefits" element={
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <UsageBenefits />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/subscription-model" element={
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <SubscriptionModel />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/blogs" element={
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <Blogs />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/contact-us" element={
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <ContactUs />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/product/:productId" element={
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <ProductDetail />
                </main>
                <Footer />
              </div>
            } />

            {/* Auth routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignupForm />} />

            {/* Protected dashboard routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="services" element={<div>Services page coming soon</div>} />
              <Route path="warranty" element={<div>Warranty page coming soon</div>} />
              <Route path="profile" element={<div>Profile page coming soon</div>} />
            </Route>

            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/user/:userId" element={
              <ProtectedRoute>
                <AdminUserDetail />
              </ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;