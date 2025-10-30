import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.username, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || t('loginError'));
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  return (
    <div style={styles.container}>
      <div style={styles.languageSelector}>
        <select 
          value={language} 
          onChange={handleLanguageChange}
          style={styles.languageSelect}
        >
          <option value="es">Español</option>
          <option value="en">English</option>
          <option value="pt">Português</option>
        </select>
      </div>

      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>{t('appName')}</h1>
          <p style={styles.subtitle}>{t('appDescription')}</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.formTitle}>{t('login')}</h2>

          {error && (
            <div style={styles.errorMessage}>
              {error}
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>{t('username')}</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={styles.input}
              required
              autoComplete="username"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>{t('password')}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? t('loading') : t('login')}
          </button>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              {t('dontHaveAccount')}{' '}
              <Link to="/register" style={styles.link}>
                {t('register')}
              </Link>
            </p>
          </div>
        </form>

        <div style={styles.infoBox}>
          <p style={styles.infoTitle}>Usuario de prueba:</p>
          <p style={styles.infoText}>Usuario: <strong>admin</strong></p>
          <p style={styles.infoText}>Contraseña: <strong>admin123</strong></p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    padding: '20px',
    position: 'relative',
  },
  languageSelector: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    zIndex: 10,
  },
  languageSelect: {
    padding: '10px 40px 10px 15px',
    fontSize: '15px',
    fontWeight: '500',
    borderRadius: '8px',
    border: '2px solid #2563eb',
    backgroundColor: 'white',
    color: '#1f2937',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    width: '100%',
    maxWidth: '480px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 10px 0',
    textAlign: 'center',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    padding: '12px 14px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: 'white',
    color: '#1f2937',
  },
  button: {
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '10px',
  },
  errorMessage: {
    padding: '14px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'center',
    border: '1px solid #fecaca',
  },
  footer: {
    textAlign: 'center',
    marginTop: '10px',
  },
  footerText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: '600',
  },
  infoBox: {
    marginTop: '25px',
    padding: '18px',
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    border: '2px solid #bfdbfe',
  },
  infoTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e40af',
    margin: '0 0 10px 0',
  },
  infoText: {
    fontSize: '13px',
    color: '#1e40af',
    margin: '5px 0',
  },
};

export default Login;