import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sucursalActiva, setSucursalActivaState] = useState(null);

  useEffect(() => {
    checkAuth();
    // Cargar sucursal activa desde localStorage
    const savedSucursal = localStorage.getItem('sucursalActiva');
    if (savedSucursal) {
      setSucursalActivaState(JSON.parse(savedSucursal));
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await authApi.getCurrentUser();
      setUser(response.user);
      
      // Si el usuario NO es admin, establecer su sucursal automáticamente
      if (response.user && response.user.rol !== 'admin' && response.user.sucursal_id) {
        const sucursal = {
          id: response.user.sucursal_id,
          nombre: response.user.sucursal_nombre
        };
        setSucursalActiva(sucursal);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await authApi.login(username, password);
    setUser(response.user);
    
    // Si el usuario NO es admin, establecer su sucursal automáticamente
    if (response.user && response.user.rol !== 'admin' && response.user.sucursal_id) {
      const sucursal = {
        id: response.user.sucursal_id,
        nombre: response.user.sucursal_nombre
      };
      setSucursalActiva(sucursal);
    } else if (response.user && response.user.rol === 'admin') {
      // Admin: cargar sucursal guardada o establecer null (todas)
      const savedSucursal = localStorage.getItem('sucursalActiva');
      if (savedSucursal) {
        setSucursalActivaState(JSON.parse(savedSucursal));
      }
    }
    
    return response;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setSucursalActiva(null);
  };

  const register = async (userData) => {
    const response = await authApi.register(userData);
    return response;
  };

  const setSucursalActiva = (sucursal) => {
    setSucursalActivaState(sucursal);
    
    // Guardar en localStorage para persistencia
    if (sucursal) {
      localStorage.setItem('sucursalActiva', JSON.stringify(sucursal));
    } else {
      localStorage.removeItem('sucursalActiva');
    }
  };

  const value = {
    user,
    loading,
    sucursalActiva,
    setSucursalActiva,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};