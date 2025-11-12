import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { buildTenantPath } from '../utils/tenantHelper';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { proveedoresApi } from '../api/proveedores';
import Layout from '../components/Layout';
import { ArrowLeft, Edit, Trash2, MapPin, Globe, Package } from 'lucide-react';

const ProveedorDetalle = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const { showSuccess, showError, showConfirm } = useNotification();
  
  const [proveedor, setProveedor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProveedor();
  }, [id]);

  const loadProveedor = async () => {
    try {
      setLoading(true);
      const data = await proveedoresApi.getById(id);
      setProveedor(data.proveedor);
    } catch (error) {
      showError(error.message);
      navigate(buildTenantPath('/proveedores'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm(
      `¿Está seguro de eliminar el proveedor "${proveedor.razon_social}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      await proveedoresApi.delete(id);
      showSuccess('Proveedor eliminado exitosamente');
      navigate(buildTenantPath('/proveedores'));
    } catch (error) {
      showError(error.message);
    }
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

  if (!proveedor) {
    return null;
  }

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{proveedor.razon_social}</h1>
          {proveedor.nombre_fantasia && (
            <p style={styles.subtitle}>{proveedor.nombre_fantasia}</p>
          )}
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={() => navigate(buildTenantPath('/proveedores'))}
            style={styles.backButton}
          >
            <ArrowLeft size={18} style={{ marginRight: '6px' }} />
            {t('back')}
          </button>
          <button
            onClick={() => navigate(buildTenantPath(`/proveedores/${id}/editar`))}
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
          </div>

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{t('taxId')}</span>
              <span style={styles.infoValue}>{proveedor.cuit_dni || '-'}</span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{t('phone')}</span>
              <span style={styles.infoValue}>{proveedor.telefono || '-'}</span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{t('email')}</span>
              <span style={styles.infoValue}>{proveedor.email || '-'}</span>
            </div>

            {proveedor.sitio_web && (
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>
                  <Globe size={14} style={{ marginRight: '4px', display: 'inline' }} />
                  {t('website')}
                </span>
                <a 
                  href={proveedor.sitio_web} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={styles.linkValue}
                >
                  {proveedor.sitio_web}
                </a>
              </div>
            )}

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{t('paymentTerms')}</span>
              <span style={{
                ...styles.infoValue,
                textTransform: 'capitalize'
              }}>
                {proveedor.condicion_pago?.replace('_', ' ') || '-'}
              </span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Estado</span>
              <span style={{
                ...styles.badge,
                backgroundColor: proveedor.activo ? '#d1fae5' : '#fee2e2',
                color: proveedor.activo ? '#059669' : '#dc2626',
              }}>
                {proveedor.activo ? 'Activo' : 'Inactivo'}
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
              <span style={styles.infoValue}>{proveedor.direccion || '-'}</span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>País</span>
              <span style={styles.infoValue}>{proveedor.pais || '-'}</span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{t('province')}</span>
              <span style={styles.infoValue}>{proveedor.provincia || '-'}</span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{t('city')}</span>
              <span style={styles.infoValue}>{proveedor.localidad || '-'}</span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{t('postalCode')}</span>
              <span style={styles.infoValue}>{proveedor.codigo_postal || '-'}</span>
            </div>
          </div>
        </div>

        {/* Productos Asociados */}
        {proveedor.productos && proveedor.productos.length > 0 && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>{t('associatedProducts')}</h2>
              <span style={styles.badge}>
                <Package size={14} style={{ marginRight: '6px' }} />
                {proveedor.productos.length} producto{proveedor.productos.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div style={styles.productsList}>
              {proveedor.productos.map(producto => (
                <div 
                  key={producto.id} 
                  style={styles.productCard}
                  onClick={() => navigate(buildTenantPath(`/productos/${producto.id}`))}
                >
                  <div style={styles.productCode}>{producto.codigo}</div>
                  <div style={styles.productDescription}>{producto.descripcion}</div>
                  <div style={styles.productStock}>
                    Stock: {producto.stock_actual}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contactos */}
        {proveedor.contactos && proveedor.contactos.length > 0 && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Personas de Contacto</h2>
            
            <div style={styles.contactsGrid}>
              {proveedor.contactos.map(contacto => (
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
        {proveedor.observaciones && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Observaciones</h2>
            <p style={styles.observaciones}>{proveedor.observaciones}</p>
          </div>
        )}

        {/* Información de Sistema */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Información del Sistema</h2>
          
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Fecha de Creación</span>
              <span style={styles.infoValue}>
                {new Date(proveedor.created_at).toLocaleDateString('es-AR')}
              </span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Última Actualización</span>
              <span style={styles.infoValue}>
                {new Date(proveedor.updated_at).toLocaleDateString('es-AR')}
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
  linkValue: {
    fontSize: '16px',
    color: '#2563eb',
    fontWeight: '500',
    textDecoration: 'none',
    transition: 'color 0.2s',
  },
  productsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '16px',
  },
  productCard: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  productCode: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '4px',
  },
  productDescription: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '8px',
  },
  productStock: {
    fontSize: '13px',
    color: '#6b7280',
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

export default ProveedorDetalle;