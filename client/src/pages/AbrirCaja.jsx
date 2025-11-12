import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildTenantPath } from '../utils/tenantHelper';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { cajaApi } from '../api/caja';
import Layout from '../components/Layout';
import { ArrowLeft, Save, X, DollarSign } from 'lucide-react';

const AbrirCaja = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    monto_inicial: '',
    observaciones: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.monto_inicial || parseFloat(formData.monto_inicial) < 0) {
      showError('El monto inicial debe ser mayor o igual a 0');
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        monto_inicial: parseFloat(formData.monto_inicial),
        observaciones: formData.observaciones,
        usuario_id: user.id,
      };

      const result = await cajaApi.abrirCaja(dataToSend);
      showSuccess(`Caja N° ${result.numero} abierta exitosamente`);
      navigate(buildTenantPath('/caja'));
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
          <h1 style={styles.title}>Abrir Caja</h1>
          <p style={styles.subtitle}>Iniciar un nuevo turno de caja</p>
        </div>
        <button
          onClick={() => navigate(buildTenantPath('/caja'))}
          style={styles.backButton}
        >
          <ArrowLeft size={18} style={{ marginRight: '6px' }} />
          {t('back')}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Datos de Apertura</h2>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Monto Inicial <span style={styles.required}>*</span>
            </label>
            <div style={styles.montoInputContainer}>
              <DollarSign size={18} style={styles.montoIcon} />
              <input
                type="number"
                name="monto_inicial"
                value={formData.monto_inicial}
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
              Ingrese el monto en efectivo con el que inicia la caja
            </p>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              style={styles.textarea}
              rows="4"
              placeholder="Notas sobre la apertura de caja (opcional)..."
            />
          </div>
        </div>

        {/* Info del Usuario */}
        <div style={styles.infoBox}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Usuario:</span>
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
            onClick={() => navigate(buildTenantPath('/caja'))}
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
            {loading ? 'Procesando...' : 'Abrir Caja'}
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
    maxWidth: '600px',
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
    border: '2px solid #10b981',
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

export default AbrirCaja;