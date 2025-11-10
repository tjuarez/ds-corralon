import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { movimientosStockApi } from '../api/movimientosStock';
import Layout from '../components/Layout';
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Package,
  Calendar,
  Download,
  ArrowUpCircle,
  ArrowDownCircle,
  Settings,
} from 'lucide-react';

const MovimientosStock = () => {
  const { t } = useLanguage();
  const { showError } = useNotification();
  const { user, sucursalActiva } = useAuth();

  const [loading, setLoading] = useState(true);
  const [movimientos, setMovimientos] = useState([]);
  const [resumen, setResumen] = useState([]);

  const [filters, setFilters] = useState({
    search: '',
    tipo_movimiento: '',
    fecha_desde: '',
    fecha_hasta: '',
    sucursal_id: sucursalActiva?.id || '',
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Actualizar sucursal en filtros cuando cambia
    if (sucursalActiva) {
      setFilters(prev => ({ ...prev, sucursal_id: sucursalActiva.id }));
      loadData();
    }
  }, [sucursalActiva]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const filterParams = {
        ...filters,
        sucursal_id: sucursalActiva?.id || filters.sucursal_id
      };

      const [movimientosData, resumenData] = await Promise.all([
        movimientosStockApi.getAll(filterParams),
        movimientosStockApi.getResumen(filterParams)
      ]);

      setMovimientos(movimientosData.movimientos || []);
      setResumen(resumenData.resumen || []);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    loadData();
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      tipo_movimiento: '',
      fecha_desde: '',
      fecha_hasta: '',
      sucursal_id: sucursalActiva?.id || '',
    });
    setTimeout(() => loadData(), 100);
  };

  const getTipoMovimientoLabel = (tipo) => {
    const tipos = {
      'entrada': 'Entrada',
      'salida': 'Salida',
      'ajuste': 'Ajuste',
      'transferencia_salida': 'Transfer. Salida',
      'transferencia_entrada': 'Transfer. Entrada',
    };
    return tipos[tipo] || tipo;
  };

  const getTipoMovimientoStyle = (tipo) => {
    const estilos = {
      'entrada': { bg: '#d1fae5', color: '#065f46', icon: ArrowUpCircle },
      'salida': { bg: '#fee2e2', color: '#991b1b', icon: ArrowDownCircle },
      'ajuste': { bg: '#fef3c7', color: '#92400e', icon: Settings },
      'transferencia_salida': { bg: '#dbeafe', color: '#1e40af', icon: TrendingDown },
      'transferencia_entrada': { bg: '#e0e7ff', color: '#3730a3', icon: TrendingUp },
    };
    return estilos[tipo] || { bg: '#f3f4f6', color: '#6b7280', icon: Package };
  };

  const getResumenCard = (tipo) => {
    const item = resumen.find(r => r.tipo_movimiento === tipo);
    return {
      cantidad: item?.cantidad_movimientos || 0,
      total: item?.cantidad_total || 0
    };
  };

  if (loading && movimientos.length === 0) {
    return (
      <Layout>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>{t('loading')}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('stockMovements')}</h1>
          <p style={styles.subtitle}>
            {t('stockMovementsSubtitle')}
          </p>
        </div>
        <button onClick={loadData} style={styles.refreshButton}>
          <RefreshCw size={18} style={{ marginRight: '6px' }} />
          {t('update')}
        </button>
      </div>

      {/* Resumen de movimientos */}
      <div style={styles.resumenGrid}>
<div style={styles.resumenCard}>
          <div style={{ ...styles.resumenIcon, backgroundColor: '#d1fae5' }}>
            <ArrowUpCircle size={24} color="#065f46" />
          </div>
          <div>
            <div style={styles.resumenLabel}>{t('entries')}</div>
            <div style={styles.resumenValue}>
              {getResumenCard('entrada').cantidad} {t('movements')}
            </div>
            <div style={styles.resumenCantidad}>
              {getResumenCard('entrada').total.toLocaleString('es-AR')} {t('units')}
            </div>
          </div>
        </div>

        <div style={styles.resumenCard}>
          <div style={{ ...styles.resumenIcon, backgroundColor: '#fee2e2' }}>
            <ArrowDownCircle size={24} color="#991b1b" />
          </div>
          <div>
            <div style={styles.resumenLabel}>{t('exits')}</div>
            <div style={styles.resumenValue}>
              {getResumenCard('salida').cantidad} {t('movements')}
            </div>
            <div style={styles.resumenCantidad}>
              {getResumenCard('salida').total.toLocaleString('es-AR')} {t('units')}
            </div>
          </div>
        </div>

        <div style={styles.resumenCard}>
          <div style={{ ...styles.resumenIcon, backgroundColor: '#fef3c7' }}>
            <Settings size={24} color="#92400e" />
          </div>
          <div>
            <div style={styles.resumenLabel}>{t('adjustments')}</div>
            <div style={styles.resumenValue}>
              {getResumenCard('ajuste').cantidad} {t('movements')}
            </div>
            <div style={styles.resumenCantidad}>
              {getResumenCard('ajuste').total.toLocaleString('es-AR')} {t('units')}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div style={styles.searchBar}>
        <div style={styles.searchInputContainer}>
          <Search size={20} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por código o descripción..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            style={styles.searchInput}
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            ...styles.filterButton,
            ...(showFilters ? styles.filterButtonActive : {})
          }}
        >
          <Filter size={18} style={{ marginRight: '6px' }} />
          {t('filters')}
        </button>

        <button onClick={handleApplyFilters} style={styles.searchButton}>
          <Search size={18} style={{ marginRight: '6px' }} />
          {t('search')}
        </button>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div style={styles.filtersPanel}>
          <div style={styles.filtersGrid}>
