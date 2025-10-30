import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { presupuestosApi } from '../api/presupuestos';
import Layout from '../components/Layout';
import { Plus, Search, Eye, Edit, Trash2, FileText, Calendar, DollarSign, User, Clock } from 'lucide-react';

const Presupuestos = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showSuccess, showError, showConfirm } = useNotification();
  
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');

  useEffect(() => {
    loadPresupuestos();
  }, [search, estadoFilter]);

  const loadPresupuestos = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (search) filters.search = search;
      if (estadoFilter) filters.estado = estadoFilter;
      
      const data = await presupuestosApi.getAll(filters);
      setPresupuestos(data.presupuestos);
    } catch (error) {
      console.error('Error al cargar presupuestos:', error);
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, numero) => {
    const confirmed = await showConfirm(
      `¿Está seguro de eliminar el presupuesto "${numero}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      await presupuestosApi.delete(id);
      showSuccess('Presupuesto eliminado exitosamente');
      loadPresupuestos();
    } catch (error) {
      showError(error.message);
    }
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      pendiente: { color: '#f59e0b', bg: '#fef3c7', label: t('pending') },
      aprobado: { color: '#10b981', bg: '#d1fae5', label: t('approved') },
      rechazado: { color: '#dc2626', bg: '#fee2e2', label: t('rejected') },
      convertido: { color: '#6366f1', bg: '#e0e7ff', label: t('converted') },
    };

    const config = estados[estado] || estados.pendiente;

    return (
      <span style={{
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: config.bg,
        color: config.color,
      }}>
        {config.label}
      </span>
    );
  };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('quotes')}</h1>
          <p style={styles.subtitle}>
            {presupuestos.length} {presupuestos.length === 1 ? 'presupuesto' : 'presupuestos'} registrados
          </p>
        </div>
        <button
          onClick={() => navigate('/presupuestos/nuevo')}
          style={styles.addButton}
        >
          <Plus size={18} style={{ marginRight: '6px' }} />
          {t('newQuote')}
        </button>
      </div>

      {/* Filtros */}
      <div style={styles.filters}>
        <div style={styles.searchContainer}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder={`${t('search')}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">{t('pending')}</option>
          <option value="aprobado">{t('approved')}</option>
          <option value="rechazado">{t('rejected')}</option>
          <option value="convertido">{t('converted')}</option>
        </select>
      </div>

      {/* Lista de presupuestos */}
      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>{t('loading')}</p>
        </div>
      ) : presupuestos.length === 0 ? (
        <div style={styles.noData}>
          <FileText size={48} color="#9ca3af" />
          <p style={styles.noDataText}>{t('noData')}</p>
          <button
            onClick={() => navigate('/presupuestos/nuevo')}
            style={styles.addButtonSecondary}
          >
            Crear primer presupuesto
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {presupuestos.map((presupuesto) => (
            <div key={presupuesto.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.cardNumber}>{presupuesto.numero}</div>
                  <h3 style={styles.cardTitle}>{presupuesto.cliente_nombre}</h3>
                </div>
                {getEstadoBadge(presupuesto.estado)}
              </div>

              <div style={styles.cardBody}>
                <div style={styles.infoRow}>
                  <Calendar size={16} style={styles.infoIcon} />
                  <span style={styles.infoValue}>
                    {new Date(presupuesto.fecha).toLocaleDateString('es-AR')}
                  </span>
                </div>

                {presupuesto.fecha_vencimiento && (
                  <div style={styles.infoRow}>
                    <Clock size={16} style={styles.infoIcon} />
                    <span style={{
                      ...styles.infoValue,
                      color: presupuesto.fecha_vencimiento && new Date(presupuesto.fecha_vencimiento) < new Date() ? '#dc2626' : '#10b981',
                      fontWeight: '600',
                    }}>
                      {presupuesto.fecha_vencimiento ? (
                        <>
                          Válido hasta: {new Date(presupuesto.fecha_vencimiento).toLocaleDateString('es-AR')}
                          {new Date(presupuesto.fecha_vencimiento) < new Date() && ' ⚠️'}
                        </>
                      ) : (
                        'Sin vencimiento'
                      )}
                    </span>
                  </div>
                )}

                <div style={styles.infoRow}>
                  <DollarSign size={16} style={styles.infoIcon} />
                  <span style={styles.infoValue}>
                    {presupuesto.moneda_simbolo} {parseFloat(presupuesto.total).toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>

                {presupuesto.usuario_nombre && (
                  <div style={styles.infoRow}>
                    <User size={16} style={styles.infoIcon} />
                    <span style={styles.infoValue}>{presupuesto.usuario_nombre}</span>
                  </div>
                )}
              </div>

              <div style={styles.cardFooter}>
                <button
                  onClick={() => navigate(`/presupuestos/${presupuesto.id}`)}
                  style={styles.viewButton}
                >
                  <Eye size={16} style={{ marginRight: '6px' }} />
                  Ver
                </button>
                {presupuesto.estado !== 'convertido' && (
                  <button
                    onClick={() => navigate(`/presupuestos/${presupuesto.id}/editar`)}
                    style={styles.editButton}
                  >
                    <Edit size={16} style={{ marginRight: '6px' }} />
                    Editar
                  </button>
                )}
                {presupuesto.estado !== 'convertido' && (
                  <button
                    onClick={() => handleDelete(presupuesto.id, presupuesto.numero)}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
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
  filterSelect: {
    padding: '12px 40px 12px 14px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '200px',
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
  cardNumber: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '4px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '16px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
  },
  infoIcon: {
    color: '#6b7280',
    flexShrink: 0,
  },
  infoValue: {
    color: '#4b5563',
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

export default Presupuestos;