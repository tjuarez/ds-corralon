import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { buildTenantPath } from '../utils/tenantHelper';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { cajaApi } from '../api/caja';
import { formatCurrency } from '../utils/formatters';
import Layout from '../components/Layout';
import { ArrowLeft, Save, X, DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

const CerrarCaja = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const { showSuccess, showError, showConfirm } = useNotification();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [caja, setCaja] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [formData, setFormData] = useState({
    monto_final: '',
    observaciones: '',
  });

  useEffect(() => {
    loadCaja();
  }, [id]);

  const loadCaja = async () => {
    try {
      const [cajaData, resumenData] = await Promise.all([
        cajaApi.getById(id),
        cajaApi.getResumen(id)
      ]);
      
      if (cajaData.caja.estado !== 'abierta') {
        showError('La caja ya está cerrada');
        navigate(buildTenantPath('/caja'));
        return;
      }
      
      setCaja(cajaData.caja);
      setResumen(resumenData);
      // Pre-cargar con el monto esperado
      setFormData(prev => ({
        ...prev,
        monto_final: resumenData.monto_actual.toFixed(2)
      }));
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

    if (formData.monto_final === '' || parseFloat(formData.monto_final) < 0) {
      showError('El monto final debe ser mayor o igual a 0');
      return;
    }

    const montoFinal = parseFloat(formData.monto_final);
    const diferencia = montoFinal - resumen.monto_actual;

    let mensaje = `¿Confirmar cierre de caja?\n\n`;
    mensaje += `Monto esperado: $${resumen.monto_actual.toFixed(2)}\n`;
    mensaje += `Monto contado: $${montoFinal.toFixed(2)}\n`;
    
    if (Math.abs(diferencia) > 0.01) {
      if (diferencia > 0) {
        mensaje += `\n⚠️ SOBRANTE: $${diferencia.toFixed(2)}`;
      } else {
        mensaje += `\n⚠️ FALTANTE: $${Math.abs(diferencia).toFixed(2)}`;
      }
    } else {
      mensaje += `\n✓ Cuadre perfecto`;
    }

    const confirmed = await showConfirm(mensaje);
    if (!confirmed) return;

    setLoading(true);

    try {
      const dataToSend = {
        monto_final: montoFinal,
        observaciones: formData.observaciones,
        usuario_id: user.id,
      };

      const result = await cajaApi.cerrarCaja(id, dataToSend);
      
      if (Math.abs(result.diferencia) < 0.01) {
        showSuccess('Caja cerrada exitosamente. Cuadre perfecto!');
      } else {
        showSuccess(`Caja cerrada. Diferencia: $${result.diferencia.toFixed(2)}`);
      }
      
      navigate(buildTenantPath('/caja'));
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!caja || !resumen) {
    return (
      <Layout>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>{t('loading')}</p>
        </div>
      </Layout>
    );
  }

  const montoFinal = parseFloat(formData.monto_final) || 0;
  const diferencia = montoFinal - resumen.monto_actual;

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Cerrar Caja N° {caja.numero}</h1>
          <p style={styles.subtitle}>Realizar el arqueo y cierre de caja</p>
        </div>
        <button
          onClick={() => navigate(buildTenantPath(`/caja/${id}`))}
          style={styles.backButton}
        >
          <ArrowLeft size={18} style={{ marginRight: '6px' }} />
          {t('back')}
        </button>
      </div>

      {/* Resumen de la Caja */}
      <div style={styles.resumenBox}>
        <h2 style={styles.resumenTitle}>Resumen del Turno</h2>
        
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <DollarSign size={20} color="#6b7280" />
            <div>
              <div style={styles.statLabel}>Monto Inicial</div>
              <div style={styles.statValue}>{formatCurrency(caja.monto_inicial, '$')}</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <TrendingUp size={20} color="#10b981" />
            <div>
              <div style={styles.statLabel}>Ingresos ({resumen.cantidad_ingresos})</div>
              <div style={{ ...styles.statValue, color: '#10b981' }}>
                {formatCurrency(resumen.total_ingresos, '$')}
              </div>
            </div>
          </div>

          <div style={styles.statCard}>
            <TrendingDown size={20} color="#dc2626" />
            <div>
              <div style={styles.statLabel}>Egresos ({resumen.cantidad_egresos})</div>
              <div style={{ ...styles.statValue, color: '#dc2626' }}>
                {formatCurrency(resumen.total_egresos, '$')}
              </div>
            </div>
          </div>

          <div style={styles.statCardTotal}>
            <div style={styles.statLabel}>Monto Esperado</div>
            <div style={styles.statValueTotal}>
              {formatCurrency(resumen.monto_actual, '$')}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Arqueo de Caja</h2>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Monto Final (Contado) <span style={styles.required}>*</span>
            </label>
            <div style={styles.montoInputContainer}>
              <DollarSign size={18} style={styles.montoIcon} />
              <input
                type="number"
                name="monto_final"
                value={formData.monto_final}
                onChange={handleChange}
                style={styles.montoInput}
                min="0"
                step="0.01"
                required
                placeholder="0.00"
                autoFocus
              />
            </div>
            <p style={styles.hint}>
              Cuente el efectivo en caja e ingrese el monto total
            </p>
          </div>

          {/* Calculadora de Diferencia */}
          {formData.monto_final && (
            <div style={{
              ...styles.diferenciaBox,
              backgroundColor: Math.abs(diferencia) < 0.01 ? '#d1fae5' 
                : diferencia > 0 ? '#fef3c7' 
                : '#fee2e2',
              borderColor: Math.abs(diferencia) < 0.01 ? '#10b981' 
                : diferencia > 0 ? '#f59e0b' 
                : '#dc2626',
            }}>
              <div style={styles.diferenciaHeader}>
                <AlertCircle 
                  size={24} 
                  color={Math.abs(diferencia) < 0.01 ? '#10b981' 
                    : diferencia > 0 ? '#f59e0b' 
                    : '#dc2626'
                  } 
                />
                <span style={styles.diferenciaTitle}>
                  {Math.abs(diferencia) < 0.01 ? '✓ Cuadre Perfecto' 
                    : diferencia > 0 ? '⚠️ Sobrante en Caja' 
                    : '⚠️ Faltante en Caja'
                  }
                </span>
              </div>
              
              <div style={styles.diferenciaBody}>
                <div style={styles.diferenciaRow}>
                  <span>Esperado:</span>
                  <span>{formatCurrency(resumen.monto_actual, '$')}</span>
                </div>
                <div style={styles.diferenciaRow}>
                  <span>Contado:</span>
                  <span>{formatCurrency(montoFinal, '$')}</span>
                </div>
                {Math.abs(diferencia) >= 0.01 && (
                  <div style={styles.diferenciaRowFinal}>
                    <span>Diferencia:</span>
                    <span style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: diferencia > 0 ? '#f59e0b' : '#dc2626'
                    }}>
                      {diferencia > 0 ? '+' : ''}{formatCurrency(diferencia, '$')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Observaciones de Cierre</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              style={styles.textarea}
              rows="4"
              placeholder="Notas sobre el cierre, justificación de diferencias, etc..."
            />
          </div>
        </div>

        {/* Info del Usuario */}
        <div style={styles.infoBox}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Cerrada por:</span>
            <span style={styles.infoValue}>{user.nombre} {user.apellido}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Fecha y hora:</span>
            <span style={styles.infoValue}>
              {new Date().toLocaleString('es-AR')}
            </span>
          </div>
        </div>

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
            style={styles.submitButton}
            disabled={loading}
          >
            <Save size={18} style={{ marginRight: '6px' }} />
            {loading ? 'Procesando...' : 'Cerrar Caja'}
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
  resumenBox: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    marginBottom: '30px',
  },
  resumenTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 20px 0',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  statCard: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  statCardTotal: {
    padding: '16px',
    backgroundColor: '#2563eb',
    borderRadius: '8px',
    color: 'white',
  },
  statLabel: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statValueTotal: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
    marginTop: '4px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
    maxWidth: '700px',
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
    padding: '16px 14px 16px 45px',
    fontSize: '24px',
    fontWeight: '600',
    border: '2px solid #2563eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: 'white',
  },
  hint: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '4px 0 0 0',
  },
  diferenciaBox: {
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid',
    marginBottom: '20px',
  },
  diferenciaHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  diferenciaTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
  diferenciaBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  diferenciaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '15px',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(0,0,0,0.1)',
  },
  diferenciaRowFinal: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '12px',
    marginTop: '8px',
    borderTop: '2px solid rgba(0,0,0,0.2)',
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
  infoBox: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    border: '2px solid #f3f4f6',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '15px',
  },
  infoLabel: {
    color: '#6b7280',
  },
  infoValue: {
    fontWeight: '600',
    color: '#1f2937',
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
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
};

export default CerrarCaja;