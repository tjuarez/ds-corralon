import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { productosApi } from '../api/productos';
import Layout from '../components/Layout';
import { ArrowLeft, Edit, Trash2, Package, AlertTriangle, DollarSign, Layers, MapPin, Tag } from 'lucide-react';

const ProductoDetalle = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const { showSuccess, showError, showConfirm } = useNotification();
  
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducto();
  }, [id]);

  const loadProducto = async () => {
    try {
      setLoading(true);
      const data = await productosApi.getById(id);
      setProducto(data.producto);
    } catch (error) {
      showError(error.message);
      navigate('/productos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm(
      `¿Está seguro de eliminar el producto "${producto.descripcion}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      await productosApi.delete(id);
      showSuccess('Producto eliminado exitosamente');
      navigate('/productos');
    } catch (error) {
      showError(error.message);
    }
  };

  const getStockStatus = () => {
    if (!producto) return null;
    
    const stock = parseFloat(producto.stock_actual || 0);
    const minimo = parseFloat(producto.stock_minimo || 0);

    if (stock === 0) {
      return { color: '#dc2626', label: t('outOfStock'), icon: AlertTriangle };
    } else if (stock <= minimo) {
      return { color: '#f59e0b', label: t('lowStockAlert'), icon: AlertTriangle };
    }
    return { color: '#10b981', label: 'Stock OK', icon: Package };
  };

  const groupPreciosByMoneda = () => {
    if (!producto || !producto.precios) return { ARS: [], USD: [] };
    
    const grouped = { ARS: [], USD: [] };
    producto.precios.forEach(precio => {
      const moneda = precio.moneda_codigo || 'ARS';
      grouped[moneda].push(precio);
    });
    
    return grouped;
  };

  if (loading) {
    return (
      <Layout>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>{t('loading')}</p>
        </div>
      </Layout>
    );
  }

  if (!producto) {
    return null;
  }

  const stockStatus = getStockStatus();
  const StatusIcon = stockStatus.icon;
  const preciosPorMoneda = groupPreciosByMoneda();

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <div style={styles.codigoChip}>
            <Tag size={16} />
            {producto.codigo}
          </div>
          <h1 style={styles.title}>{producto.descripcion}</h1>
          {producto.marca && (
            <p style={styles.subtitle}>Marca: {producto.marca}</p>
          )}
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={() => navigate('/productos')}
            style={styles.backButton}
          >
            <ArrowLeft size={18} style={{ marginRight: '6px' }} />
            {t('back')}
          </button>
          <button
            onClick={() => navigate(`/productos/${id}/editar`)}
            style={styles.editButton}
          >
            <Edit size={18} style={{ marginRight: '6px' }} />
            {t('edit')}
          </button>
          <button
            onClick={handleDelete}
            style={styles.deleteButton}
          >
            <Trash2 size={18} style={{ marginRight: '6px' }} />
            {t('delete')}
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Información Principal */}
        <div style={styles.mainCard}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Información General</h2>
            {producto.categoria_nombre && (
              <span style={styles.badge}>
                <Layers size={14} style={{ marginRight: '6px' }} />
                {producto.categoria_nombre}
              </span>
            )}
          </div>

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Código</span>
              <span style={styles.infoValue}>{producto.codigo}</span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Descripción</span>
              <span style={styles.infoValue}>{producto.descripcion}</span>
            </div>

            {producto.marca && (
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Marca</span>
                <span style={styles.infoValue}>{producto.marca}</span>
              </div>
            )}

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Unidad de Medida</span>
              <span style={{
                ...styles.infoValue,
                textTransform: 'capitalize'
              }}>
                {producto.unidad_medida}
              </span>
            </div>

            {producto.proveedor_nombre && (
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Proveedor</span>
                <span style={styles.infoValue}>{producto.proveedor_nombre}</span>
              </div>
            )}

            {producto.ubicacion && (
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>
                  <MapPin size={14} style={{ marginRight: '4px', display: 'inline' }} />
                  Ubicación
                </span>
                <span style={styles.infoValue}>{producto.ubicacion}</span>
              </div>
            )}

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Estado</span>
              <span style={{
                ...styles.badge,
                backgroundColor: producto.activo ? '#d1fae5' : '#fee2e2',
                color: producto.activo ? '#059669' : '#dc2626',
              }}>
                {producto.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

        {/* Stock */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Control de Stock</h2>
          
          <div style={styles.stockCard}>
            <div style={styles.stockHeader}>
              <StatusIcon size={32} color={stockStatus.color} />
              <div style={{ flex: 1 }}>
                <div style={styles.stockLabel}>Stock Actual</div>
                <div style={{
                  ...styles.stockValue,
                  color: stockStatus.color
                }}>
                  {producto.stock_actual} {producto.unidad_medida}
                </div>
              </div>
              <span style={{
                ...styles.stockBadge,
                backgroundColor: stockStatus.color + '20',
                color: stockStatus.color,
              }}>
                {stockStatus.label}
              </span>
            </div>

            {producto.stock_minimo > 0 && (
              <div style={styles.stockMinInfo}>
                <span style={styles.infoLabel}>Stock Mínimo:</span>
                <span style={styles.infoValue}>
                  {producto.stock_minimo} {producto.unidad_medida}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Precios */}
        {producto.precios && producto.precios.length > 0 && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Listas de Precios</h2>
              <DollarSign size={20} color="#10b981" />
            </div>

            <div style={styles.preciosContainer}>
              {/* Precios en ARS */}
              {preciosPorMoneda.ARS.length > 0 && (
                <div style={styles.monedaSection}>
                  <h3 style={styles.monedaTitle}>Pesos Argentinos (ARS)</h3>
                  <div style={styles.preciosGrid}>
                    {preciosPorMoneda.ARS.map(precio => (
                      <div key={precio.id} style={styles.precioCard}>
                        <div style={styles.precioListaNombre}>{precio.lista_nombre}</div>
                        <div style={styles.precioMonto}>
                          ${parseFloat(precio.precio).toLocaleString('es-AR', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2 
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Precios en USD */}
              {preciosPorMoneda.USD.length > 0 && (
                <div style={styles.monedaSection}>
                  <h3 style={styles.monedaTitle}>Dólares (USD)</h3>
                  <div style={styles.preciosGrid}>
                    {preciosPorMoneda.USD.map(precio => (
                      <div key={precio.id} style={styles.precioCard}>
                        <div style={styles.precioListaNombre}>{precio.lista_nombre}</div>
                        <div style={styles.precioMonto}>
                          US$ {parseFloat(precio.precio).toLocaleString('en-US', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2 
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Imagen */}
        {producto.imagen_url && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Imagen</h2>
            <div style={styles.imageContainer}>
              <img 
                src={producto.imagen_url} 
                alt={producto.descripcion}
                style={styles.productImage}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<p style="color: #6b7280;">Error al cargar la imagen</p>';
                }}
              />
            </div>
          </div>
        )}

        {/* Observaciones */}
        {producto.observaciones && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Observaciones</h2>
            <p style={styles.observaciones}>{producto.observaciones}</p>
          </div>
        )}

        {/* Información del Sistema */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Información del Sistema</h2>
          
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Fecha de Creación</span>
              <span style={styles.infoValue}>
                {new Date(producto.created_at).toLocaleDateString('es-AR')}
              </span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Última Actualización</span>
              <span style={styles.infoValue}>
                {new Date(producto.updated_at).toLocaleDateString('es-AR')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '30px',
  },
  codigoChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '18px',
    color: '#6b7280',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  backButton: {
    padding: '10px 20px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  editButton: {
    padding: '10px 20px',
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  deleteButton: {
    padding: '10px 20px',
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#dc2626',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#6b7280',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  mainCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '2px solid #f3f4f6',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 20px 0',
  },
  badge: {
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    display: 'flex',
    alignItems: 'center',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  infoLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  infoValue: {
    fontSize: '16px',
    color: '#1f2937',
    fontWeight: '500',
  },
  stockCard: {
    padding: '24px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
  },
  stockHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  stockLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  stockValue: {
    fontSize: '28px',
    fontWeight: 'bold',
  },
  stockBadge: {
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
  },
  stockMinInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
  },
  preciosContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  monedaSection: {
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  monedaTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  preciosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  precioCard: {
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
  },
  precioListaNombre: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '8px',
  },
  precioMonto: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#10b981',
  },
  imageContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  productImage: {
    maxWidth: '100%',
    maxHeight: '400px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  observaciones: {
    fontSize: '15px',
    color: '#4b5563',
    lineHeight: '1.6',
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
};

export default ProductoDetalle;