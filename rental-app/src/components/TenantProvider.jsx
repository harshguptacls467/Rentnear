import React, { createContext, useContext, useState, useEffect } from 'react';

const TenantContext = createContext(null);

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolveTenant = async () => {
      try {
        const host = window.location.host;
        // Strip out development port differences if needed, or query resolve endpoint
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/tenant/resolve?host=${host}`);
        const data = await res.json();
        
        if (data.success && data.tenant) {
          setTenant(data.tenant);
          // Set dynamic branding CSS variables
          const primaryColor = data.tenant.branding?.primary_color || '#4f46e5';
          document.documentElement.style.setProperty('--color-primary', primaryColor);
        }
      } catch (err) {
        console.warn('Tenant resolution failed:', err);
      } finally {
        setLoading(false);
      }
    };
    resolveTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, loading }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
