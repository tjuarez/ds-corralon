import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { empresasApi } from '../../api/empresas';
import { buildTenantPath } from '../../utils/tenantHelper';
import Layout from '../../components/Layout';
import { ArrowLeft, Save, Building2, Edit } from 'lucide-react';

const EmpresaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const location = useLocation();
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(false);
  const [empresa, setEmpresa] = useState({
    slug: '',
    nombre: '',
    razon_social: '',
    cuit: '',
    direccion: '',
    telefono: '',
    email: '',
    logo_url: '',
    plan: 'basico',
    fecha_vencimiento: '',
    activa: 1,
  });

  const isEdit = !!id && location.pathname.includes('/editar');
  const isView = !!id && !location.pathname.includes('/editar');

  useEffect(() => {
    if (isEdit) {
      loadEmpresa();
    }
  }, [id]);

  const loadEmpresa = async () => {
    try {
      setLoading(true);
      const data = await empresasApi.getById(id);
      
      // Convertir valores null a strings vacíos para evitar errores de React
      const empresaData = {
        slug: data.empresa.slug || '',
        nombre: data.empresa.nombre || '',
        razon_social: data.empresa.razon_social || '',
        cuit: data.empresa.cuit || '',
        direccion: data.empresa.direccion || '',
        telefono: data.empresa.telefono || '',
        email: data.empresa.email || '',
        logo_url: data.empresa.logo_url || '',
        plan: data.empresa.plan || 'basico',
        fecha_vencimiento: data.empresa.fecha_vencimiento || '',
        activa: data.empresa.activa || 0,
      };
      
      setEmpresa(empresaData);
    } catch (error) {
      showError(error.message);
      navigate(buildTenantPath('/super-admin/empresas'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmpresa({
      ...empresa,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
    });
  };

  const handleSlugChange = (e) => {
    // Convertir a slug válido: solo minúsculas, números y guiones
    const slug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    setEmpresa({ ...empresa, slug });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!empresa.slug || !empresa.nombre) {
      showError('Slug y nombre son obligatorios');
      return;
    }

    try {
      setLoading(true);
      
      if (isEdit) {
        await empresasApi.update(id, empresa);
        showSuccess('Empresa actualizada exitosamente');
      } else {
        await empresasApi.create(empresa);
        showSuccess('Empresa creada exitosamente');
      }
      
      navigate(buildTenantPath('/super-admin/empresas'));
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <Building2 size={28} style={{ marginRight: '12px' }} />
            {isView ? 'Detalles de Empresa' : (isEdit ? 'Editar Empresa' : 'Nueva Empresa')}
          </h1>
          <p style={styles.subtitle}>
            {isView ? 'Información detallada de la empresa' : 
             (isEdit ? 'Modifica los datos de la empresa' : 'Crea una nueva empresa en el sistema')}
          </p>
        </div>
        <button
          onClick={() => navigate(buildTenantPath('/super-admin/empresas'))}
          style={styles.backButton}
        >
          <ArrowLeft size={18} style={{ marginRight: '6px' }} />
          Volver
        </button>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Información Básica</h2>

          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Slug * <span style={styles.hint}>(URL única, ej: empresa-demo)</span>
              </label>
              <input
                type="text"
                name="slug"
                value={empresa.slug}
                onChange={handleSlugChange}
                style={styles.input}
                required
                disabled={isEdit || isView} // No permitir cambiar slug en edición
                placeholder="empresa-demo"
              />
              {empresa.slug && (
                <div style={styles.slugPreview}>
                  URL: <strong>/{empresa.slug}/dashboard</strong>
                </div>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Nombre Comercial *</label>
              <input
                type="text"
                name="nombre"
                value={empresa.nombre}
                onChange={handleChange}
                style={styles.input}
                required
                disabled={isView}
                placeholder="Mi Corralón"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Razón Social</label>
              <input
                type="text"
                name="razon_social"
                value={empresa.razon_social}
                onChange={handleChange}
                style={styles.input}
                disabled={isView}
                placeholder="Mi Corralón S.R.L."
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>CUIT</label>
              <input
                type="text"
                name="cuit"
                value={empresa.cuit}
                onChange={handleChange}
                style={styles.input}
                disabled={isView}
                placeholder="20-12345678-9"
              />
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Contacto</h2>

          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={empresa.email}
                onChange={handleChange}
                style={styles.input}
                disabled={isView}
                placeholder="contacto@empresa.com"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Teléfono</label>
              <input
                type="text"
                name="telefono"
                value={empresa.telefono}
                onChange={handleChange}
                style={styles.input}
                disabled={isView}
                placeholder="+54 11 1234-5678"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Dirección</label>
              <input
                type="text"
                name="direccion"
                value={empresa.direccion}
                onChange={handleChange}
                style={styles.input}
                disabled={isView}
                placeholder="Calle 123, Ciudad"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>URL del Logo</label>
              <input
                type="text"
                name="logo_url"
                value={empresa.logo_url}
                onChange={handleChange}
                style={styles.input}
                disabled={isView}
                placeholder="https://ejemplo.com/logo.png"
              />
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Configuración</h2>

          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Plan</label>
              <select
                name="plan"
                value={empresa.plan}
                onChange={handleChange}
                style={styles.input}
                disabled={isView}
              >
                <option value="basico">Básico</option>
                <option value="profesional">Profesional</option>
                <option value="empresarial">Empresarial</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Fecha de Vencimiento</label>
              <input
                type="date"
                name="fecha_vencimiento"
                value={empresa.fecha_vencimiento ? empresa.fecha_vencimiento.split('T')[0] : ''}
                onChange={handleChange}
                style={styles.input}
                disabled={isView}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="activa"
                  checked={empresa.activa === 1}
                  onChange={handleChange}
                  style={styles.checkbox}
                  disabled={isView}
                />
                Empresa activa
              </label>
            </div>
          </div>
        </div>

        <div style={styles.actions}>
          {isView ? (
            <>
              <button
                type="button"
                onClick={() => navigate(buildTenantPath('/super-admin/empresas'))}
                style={styles.cancelButton}
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => navigate(buildTenantPath(`/super-admin/empresas/${id}/editar`))}
                style={styles.submitButton}
              >
                <Edit size={18} style={{ marginRight: '8px' }} />
                Editar Empresa
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate(buildTenantPath('/super-admin/empresas'))}
                style={styles.cancelButton}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={styles.submitButton}
                disabled={loading}
              >
                <Save size={18} style={{ marginRight: '8px' }} />
                {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear Empresa')}
              </button>
            </>
          )}
        </div>
      </form>
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
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 8px 0',
    display: 'flex',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  backButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  form: {
    maxWidth: '900px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '20px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  hint: {
    fontSize: '12px',
    fontWeight: '400',
    color: '#9ca3af',
  },
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
  },
  slugPreview: {
    fontSize: '13px',
    color: '#6b7280',
    padding: '8px 12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px',
  },
  cancelButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  submitButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
};

export default EmpresaForm;