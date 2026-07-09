import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import useAuthStore from './store/authStore'
import usePresence from './hooks/usePresence'

// Components
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Skeleton from './components/Skeleton'
import { ToastProvider } from './context/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import { initOneSignal, setOneSignalUser } from './services/OneSignal'

// Pages (Lazy Loaded)
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const ListProduct = lazy(() => import('./pages/ListProduct'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Chat = lazy(() => import('./pages/Chat'));
const Profile = lazy(() => import('./pages/Profile'));
const KYCForm = lazy(() => import('./pages/KYCForm'));
const Admin = lazy(() => import('./pages/Admin'));
const MyListings = lazy(() => import('./pages/MyListings'));
const MapSearch = lazy(() => import('./pages/MapSearch'));
const Handover = lazy(() => import('./pages/Handover'));
const ConditionCheck = lazy(() => import('./pages/ConditionCheck'));
const ReturnCheck = lazy(() => import('./pages/ReturnCheck'));
const ReturnComparison = lazy(() => import('./pages/ReturnComparison'));
const Payment = lazy(() => import('./pages/Payment'));
const ChatWindow = lazy(() => import('./pages/ChatWindow'));
const DisputeForm = lazy(() => import('./pages/DisputeForm'));
const DisputeDetail = lazy(() => import('./pages/DisputeDetail'));
const Settings = lazy(() => import('./pages/Settings'));
const Support = lazy(() => import('./pages/Support'));

// Full-screen loading fallback for Suspense
const PageLoader = () => (
  <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-4">
    <Skeleton className="h-64 w-full rounded-3xl" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          {/* Public Routes */}
          <Route index element={<Landing />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="map" element={<MapSearch />} />
          <Route path="support" element={<Support />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="home" element={<Home />} />
            <Route path="list-product" element={<ListProduct />} />
            <Route path="list-product/:id" element={<ListProduct />} />
            <Route path="my-listings" element={<MyListings />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="bookings/:id/handover" element={<Handover />} />
            <Route path="bookings/:id/condition" element={<ConditionCheck />} />
            <Route path="bookings/:id/return" element={<ReturnCheck />} />
            <Route path="bookings/:id/compare" element={<ReturnComparison />} />
            <Route path="bookings/:id/pay" element={<Payment />} />
            <Route path="bookings/:id/dispute-form" element={<DisputeForm />} />
            <Route path="bookings/:id/dispute" element={<DisputeDetail />} />
            <Route path="chat" element={<Chat />} />
            <Route path="chat/:bookingId" element={<ChatWindow />} />
            <Route path="profile" element={<Profile />} />
            <Route path="kyc" element={<KYCForm />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute adminOnly={true} />}>
            <Route path="admin" element={<Admin />} />
          </Route>
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const { initialize, user } = useAuthStore();

  // Broadcast global presence — other users can see when you're online
  usePresence(user, 'rentnear-global-presence');

  useEffect(() => {
    const cleanup = initialize();
    
    // Initialize OneSignal
    initOneSignal(user?.id);

    return cleanup;
  }, [initialize]);

  useEffect(() => {
    // Sync OneSignal user id when auth state changes
    if (user?.id) {
      setOneSignalUser(user.id);
    } else {
      setOneSignalUser(null);
    }
  }, [user]);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <AnimatedRoutes />
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
