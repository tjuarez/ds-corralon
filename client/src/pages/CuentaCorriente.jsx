import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildTenantPath } from '../utils/tenantHelper';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { cuentaCorrienteApi } from '../api/cuentaCorriente';
import { formatCurrency } from '../utils/formatters';
import Layout from '../components/Layout';
import { Search, Eye, DollarSign, TrendingUp, AlertCircle, Users, FileText } from 'lucide-react';

const CuentaCorriente = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showError } = useNotification();
  
  const [clientes, setClientes] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroSaldo, setFiltroSaldo] = useState('todos');

  useEffect(() => {
    loadData();
  }, [search, filtroSaldo]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const filters = {};
      if (search) filters.search = search;
      if (filtroSaldo === 'con_saldo') filters.con_saldo = 'true';
      
      const [clientesData, resumenData] = await Promise.all([
        cuentaCorrienteApi.getClientes(filters),
        cuentaCorrienteApi.getResumen()
      ]);

      setClientes(clientesData.clientes);
      setResumen(resumenData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getSaldoBadge = (saldo, limite) => {
    if (saldo === 0) {
      return (
        <span style={styles.badgeSinDeuda}>Sin deuda</span>
      );
    } else if (saldo > limite && limite > 0) {
      return (
        <span style={styles.badgeSobreLimite}>
          <AlertCircle size={14} style={{ marginRight: '4px' }} />
          Sobre límite
        </span>
      );
    } else {
      return (
        <span style={styles.badgeConDeuda}>Con deuda</span>
      );
    }
  };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('currentAccount')}</h1>
          <p style={styles.subtitle}>Gestión de crédito y cobranzas</p>
        </div>
      </div>

      {/* Resumen General */}
      {resumen && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, backgroundColor: '#dbeafe' }}>
              <Users size={24} color="#2563eb" />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statLabel}>Clientes con C.C.</div>
              <div style={styles.statValue}>{resumen.stats.total_clientes_con_cc}</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, backgroundColor: '#fee2e2' }}>
              <AlertCircle size={24} color="#dc2626" />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statLabel}>Con Deuda</div>
              <div style={styles.statValue}>{resumen.stats.clientes_con_deuda}</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, backgroundColor: '#fef3c7' }}>
              <DollarSign size={24} color="#f59e0b" />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statLabel}>Deuda Total</div>
              <div style={styles.statValue}>
                $ {parseFloat(resumen.stats.deuda_total).toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, backgroundColor: '#fee2e2' }}>
              <TrendingUp size={24} color="#dc2626" />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statLabel}>Sobre Límite</div>
              <div style={styles.statValue}>
                $ {parseFloat(resumen.stats.deuda_sobre_limite).toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={styles.filters}>
        <div style={styles.searchContainer}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder={`${t('search')} cliente...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <select
          value={filtroSaldo}
          onChange={(e) => setFiltroSaldo(e.target.value)}
          style={styles.select}
        >
          <option value="todos">Todos los clientes</option>
          <option value="con_saldo">Solo con deuda</option>
        </select>
      </div>

      {/* Lista de clientes */}
      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>{t('loading')}</p>
        </div>
      ) : clientes.length === 0 ? (
        <div style={styles.noData}>
          <FileText size={48} color="#9ca3af" />
          <p style={styles.noDataText}>No hay clientes con cuenta corriente</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {clientes.map((cliente) => {
            const creditoDisponible = cliente.limite_credito - cliente.saldo_cuenta_corriente;
            
            return (
              <div key={cliente.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.cardTitle}>{cliente.razon_social}</h3>
                    <div style={styles.cardSubtitle}>
                      {cliente.tipo_cliente === 'minorista' && 'Minorista'}
                      {cliente.tipo_cliente === 'mayorista' && 'Mayorista'}
                      {cliente.tipo_cliente === 'obra' && 'Obra'}
                    </div>
                  </div>
                  {getSaldoBadge(cliente.saldo_cuenta_corriente, cliente.limite_credito)}
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Saldo actual:</span>
                    <span style={{
                      ...styles.infoValue,
                      color: cliente.saldo_cuenta_corriente > 0 ? '#dc2626' : '#10b981',
                      fontWeight: '700',
                    }}>
                      {formatCurrency(cliente.saldo_cuenta_corriente, '$')}
                    </span>
                  </div>

                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Límite de crédito:</span>
                    <span style={styles.infoValue}>
                      {formatCurrency(cliente.limite_credito, '$')}
                    </span>
                  </div>

                  {cliente.limite_credito > 0 && (
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Crédito disponible:</span>
                      <span style={{
                        ...styles.infoValue,
                        color: creditoDisponible < 0 ? '#dc2626' : '#10b981',
                        fontWeight: '600',
                      }}>
                        {formatCurrency(Math.max(0, creditoDisponible), '$')}
                      </span>
                    </div>
                  )}

                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Movimientos:</span>
                    <span style={styles.infoValue}>
                      {cliente.cantidad_movimientos || 0}
                    </span>
                  </div>
                </div>

                <div style={styles.cardFooter}>
                  <button
                    onClick={() => navigate(buildTenantPath(`/cuenta-corriente/${cliente.id}`))}
                    style={styles.viewButton}
                  >
                    <Eye size={16} style={{ marginRight: '6px' }} />
                    Ver Estado de Cuenta
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  statIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  filters: {
    display: 'flex',
    gap: '15px',
    marginBottom: '30px',
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    color: '#9ca3af',
  },
  searchInput: {
    flex: 1,
    padding: '12px 16px 12px 45px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
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
  noData: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  noDataText: {
    fontSize: '18px',
    color: '#6b7280',
    margin: '20px 0 0 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '2px solid #f3f4f6',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  cardSubtitle: {
    fontSize: '13px',
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  badgeSinDeuda: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  badgeConDeuda: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  badgeSobreLimite: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    display: 'flex',
    alignItems: 'center',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  infoValue: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1f2937',
  },
  cardFooter: {
    paddingTop: '16px',
    borderTop: '2px solid #f3f4f6',
  },
  viewButton: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default CuentaCorriente;