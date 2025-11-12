import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildTenantPath } from '../utils/tenantHelper';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { sucursalesApi } from '../api/sucursales';
import Layout from '../components/Layout';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail, 
  User,
  Building2,
  CheckCircle,
  XCircle,
  Search,
} from 'lucide-react';

const Sucursales = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showSuccess, showError, showConfirm } = useNotification();

  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');

  useEffect(() => {
    loadSucursales();
  }, []);

  const loadSucursales = async () => {
    try {
      setLoading(true);
      const data = await sucursalesApi.getAll();
      setSucursales(data.sucursales);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    const sucursal = sucursales.find(s => s.id === id);
    const accion = sucursal.activa ? 'desactivar' : 'activar';
    
    const confirmed = await showConfirm(
      `¿Confirmar ${accion} la sucursal "${sucursal.nombre}"?`
    );

    if (!confirmed) return;

    try {
      await sucursalesApi.toggle(id);
      showSuccess(`Sucursal ${accion === 'activar' ? 'activada' : 'desactivada'} exitosamente`);
      loadSucursales();
    } catch (error) {
      showError(error.message);
    }
  };

  const handleDelete = async (id) => {
    const sucursal = sucursales.find(s => s.id === id);
    
    if (sucursal.codigo === 'CASA-CENTRAL') {
      showError('No se puede eliminar la casa central');
      return;
    }

    const confirmed = await showConfirm(
      `¿Confirmar eliminar la sucursal "${sucursal.nombre}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      await sucursalesApi.delete(id);
      showSuccess('Sucursal eliminada exitosamente');
      loadSucursales();
    } catch (error) {
      showError(error.message);
    }
  };

  const sucursalesFiltradas = sucursales.filter(sucursal => {
    const matchSearch = 
      sucursal.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sucursal.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sucursal.ciudad && sucursal.ciudad.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchEstado = 
      filtroEstado === 'todas' ||
      (filtroEstado === 'activas' && sucursal.activa) ||
      (filtroEstado === 'inactivas' && !sucursal.activa);

    return matchSearch && matchEstado;
  });

  const stats = {
    total: sucursales.length,
    activas: sucursales.filter(s => s.activa).length,
    inactivas: sucursales.filter(s => !s.activa).length,
  };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('branches')}</h1>
          <p style={styles.subtitle}>Gestión de sucursales del negocio</p>
        </div>
        <button
          onClick={() => navigate(buildTenantPath('/sucursales/nueva'))}
          style={styles.addButton}
        >
          <Plus size={18} style={{ marginRight: '6px' }} />
          Nueva Sucursal
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#dbeafe' }}>
            <Building2 size={24} color="#2563eb" />
          </div>
          <div>
            <div style={styles.statLabel}>Total</div>
            <div style={styles.statValue}>{stats.total}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#d1fae5' }}>
            <CheckCircle size={24} color="#10b981" />
          </div>
          <div>
            <div style={styles.statLabel}>Activas</div>
            <div style={styles.statValue}>{stats.activas}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#fee2e2' }}>
            <XCircle size={24} color="#dc2626" />
          </div>
          <div>
            <div style={styles.statLabel}>Inactivas</div>
            <div style={styles.statValue}>{stats.inactivas}</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={styles.filtersBox}>
        <div style={styles.searchBox}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por nombre, código o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterButtons}>
          <button
            onClick={() => setFiltroEstado('todas')}
            style={{
              ...styles.filterButton,
              ...(filtroEstado === 'todas' ? styles.filterButtonActive : {})
            }}
          >
            Todas ({stats.total})
          </button>
          <button
            onClick={() => setFiltroEstado('activas')}
            style={{
              ...styles.filterButton,
              ...(filtroEstado === 'activas' ? styles.filterButtonActive : {})
            }}
          >
            Activas ({stats.activas})
          </button>
          <button
            onClick={() => setFiltroEstado('inactivas')}
            style={{
              ...styles.filterButton,
              ...(filtroEstado === 'inactivas' ? styles.filterButtonActive : {})
            }}
          >
            Inactivas ({stats.inactivas})
          </button>
        </div>
      </div>

      {/* Lista de Sucursales */}
      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>{t('loading')}</p>
        </div>
      ) : sucursalesFiltradas.length === 0 ? (
        <div style={styles.noData}>
          <Building2 size={48} color="#9ca3af" />
          <p style={styles.noDataText}>
            {searchTerm || filtroEstado !== 'todas' 
              ? 'No se encontraron sucursales con los filtros aplicados'
              : 'No hay sucursales registradas'
            }
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {sucursalesFiltradas.map((sucursal) => (
            <div key={sucursal.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitleRow}>
                  <h3 style={styles.cardTitle}>{sucursal.nombre}</h3>
                  {sucursal.codigo === 'CASA-CENTRAL' && (
                    <span style={styles.centralBadge}>Principal</span>
                  )}
                </div>
                <span style={{
                  ...styles.estadoBadge,
                  backgroundColor: sucursal.activa ? '#d1fae5' : '#fee2e2',
                  color: sucursal.activa ? '#065f46' : '#991b1b',
                }}>
                  {sucursal.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.infoRow}>
                  <span style={styles.codigo}>#{sucursal.codigo}</span>
                </div>

                {sucursal.direccion && (
                  <div style={styles.infoRow}>
                    <MapPin size={16} style={styles.infoIcon} />
                    <span style={styles.infoText}>
                      {sucursal.direccion}
                      {sucursal.ciudad && `, ${sucursal.ciudad}`}
                      {sucursal.provincia && `, ${sucursal.provincia}`}
                    </span>
                  </div>
                )}

                {sucursal.telefono && (
                  <div style={styles.infoRow}>
                    <Phone size={16} style={styles.infoIcon} />
                    <span style={styles.infoText}>{sucursal.telefono}</span>
                  </div>
                )}

                {sucursal.email && (
                  <div style={styles.infoRow}>
                    <Mail size={16} style={styles.infoIcon} />
                    <span style={styles.infoText}>{sucursal.email}</span>
                  </div>
                )}

                {sucursal.responsable && (
                  <div style={styles.infoRow}>
                    <User size={16} style={styles.infoIcon} />
                    <span style={styles.infoText}>{sucursal.responsable}</span>
                  </div>
                )}
              </div>

              <div style={styles.cardActions}>
                <button
                  onClick={() => navigate(buildTenantPath(`/sucursales/${sucursal.id}/editar`))}
                  style={styles.editButton}
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleToggle(sucursal.id)}
                  style={{
                    ...styles.toggleButton,
                    color: sucursal.activa ? '#dc2626' : '#10b981',
                  }}
                  title={sucursal.activa ? 'Desactivar' : 'Activar'}
                >
                  {sucursal.activa ? <XCircle size={16} /> : <CheckCircle size={16} />}
                </button>
                {sucursal.codigo !== 'CASA-CENTRAL' && (
                  <button
                    onClick={() => handleDelete(sucursal.id)}
                    style={styles.deleteButton}
                    title="Eliminar"
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
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  statIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  filtersBox: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    marginBottom: '30px',
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchBox: {
    flex: '1 1 300px',
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#6b7280',
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px 10px 45px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
  },
  filterButtons: {
    display: 'flex',
    gap: '10px',
  },
  filterButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterButtonActive: {
    color: '#10b981',
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
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
    borderTop: '5px solid #10b981',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  noData: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '60px 20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    textAlign: 'center',
  },
  noDataText: {
    fontSize: '16px',
    color: '#6b7280',
    margin: '16px 0 0 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    border: '2px solid #f3f4f6',
    transition: 'all 0.2s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '2px solid #f3f4f6',
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  centralBadge: {
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderRadius: '12px',
  },
  estadoBadge: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '12px',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '16px',
  },
  codigo: {
    padding: '4px 10px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    fontSize: '13px',
    fontWeight: '700',
    borderRadius: '6px',
    fontFamily: 'monospace',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  infoIcon: {
    color: '#6b7280',
    flexShrink: 0,
  },
  infoText: {
    color: '#4b5563',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    paddingTop: '12px',
    borderTop: '1px solid #f3f4f6',
  },
  editButton: {
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
  toggleButton: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#f9fafb',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    fontWeight: '600',
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

export default Sucursales;