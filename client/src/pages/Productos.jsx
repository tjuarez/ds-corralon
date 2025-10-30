import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { productosApi } from '../api/productos';
import Layout from '../components/Layout';
import { Plus, Search, Eye, Edit, Trash2, Package, AlertTriangle, DollarSign, Layers } from 'lucide-react';

const Productos = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showSuccess, showError, showConfirm } = useNotification();
  
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [stockBajoFilter, setStockBajoFilter] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadProductos();
  }, [search, categoriaFilter, stockBajoFilter]);

  const loadData = async () => {
    try {
      const [prodData, catData] = await Promise.all([
        productosApi.getAll(),
        productosApi.getCategorias()
      ]);
      setProductos(prodData.productos);
      setCategorias(catData.categoriasPlanas || []);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProductos = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (search) filters.search = search;
      if (categoriaFilter) filters.categoria_id = categoriaFilter;
      if (stockBajoFilter) filters.stock_bajo = 'true';
      
      const data = await productosApi.getAll(filters);
      setProductos(data.productos);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, descripcion) => {
    const confirmed = await showConfirm(
      `¿Está seguro de eliminar el producto "${descripcion}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      await productosApi.delete(id);
      showSuccess('Producto eliminado exitosamente');
      loadProductos();
    } catch (error) {
      showError(error.message);
    }
  };

  const getStockStatus = (producto) => {
    const stock = parseFloat(producto.stock_actual || 0);
    const minimo = parseFloat(producto.stock_minimo || 0);

    if (stock === 0) {
      return { color: '#dc2626', label: t('outOfStock'), icon: AlertTriangle };
    } else if (stock <= minimo) {
      return { color: '#f59e0b', label: t('lowStockAlert'), icon: AlertTriangle };
    }
    return { color: '#10b981', label: 'Stock OK', icon: Package };
  };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('products')}</h1>
          <p style={styles.subtitle}>
            {productos.length} {productos.length === 1 ? 'producto' : 'productos'} registrados
          </p>
        </div>
        <button
          onClick={() => navigate('/productos/nuevo')}
          style={styles.addButton}
        >
          <Plus size={18} style={{ marginRight: '6px' }} />
          {t('newProduct')}
        </button>
      </div>

      {/* Filtros */}
      <div style={styles.filters}>
        <div style={styles.searchContainer}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder={`${t('search')} por código o descripción...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <select
          value={categoriaFilter}
          onChange={(e) => setCategoriaFilter(e.target.value)}
          style={styles.select}
        >
          <option value="">Todas las categorías</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>

        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={stockBajoFilter}
            onChange={(e) => setStockBajoFilter(e.target.checked)}
            style={styles.checkbox}
          />
          Solo stock bajo
        </label>
      </div>

      {/* Lista de productos */}
      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>{t('loading')}</p>
        </div>
      ) : productos.length === 0 ? (
        <div style={styles.noData}>
          <Package size={48} color="#9ca3af" />
          <p style={styles.noDataText}>{t('noData')}</p>
          <button
            onClick={() => navigate('/productos/nuevo')}
            style={styles.addButtonSecondary}
          >
            Crear primer producto
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {productos.map((producto) => {
            const stockStatus = getStockStatus(producto);
            const StatusIcon = stockStatus.icon;
            
            return (
              <div key={producto.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={{ flex: 1 }}>
                    <div style={styles.cardCode}>{producto.codigo}</div>
                    <h3 style={styles.cardTitle}>{producto.descripcion}</h3>
                    {producto.marca && (
                      <p style={styles.cardSubtitle}>{producto.marca}</p>
                    )}
                  </div>
                  {producto.categoria_nombre && (
                    <span style={styles.badge}>
                      <Layers size={14} style={{ marginRight: '4px' }} />
                      {producto.categoria_nombre}
                    </span>
                  )}
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.stockInfo}>
                    <StatusIcon size={18} color={stockStatus.color} />
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
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Mínimo:</span>
                      <span style={styles.infoValue}>
                        {producto.stock_minimo} {producto.unidad_medida}
                      </span>
                    </div>
                  )}

                  {producto.proveedor_nombre && (
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Proveedor:</span>
                      <span style={styles.infoValue}>{producto.proveedor_nombre}</span>
                    </div>
                  )}

                  {producto.precios_count > 0 && (
                    <div style={styles.priceInfo}>
                      <DollarSign size={16} color="#10b981" />
                      <span style={styles.priceText}>
                        {producto.precios_count} lista{producto.precios_count !== 1 ? 's' : ''} de precios
                      </span>
                    </div>
                  )}
                </div>

                <div style={styles.cardFooter}>
                  <button
                    onClick={() => navigate(`/productos/${producto.id}`)}
                    style={styles.viewButton}
                  >
                    <Eye size={16} style={{ marginRight: '6px' }} />
                    Ver
                  </button>
                  <button
                    onClick={() => navigate(`/productos/${producto.id}/editar`)}
                    style={styles.editButton}
                  >
                    <Edit size={16} style={{ marginRight: '6px' }} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(producto.id, producto.descripcion)}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
  addButton: {
    padding: '12px 24px',
    fontSize: '16px',
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
  addButtonSecondary: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: 'white',
    border: '2px solid #2563eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '20px',
  },
  filters: {
    display: 'flex',
    gap: '15px',
    marginBottom: '30px',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    color: '#9ca3af',
  },
  searchInput: {
    flex: 1,
    padding: '12px 16px 12px 45px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
  },
  select: {
    padding: '12px 40px 12px 16px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '15px',
    color: '#4b5563',
    cursor: 'pointer',
    userSelect: 'none',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
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
  noData: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  noDataText: {
    fontSize: '18px',
    color: '#6b7280',
    margin: '20px 0 0 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '2px solid #f3f4f6',
  },
  cardCode: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '4px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  cardSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  badge: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  },
  stockInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  stockLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  stockValue: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
  stockBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
  },
  infoLabel: {
    color: '#6b7280',
  },
  infoValue: {
    color: '#1f2937',
    fontWeight: '500',
  },
  priceInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#d1fae5',
    borderRadius: '6px',
  },
  priceText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#059669',
  },
  cardFooter: {
    display: 'flex',
    gap: '10px',
    paddingTop: '16px',
    borderTop: '2px solid #f3f4f6',
  },
  viewButton: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#d1fae5',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    padding: '10px 14px',
    fontSize: '16px',
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default Productos;