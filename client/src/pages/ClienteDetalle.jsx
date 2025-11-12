import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { buildTenantPath } from '../utils/tenantHelper';
import { useLanguage } from '../context/LanguageContext';
import { clientesApi } from '../api/clientes';
import Layout from '../components/Layout';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const ClienteDetalle = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const { showSuccess, showError, showConfirm } = useNotification();
  
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCliente();
  }, [id]);

  const loadCliente = async () => {
    try {
      setLoading(true);
      const data = await clientesApi.getById(id);
      setCliente(data.cliente);
    } catch (error) {
      showError(error.message);
      navigate(buildTenantPath('/clientes'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm(
      `¿Está seguro de eliminar el cliente "${cliente.razon_social}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      await clientesApi.delete(id);
      showSuccess('Cliente eliminado exitosamente');
      navigate(buildTenantPath('/clientes'));
    } catch (error) {
      showError(error.message);
    }
  };

  const getTipoLabel = (tipo) => {
    const labels = {
      minorista: t('retail'),
      mayorista: t('wholesale'),
      obra: t('construction'),
    };
    return labels[tipo] || tipo;
  };

  const getTipoColor = (tipo) => {
    const colors = {
      minorista: '#3b82f6',
      mayorista: '#10b981',
      obra: '#f59e0b',
    };
    return colors[tipo] || '#6b7280';
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

  if (!cliente) {
    return null;
  }

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{cliente.razon_social}</h1>
          {cliente.nombre_fantasia && (
            <p style={styles.subtitle}>{cliente.nombre_fantasia}</p>
          )}
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={() => navigate(buildTenantPath('/clientes'))}
            style={styles.backButton}
          >
            <ArrowLeft size={18} style={{ marginRight: '6px' }} />
            {t('back')}
          </button>
          <button
            onClick={() => navigate(buildTenantPath(`/clientes/${id}/editar`))}
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

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{t('taxId')}</span>
              <span style={styles.infoValue}>{cliente.cuit_dni || '-'}</span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{t('phone')}</span>
              <span style={styles.infoValue}>{cliente.telefono || '-'}</span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{t('email')}</span>
              <span style={styles.infoValue}>{cliente.email || '-'}</span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{t('creditLimit')}</span>
              <span style={styles.infoValue}>
                ${parseFloat(cliente.limite_credito || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{t('paymentTerms')}</span>
              <span style={styles.infoValue}>
                {cliente.condicion_pago?.replace('_', ' ') || '-'}
              </span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Nivel de Fidelización</span>
              <span style={{
                ...styles.infoValue,
                textTransform: 'capitalize',
                fontWeight: '600',
                color: cliente.nivel_fidelizacion === 'oro' ? '#f59e0b' : 
                       cliente.nivel_fidelizacion === 'plata' ? '#6b7280' : '#cd7f32'
              }}>
                {cliente.nivel_fidelizacion}
              </span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Puntos Acumulados</span>
              <span style={styles.infoValue}>{cliente.puntos_fidelizacion || 0}</span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Estado</span>
              <span style={{
                ...styles.badge,
                backgroundColor: cliente.activo ? '#d1fae5' : '#fee2e2',
                color: cliente.activo ? '#059669' : '#dc2626',
              }}>
                {cliente.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

        {/* Dirección */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Dirección</h2>
          
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{t('address')}</span>
              <span style={styles.infoValue}>{cliente.direccion || '-'}</span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>País</span>
              <span style={styles.infoValue}>{cliente.pais || '-'}</span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{t('province')}</span>
              <span style={styles.infoValue}>{cliente.provincia || '-'}</span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{t('city')}</span>
              <span style={styles.infoValue}>{cliente.localidad || '-'}</span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{t('postalCode')}</span>
              <span style={styles.infoValue}>{cliente.codigo_postal || '-'}</span>
            </div>
          </div>
        </div>

        {/* Contactos */}
        {cliente.contactos && cliente.contactos.length > 0 && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Personas de Contacto</h2>
            
            <div style={styles.contactsGrid}>
              {cliente.contactos.map(contacto => (
                <div key={contacto.id} style={styles.contactCard}>
                  <div style={styles.contactHeader}>
                    <h3 style={styles.contactName}>{contacto.nombre}</h3>
                    {contacto.principal === 1 && (
                      <span style={styles.primaryBadge}>Principal</span>
                    )}
                  </div>
                  {contacto.cargo && (
                    <p style={styles.contactCargo}>{contacto.cargo}</p>
                  )}
                  {contacto.telefono && (
                    <p style={styles.contactInfo}>Tel: {contacto.telefono}</p>
                  )}
                  {contacto.email && (
                    <p style={styles.contactInfo}>Email: {contacto.email}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observaciones */}
        {cliente.observaciones && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Observaciones</h2>
            <p style={styles.observaciones}>{cliente.observaciones}</p>
          </div>
        )}

        {/* Información de Sistema */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Información del Sistema</h2>
          
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Fecha de Creación</span>
              <span style={styles.infoValue}>
                {new Date(cliente.created_at).toLocaleDateString('es-AR')}
              </span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Última Actualización</span>
              <span style={styles.infoValue}>
                {new Date(cliente.updated_at).toLocaleDateString('es-AR')}
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
    textTransform: 'capitalize',
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
  contactsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  contactCard: {
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  contactHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  contactName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  primaryBadge: {
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    borderRadius: '4px',
  },
  contactCargo: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 12px 0',
  },
  contactInfo: {
    fontSize: '14px',
    color: '#4b5563',
    margin: '4px 0',
  },
  observaciones: {
    fontSize: '15px',
    color: '#4b5563',
    lineHeight: '1.6',
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
};

export default ClienteDetalle;