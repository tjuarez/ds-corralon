import { createContext, useContext, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe usarse dentro de NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      removeNotification(id);
    }, 4000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (message) => addNotification(message, 'success');
  const showError = (message) => addNotification(message, 'error');
  const showWarning = (message) => addNotification(message, 'warning');
  const showInfo = (message) => addNotification(message, 'info');

  const showConfirm = (message, onConfirm, onCancel) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        message,
        onConfirm: () => {
          setConfirmDialog(null);
          if (onConfirm) onConfirm();
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          if (onCancel) onCancel();
          resolve(false);
        }
      });
    });
  };

  return (
    <NotificationContext.Provider value={{
      showSuccess,
      showError,
      showWarning,
      showInfo,
      showConfirm
    }}>
      {children}
      
      {/* Toast Notifications */}
      <div style={styles.notificationContainer}>
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </NotificationContext.Provider>
  );
};

const Notification = ({ message, type, onClose }) => {
  const configs = {
    success: {
      icon: CheckCircle,
      color: '#10b981',
      bg: '#d1fae5',
      border: '#6ee7b7'
    },
    error: {
      icon: XCircle,
      color: '#ef4444',
      bg: '#fee2e2',
      border: '#fca5a5'
    },
    warning: {
      icon: AlertCircle,
      color: '#f59e0b',
      bg: '#fef3c7',
      border: '#fcd34d'
    },
    info: {
      icon: Info,
      color: '#3b82f6',
      bg: '#dbeafe',
      border: '#93c5fd'
    }
  };

  const config = configs[type] || configs.info;
  const Icon = config.icon;

  return (
    <div style={{
      ...styles.notification,
      backgroundColor: config.bg,
      borderColor: config.border,
    }}>
      <Icon size={20} color={config.color} style={{ flexShrink: 0 }} />
      <span style={styles.notificationMessage}>{message}</span>
      <button
        onClick={onClose}
        style={styles.closeButton}
      >
        <X size={16} color="#6b7280" />
      </button>
    </div>
  );
};

const ConfirmDialog = ({ message, onConfirm, onCancel }) => {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <AlertCircle size={24} color="#f59e0b" />
          <h3 style={styles.modalTitle}>Confirmar acción</h3>
        </div>
        
        <p style={styles.modalMessage}>{message}</p>
        
        <div style={styles.modalActions}>
          <button
            onClick={onCancel}
            style={styles.cancelButton}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={styles.confirmButton}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  notificationContainer: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '400px',
  },
  notification: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderRadius: '8px',
    border: '2px solid',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    animation: 'slideIn 0.3s ease-out',
  },
  notificationMessage: {
    flex: 1,
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937',
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    animation: 'fadeIn 0.2s ease-out',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '28px',
    maxWidth: '450px',
    width: '90%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    animation: 'scaleIn 0.2s ease-out',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  modalMessage: {
    fontSize: '15px',
    color: '#4b5563',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelButton: {
    padding: '10px 24px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  confirmButton: {
    padding: '10px 24px',
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#ef4444',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};