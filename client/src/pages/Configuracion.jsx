import { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { configuracionApi } from '../api/configuracion';
import Layout from '../components/Layout';
import { Building2, FileText, DollarSign, Save, RefreshCw } from 'lucide-react';
import { countries, getProvincesByCountry, getCitiesByProvince } from '../utils/locations';
import { fetchWithTenant } from '../utils/fetchWithTenant';

const Configuracion = () => {
  const { showSuccess, showError } = useNotification();
  
  const [activeTab, setActiveTab] = useState('empresa');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados para cada sección
  const [empresa, setEmpresa] = useState({});
  const [facturacion, setFacturacion] = useState({});
  const [monedas, setMonedas] = useState({});

  // Estados para listas dinámicas
  const [availableProvinces, setAvailableProvinces] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);

  // Estados para carga de logo
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    loadConfiguracion();
  }, []);

  // Cargar provincias cuando cambia el país
  useEffect(() => {
    const provinces = getProvincesByCountry(empresa.pais);
    setAvailableProvinces(provinces);
    
    if (!provinces.includes(empresa.provincia)) {
      setEmpresa(prev => ({ ...prev, provincia: '', ciudad: '' }));
      setAvailableCities([]);
    }
  }, [empresa.pais]);

  // Cargar ciudades cuando cambia la provincia
  useEffect(() => {
    const cities = getCitiesByProvince(empresa.provincia);
    setAvailableCities(cities);
    
    if (!cities.includes(empresa.ciudad)) {
      setEmpresa(prev => ({ ...prev, ciudad: '' }));
    }
  }, [empresa.provincia]);

  const loadConfiguracion = async () => {
    try {
      setLoading(true);
      const data = await configuracionApi.getAll();

      const empresaData = {
        logo_url: '', // Valor por defecto
        ...data.configuracion.empresa
      };
      
      setEmpresa(empresaData);
      setFacturacion(data.configuracion.facturacion || {});
      setMonedas(data.configuracion.monedas || {});

      //console.log('✅ Configuración cargada:', empresaData);

      // Cargar preview del logo si existe
      if (empresaData.logo_url) {
        setLogoPreview(empresaData.logo_url);
      }
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmpresa = async () => {
    try {
      setSaving(true);

      //console.log('🔍 Estado empresa antes de guardar:', empresa);
      //console.log('🔍 Logo URL:', empresa.logo_url);
      
      // Convertir objeto empresa a formato clave-valor con prefijo
      const configuraciones = {};
      Object.keys(empresa).forEach(key => {
        configuraciones[`empresa_${key}`] = empresa[key] || '';
      });

      //console.log('🔍 Configuraciones a enviar:', configuraciones);

      await configuracionApi.update(configuraciones);
      showSuccess('Datos de la empresa guardados exitosamente');
    } catch (error) {
      showError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFacturacion = async () => {
    try {
      setSaving(true);
      
      const configuraciones = {};
      Object.keys(facturacion).forEach(key => {
        configuraciones[`facturacion_${key}`] = facturacion[key] || '';
      });

      await configuracionApi.update(configuraciones);
      showSuccess('Configuración de facturación guardada exitosamente');
    } catch (error) {
      showError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCotizacion = async () => {
    try {
      setSaving(true);
      const cotizacion = parseFloat(monedas.cotizacion_usd_ars);
      
      if (!cotizacion || cotizacion <= 0) {
        showError('Ingrese una cotización válida');
        return;
      }

      await configuracionApi.updateCotizacion(cotizacion);
      showSuccess('Cotización actualizada exitosamente');
      loadConfiguracion();
    } catch (error) {
      showError(error.message);
    } finally {
      setSaving(false);
    }
  };

const handleLogoFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    //console.log('📁 Archivo seleccionado:', file.name);

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      showError('Por favor seleccione una imagen válida');
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showError('La imagen no debe superar los 2MB');
      return;
    }

    try {
      setUploadingLogo(true);
      
      const formData = new FormData();
      formData.append('imagen', file);

      const response = await fetchWithTenant('/api/upload/producto-imagen', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const data = await response.json();
      
      //console.log('✅ Respuesta del servidor:', data);
      //console.log('🖼️ URL de la imagen:', data.imageUrl);
      
      // Actualizar el logo_url en empresa
      const nuevoEstado = { ...empresa, logo_url: data.imageUrl };
      setEmpresa(nuevoEstado);
      setLogoPreview(data.imageUrl);
      
      //console.log('✅ Estado actualizado:', nuevoEstado);
      
      showSuccess('Logo cargado exitosamente');
    } catch (error) {
      console.error('❌ Error:', error);
      showError(error.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setEmpresa({ ...empresa, logo_url: '' });
    setLogoPreview(null);
    setLogoFile(null);
  };

  return (
    <Layout>
      <div style={styles.header}>
        <h1 style={styles.title}>Configuración del Sistema</h1>
        <p style={styles.subtitle}>Configura los parámetros globales de tu negocio</p>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('empresa')}
          style={{
            ...styles.tab,
            ...(activeTab === 'empresa' ? styles.tabActive : {}),
          }}
        >
          <Building2 size={18} style={{ marginRight: '8px' }} />
          Datos de la Empresa
        </button>
        <button
          onClick={() => setActiveTab('facturacion')}
          style={{
            ...styles.tab,
            ...(activeTab === 'facturacion' ? styles.tabActive : {}),
          }}
        >
          <FileText size={18} style={{ marginRight: '8px' }} />
          Facturación
        </button>
        <button
          onClick={() => setActiveTab('monedas')}
          style={{
            ...styles.tab,
            ...(activeTab === 'monedas' ? styles.tabActive : {}),
          }}
        >
          <DollarSign size={18} style={{ marginRight: '8px' }} />
          Monedas y Cotización
        </button>
      </div>

      {/* Contenido de los tabs */}
      <div style={styles.tabContent}>
        {/* TAB: Datos de la Empresa */}
        {activeTab === 'empresa' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Datos de la Empresa</h2>
            
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Razón Social *</label>
                <input
                  type="text"
                  value={empresa.razon_social || ''}
                  onChange={(e) => setEmpresa({ ...empresa, razon_social: e.target.value })}
                  style={styles.input}
                  placeholder="Ej: Corralón S.A."
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Nombre de Fantasía</label>
                <input
                  type="text"
                  value={empresa.nombre_fantasia || ''}
                  onChange={(e) => setEmpresa({ ...empresa, nombre_fantasia: e.target.value })}
                  style={styles.input}
                  placeholder="Ej: Corralón Central"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>CUIT *</label>
                <input
                  type="text"
                  value={empresa.cuit || ''}
                  onChange={(e) => setEmpresa({ ...empresa, cuit: e.target.value })}
                  style={styles.input}
                  placeholder="Ej: 20-12345678-9"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Condición IVA *</label>
                <select
                  value={empresa.condicion_iva || 'responsable_inscripto'}
                  onChange={(e) => setEmpresa({ ...empresa, condicion_iva: e.target.value })}
                  style={styles.select}
                >
                  <option value="responsable_inscripto">Responsable Inscripto</option>
                  <option value="monotributo">Monotributo</option>
                  <option value="exento">Exento</option>
                  <option value="consumidor_final">Consumidor Final</option>
                </select>
              </div>

              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Dirección Fiscal *</label>
                <input
                  type="text"
                  value={empresa.direccion || ''}
                  onChange={(e) => setEmpresa({ ...empresa, direccion: e.target.value })}
                  style={styles.input}
                  placeholder="Ej: Av. Principal 123"
                />
              </div>

              {/* País */}
              <div style={styles.formGroup}>
                <label style={styles.label}>País</label>
                <select
                  value={empresa.pais || ''}
                  onChange={(e) => setEmpresa({ ...empresa, pais: e.target.value })}
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

              {/* Provincia */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Provincia</label>
                <select
                  value={empresa.provincia || ''}
                  onChange={(e) => setEmpresa({ ...empresa, provincia: e.target.value })}
                  style={styles.select}
                  disabled={!empresa.pais}
                >
                  <option value="">Seleccionar provincia</option>
                  {availableProvinces.map(province => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ciudad/Localidad */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Ciudad</label>
                {availableCities.length > 0 ? (
                  <select
                    value={empresa.ciudad || ''}
                    onChange={(e) => setEmpresa({ ...empresa, ciudad: e.target.value })}
                    style={styles.select}
                    disabled={!empresa.provincia}
                  >
                    <option value="">Seleccionar ciudad</option>
                    {availableCities.map(city => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={empresa.ciudad || ''}
                    onChange={(e) => setEmpresa({ ...empresa, ciudad: e.target.value })}
                    style={styles.input}
                    placeholder="Escribir ciudad"
                    disabled={!empresa.provincia}
                  />
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Código Postal</label>
                <input
                  type="text"
                  value={empresa.codigo_postal || ''}
                  onChange={(e) => setEmpresa({ ...empresa, codigo_postal: e.target.value })}
                  style={styles.input}
                  placeholder="Ej: 1832"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Teléfono</label>
                <input
                  type="text"
                  value={empresa.telefono || ''}
                  onChange={(e) => setEmpresa({ ...empresa, telefono: e.target.value })}
                  style={styles.input}
                  placeholder="Ej: +54 11 1234-5678"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  value={empresa.email || ''}
                  onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })}
                  style={styles.input}
                  placeholder="Ej: contacto@corralon.com"
                />
              </div>

              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Sitio Web</label>
                <input
                  type="text"
                  value={empresa.sitio_web || ''}
                  onChange={(e) => setEmpresa({ ...empresa, sitio_web: e.target.value })}
                  style={styles.input}
                  placeholder="Ej: https://www.corralon.com"
                />
              </div>

<div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Logo de la Empresa</label>
                
                {/* Preview del logo */}
                {logoPreview && (
                  <div style={styles.logoPreview}>
                    <img 
                      src={logoPreview} 
                      alt="Logo" 
                      style={styles.logoImage}
                      onError={() => {
                        showError('Error al cargar la imagen');
                        setLogoPreview(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      style={styles.removeLogoButton}
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Tabs para elegir método de carga */}
                <div style={styles.uploadTabs}>
                  <button
                    type="button"
                    onClick={() => document.getElementById('logoFileInput').click()}
                    style={styles.uploadButton}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? 'Subiendo...' : '📁 Subir Archivo'}
                  </button>
                  <span style={styles.uploadSeparator}>o</span>
                  <div style={styles.urlInputContainer}>
                    <input
                      type="text"
                      value={empresa.logo_url || ''}
                      onChange={(e) => {
                        setEmpresa({ ...empresa, logo_url: e.target.value });
                        setLogoPreview(e.target.value);
                      }}
                      style={styles.input}
                      placeholder="https://ejemplo.com/logo.png"
                    />
                  </div>
                </div>

                {/* Input de archivo oculto */}
                <input
                  id="logoFileInput"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  style={{ display: 'none' }}
                />

                <small style={styles.hint}>
                  Sube una imagen o ingresa una URL. Recomendado: PNG/SVG transparente, máximo 2MB
                </small>
              </div>
            </div>

            <div style={styles.formActions}>
              <button
                onClick={handleSaveEmpresa}
                disabled={saving}
                style={styles.saveButton}
              >
                <Save size={18} style={{ marginRight: '8px' }} />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        )}

        {/* TAB: Facturación */}
        {activeTab === 'facturacion' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Configuración de Facturación</h2>
            
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Punto de Venta</label>
                <input
                  type="number"
                  value={facturacion.punto_venta || ''}
                  onChange={(e) => setFacturacion({ ...facturacion, punto_venta: e.target.value })}
                  style={styles.input}
                  placeholder="Ej: 1"
                />
                <small style={styles.hint}>Número de punto de venta homologado por AFIP</small>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Días Validez Presupuestos</label>
                <input
                  type="number"
                  value={facturacion.dias_validez_presupuesto || ''}
                  onChange={(e) => setFacturacion({ ...facturacion, dias_validez_presupuesto: e.target.value })}
                  style={styles.input}
                  placeholder="Ej: 15"
                />
              </div>

              <div style={styles.infoCard}>
                <h3 style={styles.infoCardTitle}>Próximos Números de Comprobante</h3>
                <div style={styles.numerosGrid}>
                  <div style={styles.numeroItem}>
                    <label style={styles.label}>Factura A</label>
                    <input
                      type="number"
                      value={facturacion.proximo_numero_fa || ''}
                      onChange={(e) => setFacturacion({ ...facturacion, proximo_numero_fa: e.target.value })}
                      style={styles.inputSmall}
                    />
                  </div>

                  <div style={styles.numeroItem}>
                    <label style={styles.label}>Factura B</label>
                    <input
                      type="number"
                      value={facturacion.proximo_numero_fb || ''}
                      onChange={(e) => setFacturacion({ ...facturacion, proximo_numero_fb: e.target.value })}
                      style={styles.inputSmall}
                    />
                  </div>

                  <div style={styles.numeroItem}>
                    <label style={styles.label}>Factura C</label>
                    <input
                      type="number"
                      value={facturacion.proximo_numero_fc || ''}
                      onChange={(e) => setFacturacion({ ...facturacion, proximo_numero_fc: e.target.value })}
                      style={styles.inputSmall}
                    />
                  </div>

                  <div style={styles.numeroItem}>
                    <label style={styles.label}>Remito</label>
                    <input
                      type="number"
                      value={facturacion.proximo_numero_rem || ''}
                      onChange={(e) => setFacturacion({ ...facturacion, proximo_numero_rem: e.target.value })}
                      style={styles.inputSmall}
                    />
                  </div>

                  <div style={styles.numeroItem}>
                    <label style={styles.label}>Ticket</label>
                    <input
                      type="number"
                      value={facturacion.proximo_numero_tk || ''}
                      onChange={(e) => setFacturacion({ ...facturacion, proximo_numero_tk: e.target.value })}
                      style={styles.inputSmall}
                    />
                  </div>
                </div>
              </div>

              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Pie de Página en Facturas</label>
                <textarea
                  value={facturacion.pie_pagina || ''}
                  onChange={(e) => setFacturacion({ ...facturacion, pie_pagina: e.target.value })}
                  style={styles.textarea}
                  rows="3"
                  placeholder="Ej: Gracias por su compra"
                />
              </div>

              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Términos y Condiciones</label>
                <textarea
                  value={facturacion.terminos || ''}
                  onChange={(e) => setFacturacion({ ...facturacion, terminos: e.target.value })}
                  style={styles.textarea}
                  rows="5"
                  placeholder="Ingrese los términos y condiciones generales"
                />
              </div>
            </div>

            <div style={styles.formActions}>
              <button
                onClick={handleSaveFacturacion}
                disabled={saving}
                style={styles.saveButton}
              >
                <Save size={18} style={{ marginRight: '8px' }} />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        )}

        {/* TAB: Monedas */}
        {activeTab === 'monedas' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Monedas y Cotización</h2>
            
            <div style={styles.cotizacionCard}>
              <div style={styles.cotizacionHeader}>
                <div>
                  <h3 style={styles.cotizacionTitle}>Cotización USD → ARS</h3>
                  <p style={styles.cotizacionSubtitle}>
                    {monedas.cotizacion_fecha_actualizacion 
                      ? `Última actualización: ${new Date(monedas.cotizacion_fecha_actualizacion).toLocaleString('es-AR')}`
                      : 'Sin actualizar'}
                  </p>
                </div>
                <DollarSign size={40} color="#10b981" />
              </div>

              <div style={styles.cotizacionInput}>
                <label style={styles.label}>1 USD =</label>
                <div style={styles.inputWithButton}>
                  <input
                    type="number"
                    value={monedas.cotizacion_usd_ars || ''}
                    onChange={(e) => setMonedas({ ...monedas, cotizacion_usd_ars: e.target.value })}
                    style={styles.inputLarge}
                    placeholder="Ej: 1000"
                    step="0.01"
                  />
                  <span style={styles.currency}>ARS</span>
                </div>
              </div>

              <button
                onClick={handleUpdateCotizacion}
                disabled={saving}
                style={styles.updateButton}
              >
                <RefreshCw size={18} style={{ marginRight: '8px' }} />
                {saving ? 'Actualizando...' : 'Actualizar Cotización'}
              </button>
            </div>

            <div style={styles.infoBox}>
              <h4 style={styles.infoBoxTitle}>ℹ️ Información</h4>
              <p style={styles.infoBoxText}>
                La cotización se utiliza para convertir automáticamente precios entre USD y ARS en 
                presupuestos, ventas y reportes. Actualízala regularmente para mantener valores precisos.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const styles = {
  header: {
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
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '2px solid #e5e7eb',
  },
  tab: {
    padding: '14px 24px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  tabActive: {
    color: '#2563eb',
    borderBottomColor: '#2563eb',
  },
  tabContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  section: {
    maxWidth: '1000px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '28px',
    paddingBottom: '16px',
    borderBottom: '2px solid #f3f4f6',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    padding: '12px 16px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  inputSmall: {
    padding: '10px 14px',
    fontSize: '14px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    width: '100%',
  },
  inputLarge: {
    padding: '16px 20px',
    fontSize: '28px',
    fontWeight: 'bold',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    flex: 1,
    textAlign: 'right',
  },
  select: {
    padding: '12px 16px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  textarea: {
    padding: '12px 16px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  hint: {
    fontSize: '13px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  infoCard: {
    gridColumn: '1 / -1',
    padding: '24px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
  },
  infoCardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  numerosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
  },
  numeroItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  formActions: {
    marginTop: '32px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  saveButton: {
    padding: '14px 28px',
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
  cotizacionCard: {
    padding: '28px',
    backgroundColor: '#f0fdf4',
    borderRadius: '12px',
    border: '2px solid #86efac',
    marginBottom: '24px',
  },
  cotizacionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  cotizacionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  cotizacionSubtitle: {
    fontSize: '13px',
    color: '#6b7280',
    margin: 0,
  },
  cotizacionInput: {
    marginBottom: '20px',
  },
  inputWithButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  currency: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#10b981',
    minWidth: '50px',
  },
  updateButton: {
    padding: '14px 28px',
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  infoBox: {
    padding: '20px',
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    border: '2px solid #bfdbfe',
  },
  infoBoxTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1e40af',
    margin: '0 0 8px 0',
  },
  infoBoxText: {
    fontSize: '14px',
    color: '#1f2937',
    margin: 0,
    lineHeight: '1.6',
  },
logoPreview: {
    position: 'relative',
    width: '200px',
    height: '200px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    padding: '10px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  logoImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  removeLogoButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    fontSize: '20px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: '1',
  },
  uploadTabs: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '8px',
  },
  uploadButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    border: '2px solid #2563eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  uploadSeparator: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '600',
  },
  urlInputContainer: {
    flex: 1,
  },
};

export default Configuracion;