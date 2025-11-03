import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { usuariosApi } from '../api/usuarios';
import { sucursalesApi } from '../api/sucursales';
import Layout from '../components/Layout';
import { ArrowLeft, Save, X, User, Lock, Eye, EyeOff } from 'lucide-react';

const UsuarioForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(false);
  const [sucursales, setSucursales] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    rol: 'vendedor',
    sucursal_id: '',
  });

  const isEdit = !!id;

  useEffect(() => {
    loadSucursales();
    if (isEdit) {
      loadUsuario();
    }
  }, [id]);

  const loadSucursales = async () => {
    try {
      const data = await sucursalesApi.getAll({ activa: 'true' });
      setSucursales(data.sucursales);
    } catch (error) {
      showError(error.message);
    }
  };

  const loadUsuario = async () => {
    try {
      setLoading(true);
      const data = await usuariosApi.getById(id);
      setFormData({
        username: data.usuario.username || '',
        nombre: data.usuario.nombre || '',
        apellido: data.usuario.apellido || '',
        email: data.usuario.email || '',
        password: '', // No cargar password existente
        rol: data.usuario.rol || 'vendedor',
        sucursal_id: data.usuario.sucursal_id || '',
      });
    } catch (error) {
      showError(error.message);
      navigate('/usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.username || !formData.nombre || !formData.apellido || !formData.email || !formData.rol) {
      showError('Todos los campos obligatorios deben estar completos');
      return;
    }

    if (!isEdit && !formData.password) {
      showError('La contraseña es obligatoria al crear un usuario');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      // Preparar datos para enviar
      const dataToSend = {
        username: formData.username,
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        rol: formData.rol,
        sucursal_id: formData.sucursal_id || null,
      };

      // Solo incluir password si se ingresó uno
      if (formData.password) {
        dataToSend.password = formData.password;
      }

      if (isEdit) {
        await usuariosApi.update(id, dataToSend);
        showSuccess('Usuario actualizado exitosamente');
      } else {
        await usuariosApi.create(dataToSend);
        showSuccess('Usuario creado exitosamente');
      }
      navigate('/usuarios');
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
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
            {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h1>
          <p style={styles.subtitle}>
            {isEdit ? 'Actualizar información del usuario' : 'Agregar un nuevo usuario al sistema'}
          </p>
        </div>
        <button
          onClick={() => navigate('/usuarios')}
          style={styles.backButton}
        >
          <ArrowLeft size={18} style={{ marginRight: '6px' }} />
          {t('back')}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Información Personal */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <User size={20} style={{ marginRight: '8px' }} />
            Información Personal
          </h2>

          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Nombre <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                style={styles.input}
                required
                placeholder="Nombre"
                autoFocus
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Apellido <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                style={styles.input}
                required
                placeholder="Apellido"
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Email <span style={styles.required}>*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              required
              placeholder="email@ejemplo.com"
            />
          </div>
        </div>

        {/* Credenciales y Acceso */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <Lock size={20} style={{ marginRight: '8px' }} />
            Credenciales y Acceso
          </h2>

          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Usuario <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                style={styles.input}
                required
                placeholder="Nombre de usuario"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Contraseña {!isEdit && <span style={styles.required}>*</span>}
                {isEdit && <span style={styles.optional}> (dejar vacío para no cambiar)</span>}
              </label>
              <div style={styles.passwordContainer}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  style={styles.passwordInput}
                  required={!isEdit}
                  placeholder={isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  title={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span style={styles.hint}>Mínimo 6 caracteres</span>
            </div>
          </div>

          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Rol <span style={styles.required}>*</span>
              </label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                style={styles.select}
                required
              >
                <option value="admin">Administrador</option>
                <option value="vendedor">Vendedor</option>
                <option value="cajero">Cajero</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Sucursal Asignada</label>
              <select
                name="sucursal_id"
                value={formData.sucursal_id}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="">Sin asignar</option>
                {sucursales.map(sucursal => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Info sobre roles */}
        <div style={styles.infoBox}>
          <div style={styles.infoTitle}>Información sobre roles:</div>
          <ul style={styles.infoList}>
            <li><strong>Administrador:</strong> Acceso completo al sistema, puede gestionar usuarios, productos, ventas y configuración.</li>
            <li><strong>Vendedor:</strong> Puede realizar ventas, gestionar clientes y consultar productos.</li>
            <li><strong>Cajero:</strong> Puede realizar ventas y gestionar caja, con acceso limitado a configuración.</li>
          </ul>
        </div>

        {/* Botones */}
        <div style={styles.actions}>
          <button
            type="button"
            onClick={() => navigate('/usuarios')}
            style={styles.cancelButton}
            disabled={loading}
          >
            <X size={18} style={{ marginRight: '6px' }} />
            {t('cancel')}
          </button>
          <button
            type="submit"
            style={styles.submitButton}
            disabled={loading}
          >
            <Save size={18} style={{ marginRight: '6px' }} />
            {loading ? 'Guardando...' : isEdit ? 'Actualizar Usuario' : 'Crear Usuario'}
          </button>
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
  backButton: {
    padding: '10px 20px',
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
    maxWidth: '900px',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 20px 0',
    paddingBottom: '12px',
    borderBottom: '2px solid #f3f4f6',
    display: 'flex',
    alignItems: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  required: {
    color: '#dc2626',
  },
  optional: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '400',
  },
  input: {
    padding: '12px 14px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: 'white',
  },
  passwordContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: '12px 50px 12px 14px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: 'white',
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: '12px',
    color: '#6b7280',
  },
  select: {
    padding: '12px 14px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  infoBox: {
    padding: '20px',
    backgroundColor: '#eff6ff',
    border: '2px solid #93c5fd',
    borderRadius: '12px',
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: '12px',
  },
  infoList: {
    margin: '0',
    paddingLeft: '20px',
    color: '#1e40af',
    fontSize: '14px',
    lineHeight: '1.8',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
    paddingTop: '20px',
  },
  cancelButton: {
    padding: '12px 32px',
    fontSize: '16px',
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
  submitButton: {
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
};

export default UsuarioForm;