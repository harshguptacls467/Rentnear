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
import GlobalErrorBoundary, { RouteErrorBoundary } from './components/ErrorBoundary'
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

// Helper wrapper to protect each route with a RouteErrorBoundary
const RouteGuard = ({ name, children }) => (
  <RouteErrorBoundary routeName={name}>{children}</RouteErrorBoundary>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          {/* Public & Guest-Only Routes */}
          <Route index element={<RouteGuard name="Landing"><Landing /></RouteGuard>} />
          <Route path="products" element={<RouteGuard name="Products"><Products /></RouteGuard>} />
          <Route path="products/:id" element={<RouteGuard name="ProductDetail"><ProductDetail /></RouteGuard>} />
          <Route path="map" element={<RouteGuard name="MapSearch"><MapSearch /></RouteGuard>} />
          <Route path="support" element={<RouteGuard name="Support"><Support /></RouteGuard>} />
          <Route path="admin-login" element={<RouteGuard name="AdminLogin"><AdminLogin /></RouteGuard>} />

          {/* Guest-Only Auth Routes */}
          <Route element={<GuestRoute />}>
            <Route path="login" element={<RouteGuard name="Login"><Login /></RouteGuard>} />
            <Route path="register" element={<RouteGuard name="Register"><Register /></RouteGuard>} />
            <Route path="forgot-password" element={<RouteGuard name="ForgotPassword"><ForgotPassword /></RouteGuard>} />
          </Route>
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="home" element={<RouteGuard name="Home"><Home /></RouteGuard>} />
            <Route path="list-product" element={<RouteGuard name="ListProduct"><ListProduct /></RouteGuard>} />
            <Route path="list-product/:id" element={<RouteGuard name="ListProductEdit"><ListProduct /></RouteGuard>} />
            <Route path="my-listings" element={<RouteGuard name="MyListings"><MyListings /></RouteGuard>} />
            <Route path="bookings" element={<RouteGuard name="Bookings"><Bookings /></RouteGuard>} />
            <Route path="bookings/:id/handover" element={<RouteGuard name="Handover"><Handover /></RouteGuard>} />
            <Route path="bookings/:id/condition" element={<RouteGuard name="ConditionCheck"><ConditionCheck /></RouteGuard>} />
            <Route path="bookings/:id/return" element={<RouteGuard name="ReturnCheck"><ReturnCheck /></RouteGuard>} />
            <Route path="bookings/:id/compare" element={<RouteGuard name="ReturnComparison"><ReturnComparison /></RouteGuard>} />
            <Route path="bookings/:id/pay" element={<RouteGuard name="Payment"><Payment /></RouteGuard>} />
            <Route path="bookings/:id/invoice" element={<RouteGuard name="Invoice"><Invoice /></RouteGuard>} />
            <Route path="bookings/:id/dispute-form" element={<RouteGuard name="DisputeForm"><DisputeForm /></RouteGuard>} />
            <Route path="bookings/:id/dispute" element={<RouteGuard name="DisputeDetail"><DisputeDetail /></RouteGuard>} />
            <Route path="chat" element={<RouteGuard name="Chat"><Chat /></RouteGuard>} />
            <Route path="chat/:bookingId" element={<RouteGuard name="ChatWindow"><ChatWindow /></RouteGuard>} />
            <Route path="profile" element={<RouteGuard name="Profile"><Profile /></RouteGuard>} />
            <Route path="wishlist" element={<RouteGuard name="Wishlist"><Wishlist /></RouteGuard>} />
            <Route path="notifications" element={<RouteGuard name="Notifications"><Notifications /></RouteGuard>} />
            <Route path="invite" element={<RouteGuard name="InviteEarn"><InviteEarn /></RouteGuard>} />
            <Route path="kyc" element={<RouteGuard name="KYCForm"><KYCForm /></RouteGuard>} />
            <Route path="settings" element={<RouteGuard name="Settings"><Settings /></RouteGuard>} />
            <Route path="owner-dashboard" element={<RouteGuard name="OwnerDashboard"><OwnerDashboard /></RouteGuard>} />
            <Route path="workspace" element={<RouteGuard name="OrgWorkspace"><OrgWorkspace /></RouteGuard>} />
            <Route path="developer" element={<RouteGuard name="DevPortal"><DevPortal /></RouteGuard>} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute adminOnly={true} />}>
            <Route path="admin" element={<RouteGuard name="Admin"><Admin /></RouteGuard>} />
            <Route path="dashboard" element={<RouteGuard name="AdminDashboard"><Admin /></RouteGuard>} />
            <Route path="admin/risk" element={<RouteGuard name="AdminRisk"><AdminRiskDashboard /></RouteGuard>} />
            <Route path="super-admin" element={<RouteGuard name="SuperAdminConsole"><SuperAdminConsole /></RouteGuard>} />
            <Route path="federation" element={<RouteGuard name="GlobalFederationPortal"><GlobalFederationPortal /></RouteGuard>} />
            <Route path="marketplace" element={<RouteGuard name="AppMarketplace"><AppMarketplace /></RouteGuard>} />
            <Route path="rental-os" element={<RouteGuard name="RentalOSDashboard"><RentalOSDashboard /></RouteGuard>} />
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
    <GlobalErrorBoundary>
      <ToastProvider>
        <GlobalErrorListener />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <AnimatedRoutes />
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </GlobalErrorBoundary>
  )
}

export default App

