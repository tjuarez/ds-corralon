import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { clientesApi } from '../api/clientes';
import Layout from '../components/Layout';
import { Plus, Search, Eye, Edit, Trash2, Phone, Mail, MapPin, IdCard, Users as UsersIcon } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const Clientes = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showSuccess, showError, showConfirm } = useNotification();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');

  useEffect(() => {
    loadClientes();
  }, [search, tipoFilter]);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (search) filters.search = search;
      if (tipoFilter) filters.tipo_cliente = tipoFilter;
      
      const data = await clientesApi.getAll(filters);
      setClientes(data.clientes);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, razonSocial) => {
    const confirmed = await showConfirm(
      `¿Está seguro de eliminar el cliente "${razonSocial}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      await clientesApi.delete(id);
      showSuccess('Cliente eliminado exitosamente');
      loadClientes();
    } catch (error) {
      showError(error.message);
    }
  };

  const getTipoColor = (tipo) => {
    const colors = {
      minorista: '#3b82f6',
      mayorista: '#10b981',
      obra: '#f59e0b',
    };
    return colors[tipo] || '#6b7280';
  };

  const getTipoLabel = (tipo) => {
    const labels = {
      minorista: t('retail'),
      mayorista: t('wholesale'),
      obra: t('construction'),
    };
    return labels[tipo] || tipo;
  };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('clients')}</h1>
          <p style={styles.subtitle}>
            {clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'} registrados
          </p>
        </div>
        <button
          onClick={() => navigate('/clientes/nuevo')}
          style={styles.addButton}
        >
          <Plus size={18} style={{ marginRight: '6px' }} />
          Nuevo Cliente
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
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          style={styles.select}
        >
          <option value="">Todos los tipos</option>
          <option value="minorista">{t('retail')}</option>
          <option value="mayorista">{t('wholesale')}</option>
          <option value="obra">{t('construction')}</option>
        </select>
      </div>

      {/* Lista de clientes */}
      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>{t('loading')}</p>
        </div>
      ) : clientes.length === 0 ? (
        <div style={styles.noData}>
          <p style={styles.noDataText}>{t('noData')}</p>
          <button
            onClick={() => navigate('/clientes/nuevo')}
            style={styles.addButtonSecondary}
          >
            Crear primer cliente
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {clientes.map((cliente) => (
            <div key={cliente.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.cardTitle}>{cliente.razon_social}</h3>
                  {cliente.nombre_fantasia && (
                    <p style={styles.cardSubtitle}>{cliente.nombre_fantasia}</p>
                  )}
                </div>
                <span
                  style={{
                    ...styles.badge,
                    backgroundColor: getTipoColor(cliente.tipo_cliente) + '20',
                    color: getTipoColor(cliente.tipo_cliente),
                  }}
                >
                  {getTipoLabel(cliente.tipo_cliente)}
                </span>
              </div>

              <div style={styles.cardBody}>
                {cliente.cuit_dni && (
                  <div style={styles.infoRow}>
                    <IdCard size={16} style={styles.infoIcon} />
                    <span style={styles.infoValue}>{cliente.cuit_dni}</span>
                  </div>
                )}
                {cliente.telefono && (
                  <div style={styles.infoRow}>
                    <Phone size={16} style={styles.infoIcon} />
                    <span style={styles.infoValue}>{cliente.telefono}</span>
                  </div>
                )}
                {cliente.email && (
                  <div style={styles.infoRow}>
                    <Mail size={16} style={styles.infoIcon} />
                    <span style={styles.infoValue}>{cliente.email}</span>
                  </div>
                )}
                {cliente.localidad && (
                  <div style={styles.infoRow}>
                    <MapPin size={16} style={styles.infoIcon} />
                    <span style={styles.infoValue}>
                      {cliente.localidad}
                      {cliente.provincia && `, ${cliente.provincia}`}
                    </span>
                  </div>
                )}
                <div style={styles.infoRow}>
                  <UsersIcon size={16} style={styles.infoIcon} />
                  <span style={styles.infoValue}>
                    {cliente.contactos_count} contacto{cliente.contactos_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div style={styles.cardFooter}>
                <button
                  onClick={() => navigate(`/clientes/${cliente.id}`)}
                  style={styles.viewButton}
                >
                  <Eye size={16} style={{ marginRight: '6px' }} />
                  Ver
                </button>
                <button
                  onClick={() => navigate(`/clientes/${cliente.id}/editar`)}
                  style={styles.editButton}
                >
                  <Edit size={16} style={{ marginRight: '6px' }} />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(cliente.id, cliente.razon_social)}
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
  select: {
    padding: '12px 40px 12px 16px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
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
    margin: 0,
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
  badge: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
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
  infoLabel: {
    fontSize: '16px',
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
  infoIcon: {
    color: '#6b7280',
    flexShrink: 0,
  },
};

export default Clientes;