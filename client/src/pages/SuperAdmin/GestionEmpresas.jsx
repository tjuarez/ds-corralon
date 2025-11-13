import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { empresasApi } from '../../api/empresas';
import { buildTenantPath } from '../../utils/tenantHelper';
import Layout from '../../components/Layout';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Power,
  Users,
  Package,
  ShoppingCart,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';

const GestionEmpresas = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [empresas, setEmpresas] = useState([]);

  useEffect(() => {
    loadEmpresas();
  }, []);

  const loadEmpresas = async () => {
    try {
      setLoading(true);
      const data = await empresasApi.getAll();
      setEmpresas(data.empresas || []);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, nombreEmpresa) => {
    if (!confirm(`¿Confirma cambiar el estado de "${nombreEmpresa}"?`)) {
      return;
    }

    try {
      await empresasApi.toggleStatus(id);
      showSuccess('Estado actualizado exitosamente');
      loadEmpresas();
    } catch (error) {
      showError(error.message);
    }
  };

  const handleDelete = async (id, nombreEmpresa, slug) => {
    if (slug === 'demo') {
      showError('No se puede eliminar la empresa demo');
      return;
    }

    if (!confirm(`¿CONFIRMA ELIMINAR la empresa "${nombreEmpresa}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await empresasApi.delete(id);
      showSuccess('Empresa eliminada exitosamente');
      loadEmpresas();
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

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <Building2 size={32} style={{ marginRight: '12px' }} />
            Gestión de Empresas
          </h1>
          <p style={styles.subtitle}>
            Panel de administración multi-tenant
          </p>
        </div>
        <button
          onClick={() => navigate(buildTenantPath('/super-admin/empresas/nueva'))}
          style={styles.addButton}
        >
          <Plus size={20} style={{ marginRight: '8px' }} />
          Nueva Empresa
        </button>
      </div>

      {/* Resumen */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <Building2 size={24} color="#2563eb" />
          <div>
            <div style={styles.statValue}>{empresas.length}</div>
            <div style={styles.statLabel}>Total Empresas</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <CheckCircle size={24} color="#10b981" />
          <div>
            <div style={styles.statValue}>
              {empresas.filter(e => e.activa === 1).length}
            </div>
            <div style={styles.statLabel}>Activas</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <XCircle size={24} color="#ef4444" />
          <div>
            <div style={styles.statValue}>
              {empresas.filter(e => e.activa === 0).length}
            </div>
            <div style={styles.statLabel}>Inactivas</div>
          </div>
        </div>
      </div>

      {/* Lista de empresas */}
      <div style={styles.empresasGrid}>
        {empresas.map((empresa) => (
          <div key={empresa.id} style={styles.empresaCard}>
            <div style={styles.empresaHeader}>
              <div style={styles.empresaInfo}>
                {empresa.logo_url ? (
                  <img
                    src={empresa.logo_url}
                    alt={empresa.nombre}
                    style={styles.empresaLogo}
                  />
                ) : (
                  <div style={styles.empresaLogoPlaceholder}>
                    <Building2 size={24} />
                  </div>
                )}
                <div>
                  <h3 style={styles.empresaNombre}>{empresa.nombre}</h3>
                  <div style={styles.empresaSlug}>/{empresa.slug}</div>
                </div>
              </div>
              <div style={{
                ...styles.statusBadge,
                ...(empresa.activa === 1 ? styles.statusActive : styles.statusInactive)
              }}>
                {empresa.activa === 1 ? 'Activa' : 'Inactiva'}
              </div>
            </div>

            {empresa.razon_social && (
              <div style={styles.empresaDetail}>
                <strong>Razón Social:</strong> {empresa.razon_social}
              </div>
            )}

            {empresa.cuit && (
              <div style={styles.empresaDetail}>
                <strong>CUIT:</strong> {empresa.cuit}
              </div>
            )}

            <div style={styles.empresaStats}>
              <div style={styles.stat}>
                <Users size={16} />
                <span>{empresa.total_usuarios || 0} usuarios</span>
              </div>
              <div style={styles.stat}>
                <MapPin size={16} />
                <span>{empresa.total_sucursales || 0} sucursales</span>
              </div>
              <div style={styles.stat}>
                <Package size={16} />
                <span>{empresa.total_productos || 0} productos</span>
              </div>
              <div style={styles.stat}>
                <ShoppingCart size={16} />
                <span>{empresa.total_ventas || 0} ventas</span>
              </div>
            </div>

            {empresa.fecha_vencimiento && (
              <div style={styles.empresaVencimiento}>
                <Calendar size={14} />
                <span>Vence: {new Date(empresa.fecha_vencimiento).toLocaleDateString('es-AR')}</span>
              </div>
            )}

            <div style={styles.empresaActions}>
              <button
                onClick={() => navigate(buildTenantPath(`/super-admin/empresas/${empresa.id}`))}
                style={styles.actionButton}
                title="Ver detalles"
              >
                <Eye size={18} />
              </button>
              <button
                onClick={() => navigate(buildTenantPath(`/super-admin/empresas/${empresa.id}/editar`))}
                style={styles.actionButton}
                title="Editar"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => handleToggleStatus(empresa.id, empresa.nombre)}
                style={{
                  ...styles.actionButton,
                  color: empresa.activa === 1 ? '#ef4444' : '#10b981'
                }}
                title={empresa.activa === 1 ? 'Desactivar' : 'Activar'}
              >
                <Power size={18} />
              </button>
              {empresa.slug !== 'demo' && (
                <button
                  onClick={() => handleDelete(empresa.id, empresa.nombre, empresa.slug)}
                  style={{ ...styles.actionButton, color: '#ef4444' }}
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {empresas.length === 0 && (
        <div style={styles.empty}>
          <Building2 size={64} color="#d1d5db" />
          <p style={styles.emptyText}>No hay empresas registradas</p>
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
    display: 'flex',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
  addButton: {
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  empresasGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  empresaCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  empresaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  empresaInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  empresaLogo: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    objectFit: 'contain',
  },
  empresaLogoPlaceholder: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9ca3af',
  },
  empresaNombre: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  empresaSlug: {
    fontSize: '13px',
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  statusActive: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusInactive: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  empresaDetail: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  empresaStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    margin: '16px 0',
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#6b7280',
  },
  empresaVencimiento: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: '#fef3c7',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#92400e',
    marginBottom: '12px',
  },
  empresaActions: {
    display: 'flex',
    gap: '8px',
    paddingTop: '12px',
    borderTop: '1px solid #f3f4f6',
  },
  actionButton: {
    flex: 1,
    padding: '8px',
    backgroundColor: 'transparent',
    border: '2px solid #e5e7eb',
    borderRadius: '6px',
    color: '#6b7280',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#9ca3af',
    marginTop: '16px',
  },
};

export default GestionEmpresas;