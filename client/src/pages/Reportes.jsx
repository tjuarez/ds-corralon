import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import {
  TrendingUp,
  Package,
  Users,
  AlertCircle,
  DollarSign,
  BarChart3,
  ArrowRight,
  FileText,
} from 'lucide-react';

const Reportes = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const reportes = [
    {
      id: 'ventas',
      title: 'Reporte de Ventas',
      description: 'Análisis detallado de ventas por período, formas de pago y tendencias',
      icon: TrendingUp,
      color: '#2563eb',
      bg: '#dbeafe',
      path: '/reportes/ventas',
      highlights: ['Ventas por período', 'Formas de pago', 'Ticket promedio']
    },
    {
      id: 'productos',
      title: 'Reporte de Productos',
      description: 'Productos más vendidos, análisis de rotación y estado de stock',
      icon: Package,
      color: '#10b981',
      bg: '#d1fae5',
      path: '/reportes/productos',
      highlights: ['Top productos', 'Unidades vendidas', 'Stock actual']
    },
    {
      id: 'clientes',
      title: 'Reporte de Clientes',
      description: 'Mejores clientes por facturación, análisis de cuenta corriente',
      icon: Users,
      color: '#f59e0b',
      bg: '#fef3c7',
      path: '/reportes/clientes',
      highlights: ['Top clientes', 'Facturación total', 'Estado de crédito']
    },
    {
      id: 'stock',
      title: 'Reporte de Stock',
      description: 'Estado actual del inventario, productos críticos y sin stock',
      icon: AlertCircle,
      color: '#dc2626',
      bg: '#fee2e2',
      path: '/reportes/stock',
      highlights: ['Stock crítico', 'Sin stock', 'Inventario completo']
    },
    {
      id: 'caja',
      title: 'Reporte de Caja',
      description: 'Análisis de movimientos de caja, ingresos, egresos y diferencias',
      icon: DollarSign,
      color: '#6366f1',
      bg: '#e0e7ff',
      path: '/reportes/caja',
      highlights: ['Ingresos/Egresos', 'Diferencias', 'Historial de cajas']
    },
    {
      id: 'rentabilidad',
      title: 'Reporte de Rentabilidad',
      description: 'Comparativa de ventas vs compras, margen y análisis financiero',
      icon: BarChart3,
      color: '#ec4899',
      bg: '#fce7f3',
      path: '/reportes/rentabilidad',
      highlights: ['Ventas vs Compras', 'Margen de ganancia', 'Ratio V/C']
    },
  ];

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('reports')}</h1>
          <p style={styles.subtitle}>
            Accede a análisis detallados y reportes del negocio
          </p>
        </div>
        <button onClick={() => navigate('/dashboard')} style={styles.dashboardButton}>
          <BarChart3 size={18} style={{ marginRight: '6px' }} />
          Ver Dashboard
        </button>
      </div>

      {/* Info Box */}
      <div style={styles.infoBox}>
        <FileText size={24} color="#2563eb" />
        <div>
          <div style={styles.infoTitle}>Centro de Reportes</div>
          <div style={styles.infoText}>
            Selecciona el reporte que deseas consultar. Todos los reportes permiten filtrar por período 
            y exportar la información para análisis adicional.
          </div>
        </div>
      </div>

      {/* Grid de Reportes */}
      <div style={styles.grid}>
        {reportes.map((reporte) => {
          const Icon = reporte.icon;
          return (
            <div
              key={reporte.id}
              style={styles.card}
              onClick={() => navigate(reporte.path)}
            >
              <div style={styles.cardHeader}>
                <div style={{
                  ...styles.cardIcon,
                  backgroundColor: reporte.bg,
                }}>
                  <Icon size={32} color={reporte.color} />
                </div>
                <ArrowRight 
                  size={24} 
                  color="#9ca3af" 
                  style={styles.cardArrow}
                />
              </div>

              <h3 style={styles.cardTitle}>{reporte.title}</h3>
              <p style={styles.cardDescription}>{reporte.description}</p>

              <div style={styles.cardHighlights}>
                {reporte.highlights.map((highlight, index) => (
                  <span key={index} style={styles.highlight}>
                    • {highlight}
                  </span>
                ))}
              </div>

              <button style={{
                ...styles.cardButton,
                backgroundColor: reporte.bg,
                color: reporte.color,
              }}>
                Ver Reporte
                <ArrowRight size={16} style={{ marginLeft: '6px' }} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Quick Access */}
      <div style={styles.quickAccessBox}>
        <h2 style={styles.quickAccessTitle}>Acceso Rápido</h2>
        <div style={styles.quickAccessGrid}>
          <button
            onClick={() => navigate('/dashboard')}
            style={styles.quickAccessButton}
          >
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => navigate('/ventas')}
            style={styles.quickAccessButton}
          >
            <TrendingUp size={20} />
            <span>Ventas</span>
          </button>
          <button
            onClick={() => navigate('/productos')}
            style={styles.quickAccessButton}
          >
            <Package size={20} />
            <span>Productos</span>
          </button>
          <button
            onClick={() => navigate('/clientes')}
            style={styles.quickAccessButton}
          >
            <Users size={20} />
            <span>Clientes</span>
          </button>
        </div>
      </div>
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
  dashboardButton: {
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
  infoBox: {
    padding: '24px',
    backgroundColor: '#eff6ff',
    border: '2px solid #93c5fd',
    borderRadius: '12px',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    marginBottom: '30px',
  },
  infoTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: '8px',
  },
  infoText: {
    fontSize: '15px',
    color: '#1e40af',
    lineHeight: '1.6',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px',
    marginBottom: '40px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    border: '2px solid #f3f4f6',
    cursor: 'pointer',
    transition: 'all 0.3s',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  cardIcon: {
    width: '72px',
    height: '72px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardArrow: {
    transition: 'transform 0.3s',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 12px 0',
  },
  cardDescription: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.6',
    margin: '0 0 20px 0',
    flex: 1,
  },
  cardHighlights: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #f3f4f6',
  },
  highlight: {
    fontSize: '13px',
    color: '#4b5563',
  },
  cardButton: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  quickAccessBox: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  quickAccessTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 20px 0',
  },
  quickAccessGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
  },
  quickAccessButton: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#1f2937',
    transition: 'all 0.2s',
  },
};

// Agregar efecto hover con CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  div[style*="cursor: pointer"]:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
    border-color: #10b981 !important;
  }
  
  div[style*="cursor: pointer"]:hover svg {
    transform: translateX(4px);
  }
  
  button[style*="cursor: pointer"]:hover {
    transform: scale(1.02);
    opacity: 0.9;
  }
`;
document.head.appendChild(styleSheet);

export default Reportes;