<div style={styles.filterGroup}>
              <label style={styles.filterLabel}>{t('movementType')}</label>
              <select
                value={filters.tipo_movimiento}
                onChange={(e) => handleFilterChange('tipo_movimiento', e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">{t('all')}</option>
                <option value="entrada">{t('entry')}</option>
                <option value="salida">{t('exit')}</option>
                <option value="ajuste">{t('adjustment')}</option>
                <option value="transferencia_salida">{t('transferOut')}</option>
                <option value="transferencia_entrada">{t('transferIn')}</option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>{t('from')}</label>
              <input
                type="date"
                value={filters.fecha_desde}
                onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
                style={styles.filterInput}
              />
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>{t('to')}</label>
              <input
                type="date"
                value={filters.fecha_hasta}
                onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
                style={styles.filterInput}
              />
            </div>
          </div>

          <div style={styles.filtersActions}>
            <button onClick={handleClearFilters} style={styles.clearButton}>
                {t('clearFilters')}
            </button>
            <button onClick={handleApplyFilters} style={styles.applyButton}>
                {t('applyFilters')}
            </button>
          </div>
        </div>
      )}

      {/* Tabla de movimientos */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>{t('date')}</th>
              <th style={styles.th}>{t('type')}</th>
              <th style={styles.th}>{t('product')}</th>
              <th style={styles.th}>{t('branch')}</th>
              <th style={styles.thRight}>{t('quantity')}</th>
              <th style={styles.thRight}>{t('previousStock')}</th>
              <th style={styles.thRight}>{t('newStock')}</th>
              <th style={styles.th}>{t('reason')}</th>
              <th style={styles.th}>{t('user')}</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.length === 0 ? (
<tr>
                <td colSpan="9" style={styles.emptyCell}>
                  <Package size={48} color="#d1d5db" />
                  <p style={styles.emptyText}>{t('noStockMovements')}</p>
                </td>
              </tr>
            ) : (
              movimientos.map((mov) => {
                const tipoStyle = getTipoMovimientoStyle(mov.tipo_movimiento);
                const Icon = tipoStyle.icon;

                return (
                  <tr key={mov.id} style={styles.tr}>
                    <td style={styles.td}>
                      {new Date(mov.fecha).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: tipoStyle.bg,
                        color: tipoStyle.color
                      }}>
                        <Icon size={14} />
                        {getTipoMovimientoLabel(mov.tipo_movimiento)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.productoCell}>
                        <span style={styles.productoCodigo}>{mov.producto_codigo}</span>
                        <span style={styles.productoDescripcion}>{mov.producto_descripcion}</span>
                      </div>
                    </td>
                    <td style={styles.td}>{mov.sucursal_nombre}</td>
                    <td style={styles.tdRight}>
                      <span style={styles.cantidad}>
                        {parseFloat(mov.cantidad).toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} {mov.unidad_medida}
                      </span>
                    </td>
                    <td style={styles.tdRight}>
                      {parseFloat(mov.stock_anterior).toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                    <td style={styles.tdRight}>
                      <strong>
                        {parseFloat(mov.stock_nuevo).toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </strong>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.motivo}>{mov.motivo}</span>
                    </td>
                    <td style={styles.td}>{mov.usuario_nombre}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
  refreshButton: {
    padding: '10px 20px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
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
  resumenGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  resumenCard: {
    display: 'flex',
    gap: '16px',
    padding: '24px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  resumenIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  resumenLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  resumenValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '4px',
  },
  resumenCantidad: {
    fontSize: '13px',
    color: '#6b7280',
  },
  searchBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  },
  searchInputContainer: {
    flex: 1,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
  },
  searchInput: {
    width: '100%',
    padding: '12px 14px 12px 44px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
  },
  filterButton: {
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  filterButtonActive: {
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  searchButton: {
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  filtersPanel: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  filterSelect: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  filterInput: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
  },
  filtersActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  clearButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  applyButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    borderBottom: '2px solid #e5e7eb',
  },
  thRight: {
    padding: '16px',
    textAlign: 'right',
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    borderBottom: '2px solid #e5e7eb',
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: '#1f2937',
  },
  tdRight: {
    padding: '16px',
    textAlign: 'right',
    fontSize: '14px',
    color: '#1f2937',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
  },
  productoCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  productoCodigo: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
  },
  productoDescripcion: {
    fontSize: '14px',
    color: '#1f2937',
  },
  cantidad: {
    fontWeight: '600',
    color: '#2563eb',
  },
  motivo: {
    fontSize: '13px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  emptyCell: {
    padding: '60px 20px',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: '16px',
    fontSize: '16px',
    color: '#9ca3af',
  },
};

export default MovimientosStock;