import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { buildTenantPath } from '../utils/tenantHelper';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { sucursalesApi } from '../api/sucursales';
import { countries, getProvincesByCountry, getCitiesByProvince } from '../utils/locations';
import Layout from '../components/Layout';
import { ArrowLeft, Save, X, Building2 } from 'lucide-react';

const SucursalForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    direccion: '',
    pais: 'Argentina',
    provincia: '',
    ciudad: '',
    codigo_postal: '',
    telefono: '',
    email: '',
    responsable: '',
  });

  const [provincias, setProvincias] = useState([]);
  const [ciudades, setCiudades] = useState([]);

  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      loadSucursal();
    } else {
      // Al crear nueva, cargar provincias de Argentina por defecto
      setProvincias(getProvincesByCountry('AR'));
    }
  }, [id]);

  // Actualizar provincias cuando cambia el país
  useEffect(() => {
    if (formData.pais) {
      // Encontrar el código del país
      const paisObj = countries.find(c => c.name === formData.pais);
      const countryCode = paisObj ? paisObj.code : null;
      
      if (countryCode) {
        const nuevasProvincias = getProvincesByCountry(countryCode);
        setProvincias(nuevasProvincias);
        
        // Si la provincia actual no está en la nueva lista, resetear
        if (!nuevasProvincias.includes(formData.provincia)) {
          setFormData(prev => ({ ...prev, provincia: '', ciudad: '' }));
          setCiudades([]);
        }
      }
    }
  }, [formData.pais]);

  // Actualizar ciudades cuando cambia la provincia
  useEffect(() => {
    if (formData.provincia) {
      const nuevasCiudades = getCitiesByProvince(formData.provincia);
      setCiudades(nuevasCiudades);
      
      // Si la ciudad actual no está en la nueva lista, resetear
      if (!nuevasCiudades.includes(formData.ciudad)) {
        setFormData(prev => ({ ...prev, ciudad: '' }));
      }
    }
  }, [formData.provincia]);

  const loadSucursal = async () => {
    try {
      setLoading(true);
      const data = await sucursalesApi.getById(id);
      const sucursal = data.sucursal;
      
      setFormData({
        codigo: sucursal.codigo || '',
        nombre: sucursal.nombre || '',
        direccion: sucursal.direccion || '',
        pais: sucursal.pais || 'Argentina',
        provincia: sucursal.provincia || '',
        ciudad: sucursal.ciudad || '',
        codigo_postal: sucursal.codigo_postal || '',
        telefono: sucursal.telefono || '',
        email: sucursal.email || '',
        responsable: sucursal.responsable || '',
      });

      // Cargar provincias y ciudades según los datos cargados
      if (sucursal.pais) {
        const paisObj = countries.find(c => c.name === sucursal.pais);
        const countryCode = paisObj ? paisObj.code : null;
        
        if (countryCode) {
          const prov = getProvincesByCountry(countryCode);
          setProvincias(prov);
          
          if (sucursal.provincia) {
            const ciud = getCitiesByProvince(sucursal.provincia);
            setCiudades(ciud);
          }
        }
      }
    } catch (error) {
      showError(error.message);
      navigate(buildTenantPath('/sucursales'));
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

    if (!formData.codigo || !formData.nombre) {
      showError('Código y nombre son obligatorios');
      return;
    }

    setLoading(true);

    try {
      if (isEdit) {
        await sucursalesApi.update(id, formData);
        showSuccess('Sucursal actualizada exitosamente');
      } else {
        await sucursalesApi.create(formData);
        showSuccess('Sucursal creada exitosamente');
      }
      navigate(buildTenantPath('/sucursales'));
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
            {isEdit ? 'Editar Sucursal' : 'Nueva Sucursal'}
          </h1>
          <p style={styles.subtitle}>
            {isEdit ? 'Actualizar información de la sucursal' : 'Agregar una nueva sucursal al sistema'}
          </p>
        </div>
        <button
          onClick={() => navigate(buildTenantPath('/sucursales'))}
          style={styles.backButton}
        >
          <ArrowLeft size={18} style={{ marginRight: '6px' }} />
          {t('back')}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Información Básica */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <Building2 size={20} style={{ marginRight: '8px' }} />
            Información Básica
          </h2>

          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Código <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                style={styles.input}
                required
                placeholder="Ej: SUC-001"
                autoFocus
              />
            </div>

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
                placeholder="Nombre de la sucursal"
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Responsable</label>
            <input
              type="text"
              name="responsable"
              value={formData.responsable}
              onChange={handleChange}
              style={styles.input}
              placeholder="Nombre del responsable"
            />
          </div>
        </div>

        {/* Ubicación */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Ubicación</h2>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Dirección</label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              style={styles.input}
              placeholder="Calle y número"
            />
          </div>

          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>País</label>
              <select
                name="pais"
                value={formData.pais}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="">Seleccionar país</option>
                {countries.map(country => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Provincia/Estado</label>
              <select
                name="provincia"
                value={formData.provincia}
                onChange={handleChange}
                style={styles.select}
                disabled={!formData.pais}
              >
                <option value="">Seleccionar provincia</option>
                {provincias.map(provincia => (
                  <option key={provincia} value={provincia}>
                    {provincia}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Ciudad/Localidad</label>
              <select
                name="ciudad"
                value={formData.ciudad}
                onChange={handleChange}
                style={styles.select}
                disabled={!formData.provincia}
              >
                <option value="">Seleccionar ciudad</option>
                {ciudades.map(ciudad => (
                  <option key={ciudad} value={ciudad}>
                    {ciudad}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Código Postal</label>
              <input
                type="text"
                name="codigo_postal"
                value={formData.codigo_postal}
                onChange={handleChange}
                style={styles.input}
                placeholder="CP"
              />
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Información de Contacto</h2>

          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Teléfono</label>
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                style={styles.input}
                placeholder="Teléfono de contacto"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
                placeholder="email@sucursal.com"
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div style={styles.actions}>
          <button
            type="button"
            onClick={() => navigate(buildTenantPath('/sucursales'))}
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
            {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Sucursal'}
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
  input: {
    padding: '12px 14px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: 'white',
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

export default SucursalForm;