import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import useAuthStore from './store/authStore'
import usePresence from './hooks/usePresence'

// Components
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'
import Skeleton from './components/Skeleton'
import { ToastProvider } from './context/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import { initOneSignal, setOneSignalUser } from './services/OneSignal'
import GlobalErrorListener from './components/GlobalErrorListener'

// Automatic retry helper for lazy loading pages when new code is deployed
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasBeenRefreshed = JSON.parse(
      window.sessionStorage.getItem('page_has_been_refreshed') || 'false'
    );
    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page_has_been_refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasBeenRefreshed) {
        window.sessionStorage.setItem('page_has_been_refreshed', 'true');
        window.location.reload();
      }
      throw error;
    }
  });

// Pages (Lazy Loaded with deployment chunk retry safety)
const Landing = lazyWithRetry(() => import('./pages/Landing'));
const Login = lazyWithRetry(() => import('./pages/Login'));
const Register = lazyWithRetry(() => import('./pages/Register'));
const ForgotPassword = lazyWithRetry(() => import('./pages/ForgotPassword'));
const Home = lazyWithRetry(() => import('./pages/Home'));
const Products = lazyWithRetry(() => import('./pages/Products'));
const ProductDetail = lazyWithRetry(() => import('./pages/ProductDetail'));
const ListProduct = lazyWithRetry(() => import('./pages/ListProduct'));
const Bookings = lazyWithRetry(() => import('./pages/Bookings'));
const Chat = lazyWithRetry(() => import('./pages/Chat'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const KYCForm = lazyWithRetry(() => import('./pages/KYCForm'));
const Admin = lazyWithRetry(() => import('./pages/Admin'));
const AdminLogin = lazyWithRetry(() => import('./pages/AdminLogin'));
const MyListings = lazyWithRetry(() => import('./pages/MyListings'));
const MapSearch = lazyWithRetry(() => import('./pages/MapSearch'));
const Handover = lazyWithRetry(() => import('./pages/Handover'));
const ConditionCheck = lazyWithRetry(() => import('./pages/ConditionCheck'));
const ReturnCheck = lazyWithRetry(() => import('./pages/ReturnCheck'));
const ReturnComparison = lazyWithRetry(() => import('./pages/ReturnComparison'));
const Payment = lazyWithRetry(() => import('./pages/Payment'));
const Invoice = lazyWithRetry(() => import('./pages/Invoice'));
const ChatWindow = lazyWithRetry(() => import('./pages/ChatWindow'));
const DisputeForm = lazyWithRetry(() => import('./pages/DisputeForm'));
const InviteEarn = lazyWithRetry(() => import('./pages/InviteEarn'));
const DisputeDetail = lazyWithRetry(() => import('./pages/DisputeDetail'));
const Settings = lazyWithRetry(() => import('./pages/Settings'));
const Support = lazyWithRetry(() => import('./pages/Support'));
const Wishlist = lazyWithRetry(() => import('./pages/Wishlist'));
const Notifications = lazyWithRetry(() => import('./pages/Notifications'));
const OwnerDashboard = lazyWithRetry(() => import('./pages/OwnerDashboard'));
const OrgWorkspace = lazyWithRetry(() => import('./pages/OrgWorkspace'));
const DevPortal = lazyWithRetry(() => import('./pages/DevPortal'));
const AdminRiskDashboard = lazyWithRetry(() => import('./pages/AdminRiskDashboard'));
const SuperAdminConsole = lazyWithRetry(() => import('./pages/SuperAdminConsole'));
const GlobalFederationPortal = lazyWithRetry(() => import('./pages/GlobalFederationPortal'));
const AppMarketplace = lazyWithRetry(() => import('./pages/AppMarketplace'));
const RentalOSDashboard = lazyWithRetry(() => import('./pages/RentalOSDashboard'));

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
          {/* Public & Guest-Only Routes */}
          <Route index element={<Landing />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="map" element={<MapSearch />} />
          <Route path="support" element={<Support />} />
          <Route path="admin-login" element={<AdminLogin />} />

          {/* Guest-Only Auth Routes (Logged-in users redirected to /home) */}
          <Route element={<GuestRoute />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
          </Route>
          
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
            <Route path="bookings/:id/invoice" element={<Invoice />} />
            <Route path="bookings/:id/dispute-form" element={<DisputeForm />} />
            <Route path="bookings/:id/dispute" element={<DisputeDetail />} />
            <Route path="chat" element={<Chat />} />
            <Route path="chat/:bookingId" element={<ChatWindow />} />
            <Route path="profile" element={<Profile />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="invite" element={<InviteEarn />} />
            <Route path="kyc" element={<KYCForm />} />
            <Route path="settings" element={<Settings />} />
            <Route path="owner-dashboard" element={<OwnerDashboard />} />
            <Route path="workspace" element={<OrgWorkspace />} />
            <Route path="developer" element={<DevPortal />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute adminOnly={true} />}>
            <Route path="admin" element={<Admin />} />
            <Route path="dashboard" element={<Admin />} />
            <Route path="admin/risk" element={<AdminRiskDashboard />} />
            <Route path="super-admin" element={<SuperAdminConsole />} />
            <Route path="federation" element={<GlobalFederationPortal />} />
            <Route path="marketplace" element={<AppMarketplace />} />
            <Route path="rental-os" element={<RentalOSDashboard />} />
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
    initialize();
    initOneSignal(user?.id);
  }, []);

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
        <GlobalErrorListener />
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
