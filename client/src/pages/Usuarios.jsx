import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { usuariosApi } from '../api/usuarios';
import Layout from '../components/Layout';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  ShoppingCart, 
  Wallet,
  Building2,
  CheckCircle,
  XCircle,
  Search,
  Mail,
  User as UserIcon,
} from 'lucide-react';

const Usuarios = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showSuccess, showError, showConfirm } = useNotification();

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroRol, setFiltroRol] = useState('todos');

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuariosApi.getAll();
      setUsuarios(data.usuarios);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    const usuario = usuarios.find(u => u.id === id);
    const accion = usuario.activo ? 'desactivar' : 'activar';
    
    const confirmed = await showConfirm(
      `¿Confirmar ${accion} el usuario "${usuario.username}"?`
    );

    if (!confirmed) return;

    try {
      await usuariosApi.toggle(id);
      showSuccess(`Usuario ${accion === 'activar' ? 'activado' : 'desactivado'} exitosamente`);
      loadUsuarios();
    } catch (error) {
      showError(error.message);
    }
  };

  const handleDelete = async (id) => {
    const usuario = usuarios.find(u => u.id === id);
    
    if (usuario.username === 'admin') {
      showError('No se puede eliminar el usuario administrador principal');
      return;
    }

    const confirmed = await showConfirm(
      `¿Confirmar eliminar el usuario "${usuario.username}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      await usuariosApi.delete(id);
      showSuccess('Usuario eliminado exitosamente');
      loadUsuarios();
    } catch (error) {
      showError(error.message);
    }
  };

  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchSearch = 
      usuario.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchEstado = 
      filtroEstado === 'todos' ||
      (filtroEstado === 'activos' && usuario.activo) ||
      (filtroEstado === 'inactivos' && !usuario.activo);

    const matchRol = 
      filtroRol === 'todos' || usuario.rol === filtroRol;

    return matchSearch && matchEstado && matchRol;
  });

  const stats = {
    total: usuarios.length,
    activos: usuarios.filter(u => u.activo).length,
    inactivos: usuarios.filter(u => !u.activo).length,
    admins: usuarios.filter(u => u.rol === 'admin').length,
    vendedores: usuarios.filter(u => u.rol === 'vendedor').length,
    cajeros: usuarios.filter(u => u.rol === 'cajero').length,
  };

  const getRolBadge = (rol) => {
    const roles = {
      admin: { text: 'Admin', color: '#dc2626', bg: '#fee2e2', icon: Shield },
      vendedor: { text: 'Vendedor', color: '#2563eb', bg: '#dbeafe', icon: ShoppingCart },
      cajero: { text: 'Cajero', color: '#10b981', bg: '#d1fae5', icon: Wallet },
    };
    return roles[rol] || roles.vendedor;
  };

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('users')}</h1>
          <p style={styles.subtitle}>Gestión de usuarios del sistema</p>
        </div>
        <button
          onClick={() => navigate('/usuarios/nuevo')}
          style={styles.addButton}
        >
          <Plus size={18} style={{ marginRight: '6px' }} />
          Nuevo Usuario
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#dbeafe' }}>
            <UserIcon size={24} color="#2563eb" />
          </div>
          <div>
            <div style={styles.statLabel}>Total</div>
            <div style={styles.statValue}>{stats.total}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#d1fae5' }}>
            <CheckCircle size={24} color="#10b981" />
          </div>
          <div>
            <div style={styles.statLabel}>Activos</div>
            <div style={styles.statValue}>{stats.activos}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#fee2e2' }}>
            <Shield size={24} color="#dc2626" />
          </div>
          <div>
            <div style={styles.statLabel}>Administradores</div>
            <div style={styles.statValue}>{stats.admins}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#dbeafe' }}>
            <ShoppingCart size={24} color="#2563eb" />
          </div>
          <div>
            <div style={styles.statLabel}>Vendedores</div>
            <div style={styles.statValue}>{stats.vendedores}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#d1fae5' }}>
            <Wallet size={24} color="#10b981" />
          </div>
          <div>
            <div style={styles.statLabel}>Cajeros</div>
            <div style={styles.statValue}>{stats.cajeros}</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={styles.filtersBox}>
        <div style={styles.searchBox}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por usuario, nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterButtons}>
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="todos">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="vendedor">Vendedores</option>
            <option value="cajero">Cajeros</option>
          </select>

          <button
            onClick={() => setFiltroEstado('todos')}
            style={{
              ...styles.filterButton,
              ...(filtroEstado === 'todos' ? styles.filterButtonActive : {})
            }}
          >
            Todos ({stats.total})
          </button>
          <button
            onClick={() => setFiltroEstado('activos')}
            style={{
              ...styles.filterButton,
              ...(filtroEstado === 'activos' ? styles.filterButtonActive : {})
            }}
          >
            Activos ({stats.activos})
          </button>
          <button
            onClick={() => setFiltroEstado('inactivos')}
            style={{
              ...styles.filterButton,
              ...(filtroEstado === 'inactivos' ? styles.filterButtonActive : {})
            }}
          >
            Inactivos ({stats.inactivos})
          </button>
        </div>
      </div>

      {/* Lista de Usuarios */}
      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>{t('loading')}</p>
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <div style={styles.noData}>
          <UserIcon size={48} color="#9ca3af" />
          <p style={styles.noDataText}>
            {searchTerm || filtroEstado !== 'todos' || filtroRol !== 'todos'
              ? 'No se encontraron usuarios con los filtros aplicados'
              : 'No hay usuarios registrados'
            }
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {usuariosFiltrados.map((usuario) => {
            const rolBadge = getRolBadge(usuario.rol);
            const RolIcon = rolBadge.icon;
            
            return (
              <div key={usuario.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardTitleRow}>
                    <div style={styles.userAvatar}>
                      {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
                    </div>
                    <div>
                      <h3 style={styles.cardTitle}>
                        {usuario.nombre} {usuario.apellido}
                      </h3>
                      <div style={styles.username}>@{usuario.username}</div>
                    </div>
                  </div>
                  <span style={{
                    ...styles.estadoBadge,
                    backgroundColor: usuario.activo ? '#d1fae5' : '#fee2e2',
                    color: usuario.activo ? '#065f46' : '#991b1b',
                  }}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.infoRow}>
                    <span style={{
                      ...styles.rolBadge,
                      backgroundColor: rolBadge.bg,
                      color: rolBadge.color,
                    }}>
                      <RolIcon size={14} style={{ marginRight: '4px' }} />
                      {rolBadge.text}
                    </span>
                  </div>

                  <div style={styles.infoRow}>
                    <Mail size={16} style={styles.infoIcon} />
                    <span style={styles.infoText}>{usuario.email}</span>
                  </div>

                  {usuario.sucursal_nombre && (
                    <div style={styles.infoRow}>
                      <Building2 size={16} style={styles.infoIcon} />
                      <span style={styles.infoText}>{usuario.sucursal_nombre}</span>
                    </div>
                  )}
                </div>

                <div style={styles.cardActions}>
                  <button
                    onClick={() => navigate(`/usuarios/${usuario.id}/editar`)}
                    style={styles.editButton}
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleToggle(usuario.id)}
                    style={{
                      ...styles.toggleButton,
                      color: usuario.activo ? '#dc2626' : '#10b981',
                    }}
                    title={usuario.activo ? 'Desactivar' : 'Activar'}
                  >
                    {usuario.activo ? <XCircle size={16} /> : <CheckCircle size={16} />}
                  </button>
                  {usuario.username !== 'admin' && (
                    <button
                      onClick={() => handleDelete(usuario.id)}
                      style={styles.deleteButton}
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
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
  addButton: {
    padding: '12px 24px',
    fontSize: '16px',
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
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
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  filtersBox: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    marginBottom: '30px',
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchBox: {
    flex: '1 1 300px',
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#6b7280',
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px 10px 45px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
  },
  filterButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  filterSelect: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    outline: 'none',
  },
  filterButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterButtonActive: {
    color: '#10b981',
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
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
  noData: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '60px 20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    textAlign: 'center',
  },
  noDataText: {
    fontSize: '16px',
    color: '#6b7280',
    margin: '16px 0 0 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    border: '2px solid #f3f4f6',
    transition: 'all 0.2s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '2px solid #f3f4f6',
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  userAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  username: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '500',
  },
  estadoBadge: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '12px',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '16px',
  },
  rolBadge: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '12px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  infoIcon: {
    color: '#6b7280',
    flexShrink: 0,
  },
  infoText: {
    color: '#4b5563',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    paddingTop: '12px',
    borderTop: '1px solid #f3f4f6',
  },
  editButton: {
    flex: 1,
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
  toggleButton: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#f9fafb',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default Usuarios;