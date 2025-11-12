import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { buildTenantPath } from '../utils/tenantHelper';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { proveedoresApi } from '../api/proveedores';
import Layout from '../components/Layout';
import { ArrowLeft, Save, X } from 'lucide-react';
import { countries, getProvincesByCountry, getCitiesByProvince } from '../utils/locations';

const ProveedorForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);

  const [formData, setFormData] = useState({
    razon_social: '',
    nombre_fantasia: '',
    cuit_dni: '',
    telefono: '',
    email: '',
    direccion: '',
    pais: 'AR',
    provincia: '',
    localidad: '',
    codigo_postal: '',
    sitio_web: '',
    condicion_pago: 'cuenta_corriente',
    observaciones: '',
  });

  const [availableProvinces, setAvailableProvinces] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);

  useEffect(() => {
    if (isEdit) {
      loadProveedor();
    } else {
      setAvailableProvinces(getProvincesByCountry('AR'));
    }
  }, [id]);

  useEffect(() => {
    const provinces = getProvincesByCountry(formData.pais);
    setAvailableProvinces(provinces);
    
    if (!provinces.includes(formData.provincia)) {
      setFormData(prev => ({ ...prev, provincia: '', localidad: '' }));
      setAvailableCities([]);
    }
  }, [formData.pais]);

  useEffect(() => {
    const cities = getCitiesByProvince(formData.provincia);
    setAvailableCities(cities);
    
    if (!cities.includes(formData.localidad)) {
      setFormData(prev => ({ ...prev, localidad: '' }));
    }
  }, [formData.provincia]);

  const loadProveedor = async () => {
    try {
      setLoadingData(true);
      const data = await proveedoresApi.getById(id);
      const proveedor = data.proveedor;

      setFormData({
        razon_social: proveedor.razon_social || '',
        nombre_fantasia: proveedor.nombre_fantasia || '',
        cuit_dni: proveedor.cuit_dni || '',
        telefono: proveedor.telefono || '',
        email: proveedor.email || '',
        direccion: proveedor.direccion || '',
        pais: proveedor.pais || 'AR',
        provincia: proveedor.provincia || '',
        localidad: proveedor.localidad || '',
        codigo_postal: proveedor.codigo_postal || '',
        sitio_web: proveedor.sitio_web || '',
        condicion_pago: proveedor.condicion_pago || 'cuenta_corriente',
        observaciones: proveedor.observaciones || '',
      });

      setAvailableProvinces(getProvincesByCountry(proveedor.pais || 'AR'));
      if (proveedor.provincia) {
        setAvailableCities(getCitiesByProvince(proveedor.provincia));
      }
    } catch (error) {
      showError(error.message);
      navigate(buildTenantPath('/proveedores'));
    } finally {
      setLoadingData(false);
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

    if (!formData.razon_social.trim()) {
      showError('La razón social es obligatoria');
      return;
    }

    setLoading(true);

    try {
      if (isEdit) {
        await proveedoresApi.update(id, formData);
        showSuccess('Proveedor actualizado exitosamente');
      } else {
        await proveedoresApi.create(formData);
        showSuccess('Proveedor creado exitosamente');
      }

      navigate(buildTenantPath('/proveedores'));
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
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
            {isEdit ? t('editProvider') : t('newProvider')}
          </h1>
          <p style={styles.subtitle}>
            {isEdit ? 'Modifica la información del proveedor' : 'Completa los datos del nuevo proveedor'}
          </p>
        </div>
        <button
          onClick={() => navigate(buildTenantPath('/proveedores'))}
          style={styles.backButton}
        >
          <ArrowLeft size={18} style={{ marginRight: '6px' }} />
          {t('back')}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Información Básica */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Información Básica</h2>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              {t('businessName')} <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="razon_social"
              value={formData.razon_social}
              onChange={handleChange}
              style={styles.input}
              required
              placeholder="Nombre legal de la empresa"
            />
          </div>

          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('tradeName')}</label>
              <input
                type="text"
                name="nombre_fantasia"
                value={formData.nombre_fantasia}
                onChange={handleChange}
                style={styles.input}
                placeholder="Nombre comercial (opcional)"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('taxId')}</label>
              <input
                type="text"
                name="cuit_dni"
                value={formData.cuit_dni}
                onChange={handleChange}
                style={styles.input}
                placeholder="Ej: 30-12345678-9"
              />
            </div>
          </div>
        </div>

        {/* Datos de Contacto */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Datos de Contacto</h2>

          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('phone')}</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                style={styles.input}
                placeholder="Ej: 11 1234-5678"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('email')}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
                placeholder="ejemplo@email.com"
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>{t('website')}</label>
            <input
              type="url"
              name="sitio_web"
              value={formData.sitio_web}
              onChange={handleChange}
              style={styles.input}
              placeholder="https://www.ejemplo.com"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>{t('address')}</label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              style={styles.input}
              placeholder="Calle, Número, Piso, Dpto"
            />
          </div>

          <div style={styles.grid3}>
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
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('province')}</label>
              <select
                name="provincia"
                value={formData.provincia}
                onChange={handleChange}
                style={styles.select}
                disabled={!formData.pais}
              >
                <option value="">Seleccionar provincia</option>
                {availableProvinces.map(province => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('city')}</label>
              {availableCities.length > 0 ? (
                <select
                  name="localidad"
                  value={formData.localidad}
                  onChange={handleChange}
                  style={styles.select}
                  disabled={!formData.provincia}
                >
                  <option value="">Seleccionar localidad</option>
                  {availableCities.map(city => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="localidad"
                  value={formData.localidad}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Escribir localidad"
                  disabled={!formData.provincia}
                />
              )}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('postalCode')}</label>
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

        {/* Condiciones Comerciales */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Condiciones Comerciales</h2>

          <div style={styles.inputGroup}>
            <label style={styles.label}>{t('paymentTerms')}</label>
            <select
              name="condicion_pago"
              value={formData.condicion_pago}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="contado">Contado</option>
              <option value="cuenta_corriente">Cuenta Corriente</option>
              <option value="30_dias">30 días</option>
              <option value="60_dias">60 días</option>
              <option value="90_dias">90 días</option>
            </select>
          </div>
        </div>

        {/* Observaciones */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Observaciones</h2>

          <div style={styles.inputGroup}>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              style={styles.textarea}
              rows="4"
              placeholder="Notas adicionales sobre el proveedor..."
            />
          </div>
        </div>

        {/* Botones */}
        <div style={styles.actions}>
          <button
            type="button"
            onClick={() => navigate(buildTenantPath('/proveedores'))}
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
            {loading ? t('loading') : t('save')}
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 20px 0',
    paddingBottom: '12px',
    borderBottom: '2px solid #f3f4f6',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '20px',
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
    padding: '12px 40px 12px 14px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none',
  },
  textarea: {
    padding: '12px 14px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: 'white',
    fontFamily: 'inherit',
    resize: 'vertical',
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
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
};

export default ProveedorForm;