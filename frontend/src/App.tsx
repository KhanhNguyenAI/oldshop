import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { ReturnPolicyPage } from './pages/ReturnPolicyPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProfilePage } from './pages/ProfilePage';
import { BookingPage } from './pages/BookingPage';
import { BuybackPricePage } from './pages/BuybackPricePage';
import { AdminPage } from './pages/AdminPage';
import { FreeItemsPage } from './pages/FreeItemsPage';
import { CreateFreeItemPage } from './pages/CreateFreeItemPage';
import { FreeItemDetailPage } from './pages/FreeItemDetailPage';
import { MyFreeItemsPage } from './pages/MyFreeItemsPage';
import { EditFreeItemPage } from './pages/EditFreeItemPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageLoader } from './components/ui/PageLoader';
import { Footer } from './components/Footer';
import { CartSidebar } from './components/shop/CartSidebar';
import { Toaster } from 'react-hot-toast';

const AppContent = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Toaster position="top-center" reverseOrder={false} />
      <CartSidebar />
      <div className="flex-grow">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/buyback-price" element={<BuybackPricePage />} />
          <Route path="/free-items" element={<FreeItemsPage />} />
          <Route 
            path="/free-items/create" 
            element={
              <ProtectedRoute>
                <CreateFreeItemPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/free-items/:id" element={<FreeItemDetailPage />} />
          <Route 
            path="/free-items/:id/edit" 
            element={
              <ProtectedRoute>
                <EditFreeItemPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/free-items/my-items" 
            element={
              <ProtectedRoute>
                <MyFreeItemsPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/return-policy" element={<ReturnPolicyPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter basename="/ReHomeMarket/">
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
