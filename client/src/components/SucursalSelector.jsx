import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sucursalesApi } from '../api/sucursales';
import { Building2, ChevronDown } from 'lucide-react';

const SucursalSelector = () => {
  const { user, sucursalActiva, setSucursalActiva } = useAuth();
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user?.rol === 'admin') {
      loadSucursales();
    }
  }, [user]);

  const loadSucursales = async () => {
    try {
      setLoading(true);
      const data = await sucursalesApi.getAll({ activa: 'true' });
      setSucursales(data.sucursales);
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSucursal = (sucursal) => {
    setSucursalActiva(sucursal);
    setIsOpen(false);
    // Recargar la página para actualizar todos los datos
    window.location.reload();
  };

  // No mostrar si no es admin
  if (!user || user.rol !== 'admin') {
    return null;
  }

  return (
    <div style={styles.container}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={styles.button}
      >
        <Building2 size={18} style={{ marginRight: '8px' }} />
        <span style={styles.buttonText}>
          {sucursalActiva ? sucursalActiva.nombre : 'Todas las sucursales'}
        </span>
        <ChevronDown size={16} style={{ marginLeft: '8px' }} />
      </button>

      {isOpen && (
        <>
          <div style={styles.overlay} onClick={() => setIsOpen(false)} />
          <div style={styles.dropdown}>
            <div
              style={styles.dropdownItem}
              onClick={() => handleSelectSucursal(null)}
            >
              <Building2 size={16} style={{ marginRight: '8px' }} />
              <span>Todas las sucursales</span>
              {!sucursalActiva && <span style={styles.checkmark}>✓</span>}
            </div>
            
            <div style={styles.divider} />
            
            {sucursales.map((sucursal) => (
              <div
                key={sucursal.id}
                style={styles.dropdownItem}
                onClick={() => handleSelectSucursal(sucursal)}
              >
                <Building2 size={16} style={{ marginRight: '8px' }} />
                <span>{sucursal.nombre}</span>
                {sucursalActiva?.id === sucursal.id && (
                  <span style={styles.checkmark}>✓</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#eff6ff',
    border: '2px solid #2563eb',
    borderRadius: '8px',
    color: '#2563eb',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  buttonText: {
    maxWidth: '150px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    minWidth: '250px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    maxHeight: '400px',
    overflowY: 'auto',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151',
    transition: 'background-color 0.2s',
    position: 'relative',
  },
  divider: {
    height: '1px',
    backgroundColor: '#e5e7eb',
    margin: '4px 0',
  },
  checkmark: {
    marginLeft: 'auto',
    color: '#2563eb',
    fontWeight: 'bold',
  },
};

// Agregar hover effect
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .sucursal-dropdown-item:hover {
      background-color: #f3f4f6;
    }
  `;
  document.head.appendChild(style);
}

export default SucursalSelector;