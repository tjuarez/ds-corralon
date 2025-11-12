import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildTenantPath } from '../utils/tenantHelper';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { proveedoresApi } from '../api/proveedores';
import Layout from '../components/Layout';
import { Plus, Search, Eye, Edit, Trash2, Phone, Mail, MapPin, IdCard, Users as UsersIcon, Package, Globe } from 'lucide-react';

const Proveedores = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showSuccess, showError, showConfirm } = useNotification();
  
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProveedores();
  }, [search]);

  const loadProveedores = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (search) filters.search = search;
      
      const data = await proveedoresApi.getAll(filters);
      setProveedores(data.proveedores);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, razonSocial) => {
    const confirmed = await showConfirm(
      `¿Está seguro de eliminar el proveedor "${razonSocial}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      await proveedoresApi.delete(id);
      showSuccess('Proveedor eliminado exitosamente');
      loadProveedores();
    } catch (error) {
      showError(error.message);
    }
  };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('providers')}</h1>
          <p style={styles.subtitle}>
            {proveedores.length} {proveedores.length === 1 ? 'proveedor' : 'proveedores'} registrados
          </p>
        </div>
        <button
          onClick={() => navigate(buildTenantPath('/proveedores/nuevo'))}
          style={styles.addButton}
        >
          <Plus size={18} style={{ marginRight: '6px' }} />
          {t('newProvider')}
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
      </div>

      {/* Lista de proveedores */}
      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>{t('loading')}</p>
        </div>
      ) : proveedores.length === 0 ? (
        <div style={styles.noData}>
          <Package size={48} color="#9ca3af" />
          <p style={styles.noDataText}>{t('noData')}</p>
          <button
            onClick={() => navigate(buildTenantPath('/proveedores/nuevo'))}
            style={styles.addButtonSecondary}
          >
            Crear primer proveedor
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {proveedores.map((proveedor) => (
            <div key={proveedor.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.cardTitle}>{proveedor.razon_social}</h3>
                  {proveedor.nombre_fantasia && (
                    <p style={styles.cardSubtitle}>{proveedor.nombre_fantasia}</p>
                  )}
                </div>
                {!proveedor.activo && (
                  <span style={styles.inactiveBadge}>Inactivo</span>
                )}
              </div>

              <div style={styles.cardBody}>
                {proveedor.cuit_dni && (
                  <div style={styles.infoRow}>
                    <IdCard size={16} style={styles.infoIcon} />
                    <span style={styles.infoValue}>{proveedor.cuit_dni}</span>
                  </div>
                )}
                {proveedor.telefono && (
                  <div style={styles.infoRow}>
                    <Phone size={16} style={styles.infoIcon} />
                    <span style={styles.infoValue}>{proveedor.telefono}</span>
                  </div>
                )}
                {proveedor.email && (
                  <div style={styles.infoRow}>
                    <Mail size={16} style={styles.infoIcon} />
                    <span style={styles.infoValue}>{proveedor.email}</span>
                  </div>
                )}
                {proveedor.sitio_web && (
                  <div style={styles.infoRow}>
                    <Globe size={16} style={styles.infoIcon} />
                    <span style={styles.infoValue}>{proveedor.sitio_web}</span>
                  </div>
                )}
                {proveedor.localidad && (
                  <div style={styles.infoRow}>
                    <MapPin size={16} style={styles.infoIcon} />
                    <span style={styles.infoValue}>
                      {proveedor.localidad}
                      {proveedor.provincia && `, ${proveedor.provincia}`}
                    </span>
                  </div>
                )}
                <div style={styles.statsRow}>
                  <div style={styles.statItem}>
                    <UsersIcon size={16} style={styles.infoIcon} />
                    <span style={styles.infoValue}>
                      {proveedor.contactos_count} contacto{proveedor.contactos_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={styles.statItem}>
                    <Package size={16} style={styles.infoIcon} />
                    <span style={styles.infoValue}>
                      {proveedor.productos_count} producto{proveedor.productos_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.cardFooter}>
                <button
                  onClick={() => navigate(buildTenantPath(`/proveedores/${proveedor.id}`))}
                  style={styles.viewButton}
                >
                  <Eye size={16} style={{ marginRight: '6px' }} />
                  Ver
                </button>
                <button
                  onClick={() => navigate(buildTenantPath(`/proveedores/${proveedor.id}/editar`))}
                  style={styles.editButton}
                >
                  <Edit size={16} style={{ marginRight: '6px' }} />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(proveedor.id, proveedor.razon_social)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={16} />
                </button>
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
  inactiveBadge: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
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
  statsRow: {
    display: 'flex',
    gap: '20px',
    marginTop: '8px',
    paddingTop: '12px',
    borderTop: '1px solid #f3f4f6',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
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

export default Proveedores;