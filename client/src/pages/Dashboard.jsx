import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { ShoppingCart, UserPlus, PackagePlus, FileText, TrendingUp, Users as UsersIcon, Package, FilePlus, DollarSign } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <Layout>
      <div style={styles.welcomeSection}>
        <h2 style={styles.welcomeTitle}>
          {t('welcome')}, {user?.nombre}!
        </h2>
        <p style={styles.welcomeText}>
          {t('appDescription')}
        </p>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={{...styles.statCard, ...styles.statCard1}}>
          <div style={styles.statIconContainer}>
            <TrendingUp size={24} color="#3b82f6" />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>{t('todaySales')}</p>
            <p style={styles.statValue}>$0</p>
          </div>
        </div>

        <div style={{...styles.statCard, ...styles.statCard2}}>
          <div style={styles.statIconContainer}>
            <UsersIcon size={24} color="#10b981" />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>{t('totalClients')}</p>
            <p style={styles.statValue}>0</p>
          </div>
        </div>

        <div style={{...styles.statCard, ...styles.statCard3}}>
          <div style={styles.statIconContainer}>
            <Package size={24} color="#f59e0b" />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>{t('lowStock')}</p>
            <p style={styles.statValue}>0</p>
          </div>
        </div>

        <div style={{...styles.statCard, ...styles.statCard4}}>
          <div style={styles.statIconContainer}>
            <FilePlus size={24} color="#8b5cf6" />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>{t('pendingQuotes')}</p>
            <p style={styles.statValue}>0</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Acciones Rápidas</h3>
        <div style={styles.actionsGrid}>
          <button style={styles.actionButton}>
            <ShoppingCart size={20} style={{ marginRight: '8px' }} />
            Nueva Venta
          </button>
          <button style={styles.actionButton}>
            <UserPlus size={20} style={{ marginRight: '8px' }} />
            Nuevo Cliente
          </button>
          <button style={styles.actionButton}>
            <PackagePlus size={20} style={{ marginRight: '8px' }} />
            Nuevo Producto
          </button>
          <button style={styles.actionButton}>
            <FileText size={20} style={{ marginRight: '8px' }} />
            Nuevo Presupuesto
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div style={styles.infoCard}>
        <h3 style={styles.infoTitle}>Sistema en Desarrollo</h3>
        <p style={styles.infoText}>
          Este es el dashboard inicial. En los próximos pasos agregaremos todos los módulos de gestión.
        </p>
      </div>
    </Layout>
  );
};

const styles = {
  welcomeSection: {
    marginBottom: '30px',
  },
  welcomeTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 10px 0',
  },
  welcomeText: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '35px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '28px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  statIconContainer: {
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  statCard1: {
    borderLeft: '5px solid #3b82f6',
  },
  statCard2: {
    borderLeft: '5px solid #10b981',
  },
  statCard3: {
    borderLeft: '5px solid #f59e0b',
  },
  statCard4: {
    borderLeft: '5px solid #8b5cf6',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 6px 0',
    fontWeight: '500',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
  },
  section: {
    marginBottom: '35px',
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '20px',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '18px',
  },
  actionButton: {
    padding: '18px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    border: '2px solid #bfdbfe',
    borderRadius: '12px',
    padding: '28px',
  },
  infoTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e40af',
    margin: '0 0 15px 0',
  },
  infoText: {
    fontSize: '15px',
    color: '#1e40af',
    margin: 0,
    lineHeight: '1.6',
  },
};

export default Dashboard;