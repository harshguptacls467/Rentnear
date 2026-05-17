import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import useAuthStore from './store/authStore'

// Components
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import ListProduct from './pages/ListProduct'
import Bookings from './pages/Bookings'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

function App() {
  const { initialize } = useAuthStore();

  // Initialize Supabase Auth listener right when the app mounts
  useEffect(() => {
    const cleanup = initialize();
    return cleanup;
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          
          {/* Public Routes - Anyone can visit these */}
          <Route index element={<Landing />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          
          {/* Protected Routes - Only logged-in users can visit these */}
          <Route element={<ProtectedRoute />}>
            <Route path="home" element={<Home />} />
            <Route path="list-product" element={<ListProduct />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="chat" element={<Chat />} />
            <Route path="profile" element={<Profile />} />
            <Route path="admin" element={<Admin />} />
          </Route>
          
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
