import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { buildTenantPath } from '../utils/tenantHelper';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { cajaApi } from '../api/caja';
import Layout from '../components/Layout';
import { ArrowLeft, Save, X, DollarSign } from 'lucide-react';

const RegistrarMovimientoCaja = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [caja, setCaja] = useState(null);
  const [formData, setFormData] = useState({
    tipo_movimiento: 'ingreso',
    categoria: '',
    monto: '',
    concepto: '',
    numero_comprobante: '',
    observaciones: '',
  });

  useEffect(() => {
    loadCaja();
  }, [id]);

  const loadCaja = async () => {
    try {
      const data = await cajaApi.getById(id);
      if (data.caja.estado !== 'abierta') {
        showError('La caja está cerrada');
        navigate(buildTenantPath('/caja'));
        return;
      }
      setCaja(data.caja);
    } catch (error) {
      showError(error.message);
      navigate(buildTenantPath('/caja'));
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

    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      showError('El monto debe ser mayor a 0');
      return;
    }

    if (!formData.concepto) {
      showError('El concepto es obligatorio');
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        caja_id: parseInt(id),
        tipo_movimiento: formData.tipo_movimiento,
        categoria: formData.categoria || null,
        monto: parseFloat(formData.monto),
        concepto: formData.concepto,
        numero_comprobante: formData.numero_comprobante || null,
        observaciones: formData.observaciones || null,
        usuario_id: user.id,
      };

      await cajaApi.registrarMovimiento(dataToSend);
      showSuccess('Movimiento registrado exitosamente');
      navigate(buildTenantPath(`/caja/${id}`));
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!caja) {
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
          <h1 style={styles.title}>Registrar Movimiento</h1>
          <p style={styles.subtitle}>Caja N° {caja.numero}</p>
        </div>
        <button
          onClick={() => navigate(buildTenantPath(`/caja/${id}`))}
          style={styles.backButton}
        >
          <ArrowLeft size={18} style={{ marginRight: '6px' }} />
          {t('back')}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Datos del Movimiento</h2>

          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Tipo de Movimiento <span style={styles.required}>*</span>
              </label>
              <select
                name="tipo_movimiento"
                value={formData.tipo_movimiento}
                onChange={handleChange}
                style={{
                  ...styles.select,
                  borderColor: formData.tipo_movimiento === 'ingreso' ? '#10b981' : '#dc2626',
                  backgroundColor: formData.tipo_movimiento === 'ingreso' ? '#d1fae5' : '#fee2e2',
                  color: formData.tipo_movimiento === 'ingreso' ? '#065f46' : '#991b1b',
                  fontWeight: '600'
                }}
                required
              >
                <option value="ingreso">Ingreso (+)</option>
                <option value="egreso">Egreso (-)</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Categoría</label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="">Sin categoría</option>
                {formData.tipo_movimiento === 'ingreso' ? (
                  <>
                    <option value="venta">Venta</option>
                    <option value="pago_cliente">Pago de Cliente</option>
                    <option value="reposicion">Reposición</option>
                    <option value="otro_ingreso">Otro Ingreso</option>
                  </>
                ) : (
                  <>
                    <option value="compra">Compra</option>
                    <option value="pago_proveedor">Pago a Proveedor</option>
                    <option value="gasto_general">Gasto General</option>
                    <option value="retiro">Retiro</option>
                    <option value="otro_egreso">Otro Egreso</option>
                  </>
                )}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Monto <span style={styles.required}>*</span>
              </label>
              <div style={styles.montoInputContainer}>
                <DollarSign size={18} style={styles.montoIcon} />
                <input
                  type="number"
                  name="monto"
                  value={formData.monto}
                  onChange={handleChange}
                  style={{
                    ...styles.montoInput,
                    borderColor: formData.tipo_movimiento === 'ingreso' ? '#10b981' : '#dc2626',
                  }}
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Número de Comprobante</label>
              <input
                type="text"
                name="numero_comprobante"
                value={formData.numero_comprobante}
                onChange={handleChange}
                style={styles.input}
                placeholder="Ej: 001-00001234"
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Concepto <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="concepto"
              value={formData.concepto}
              onChange={handleChange}
              style={styles.input}
              required
              placeholder="Descripción del movimiento..."
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              style={styles.textarea}
              rows="3"
              placeholder="Notas adicionales (opcional)..."
            />
          </div>
        </div>

        {/* Preview */}
        {formData.monto && parseFloat(formData.monto) > 0 && (
          <div style={styles.previewBox}>
            <h3 style={styles.previewTitle}>Resumen</h3>
            <div style={styles.previewContent}>
              <div style={styles.previewRow}>
                <span>Tipo:</span>
                <span style={{
                  fontWeight: '600',
                  color: formData.tipo_movimiento === 'ingreso' ? '#10b981' : '#dc2626'
                }}>
                  {formData.tipo_movimiento === 'ingreso' ? 'INGRESO (+)' : 'EGRESO (-)'}
                </span>
              </div>
              <div style={styles.previewRow}>
                <span>Monto:</span>
                <span style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: formData.tipo_movimiento === 'ingreso' ? '#10b981' : '#dc2626'
                }}>
                  {formData.tipo_movimiento === 'ingreso' ? '+' : '-'}
                  ${parseFloat(formData.monto).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div style={styles.actions}>
          <button
            type="button"
            onClick={() => navigate(buildTenantPath(`/caja/${id}`))}
            style={styles.cancelButton}
            disabled={loading}
          >
            <X size={18} style={{ marginRight: '6px' }} />
            {t('cancel')}
          </button>
          <button
            type="submit"
            style={{
              ...styles.submitButton,
              backgroundColor: formData.tipo_movimiento === 'ingreso' ? '#10b981' : '#dc2626'
            }}
            disabled={loading}
          >
            <Save size={18} style={{ marginRight: '6px' }} />
            {loading ? 'Procesando...' : 'Registrar Movimiento'}
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
    margin: '0 0 4px 0',
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
    maxWidth: '800px',
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
    margin: '0 0 24px 0',
    paddingBottom: '12px',
    borderBottom: '2px solid #f3f4f6',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
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
    padding: '12px 40px 12px 14px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none',
  },
  montoInputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  montoIcon: {
    position: 'absolute',
    left: '14px',
    color: '#6b7280',
  },
  montoInput: {
    width: '100%',
    padding: '12px 14px 12px 45px',
    fontSize: '20px',
    fontWeight: '600',
    border: '2px solid',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: 'white',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: 'white',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  previewBox: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    border: '2px solid #e5e7eb',
  },
  previewTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  previewContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  previewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '15px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
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
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
};

export default RegistrarMovimientoCaja;