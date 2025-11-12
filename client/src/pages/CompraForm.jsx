import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildTenantPath } from '../utils/tenantHelper';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { comprasApi } from '../api/compras';
import { proveedoresApi } from '../api/proveedores';
import { productosApi } from '../api/productos';
import { formatCurrency } from '../utils/formatters';
import Layout from '../components/Layout';
import { ArrowLeft, Save, X, Plus, Trash2, Search, Package } from 'lucide-react';

const CompraForm = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [monedas] = useState([
    { id: 1, codigo: 'ARS', simbolo: '$' },
    { id: 2, codigo: 'USD', simbolo: 'US$' }
  ]);

  const [formData, setFormData] = useState({
    proveedor_id: '',
    fecha: new Date().toISOString().split('T')[0],
    numero_factura: '',
    tipo_comprobante: 'factura_b',
    moneda_id: '1',
    forma_pago: 'cuenta_corriente',
    descuento_porcentaje: '0',
    descuento_monto: '0',
    observaciones: '',
  });

  const [detalle, setDetalle] = useState([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    loadProveedores();
    loadProductos();
  }, []);

  const loadProveedores = async () => {
    try {
      const data = await proveedoresApi.getAll({ activo: 'true' });
      setProveedores(data.proveedores || []);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
    }
  };

  const loadProductos = async () => {
    try {
      const data = await productosApi.getAll({ activo: 'true' });
      setProductos(data.productos || []);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddProduct = (producto) => {
    if (!formData.proveedor_id) {
      showError('Selecciona un proveedor primero');
      return;
    }

    // Verificar si el producto ya está en el detalle
    const exists = detalle.find(d => d.producto_id === producto.id);
    if (exists) {
      showError('El producto ya está agregado');
      return;
    }

    const nuevoItem = {
      producto_id: producto.id,
      descripcion: producto.descripcion,
      cantidad: 1,
      precio_unitario: producto.precio_costo || 0,
      descuento_porcentaje: 0,
      producto_codigo: producto.codigo,
      producto_unidad: producto.unidad_medida,
    };

    setDetalle([...detalle, nuevoItem]);
    setShowProductSearch(false);
    setProductSearch('');
  };

  const handleRemoveProduct = (index) => {
    setDetalle(detalle.filter((_, i) => i !== index));
  };

  const handleDetalleChange = (index, field, value) => {
    const newDetalle = [...detalle];
    newDetalle[index][field] = value;
    setDetalle(newDetalle);
  };

  const calcularSubtotalItem = (item) => {
    const subtotal = item.cantidad * item.precio_unitario;
    const descuento = subtotal * (item.descuento_porcentaje / 100);
    return subtotal - descuento;
  };

  const calcularTotales = () => {
    const subtotal = detalle.reduce((sum, item) => sum + calcularSubtotalItem(item), 0);
    
    let descuento = 0;
    if (formData.descuento_monto && parseFloat(formData.descuento_monto) > 0) {
      descuento = parseFloat(formData.descuento_monto);
    } else if (formData.descuento_porcentaje && parseFloat(formData.descuento_porcentaje) > 0) {
      descuento = subtotal * (parseFloat(formData.descuento_porcentaje) / 100);
    }

    const total = subtotal - descuento;

    return { subtotal, descuento, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.proveedor_id) {
      showError('Debe seleccionar un proveedor');
      return;
    }

    if (detalle.length === 0) {
      showError('Debe agregar al menos un producto');
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        proveedor_id: parseInt(formData.proveedor_id),
        fecha: formData.fecha,
        numero_factura: formData.numero_factura || null,
        tipo_comprobante: formData.tipo_comprobante,
        moneda_id: parseInt(formData.moneda_id),
        forma_pago: formData.forma_pago,
        detalle: detalle.map(item => ({
          producto_id: item.producto_id,
          descripcion: item.descripcion,
          cantidad: parseFloat(item.cantidad),
          precio_unitario: parseFloat(item.precio_unitario),
          descuento_porcentaje: parseFloat(item.descuento_porcentaje) || 0,
        })),
        descuento_porcentaje: parseFloat(formData.descuento_porcentaje) || 0,
        descuento_monto: parseFloat(formData.descuento_monto) || 0,
        observaciones: formData.observaciones,
        usuario_id: user.id,
      };

      const result = await comprasApi.create(dataToSend);
      showSuccess(`Compra ${result.numero_comprobante} registrada exitosamente`);
      navigate(buildTenantPath('/compras'));
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = productos.filter(p =>
    p.codigo.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.descripcion.toLowerCase().includes(productSearch.toLowerCase())
  );

  const totales = calcularTotales();
  const monedaActual = monedas.find(m => m.id === parseInt(formData.moneda_id));

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('newPurchase')}</h1>
          <p style={styles.subtitle}>Registra una nueva compra a proveedor</p>
        </div>
        <button
          onClick={() => navigate(buildTenantPath('/compras'))}
          style={styles.backButton}
        >
          <ArrowLeft size={18} style={{ marginRight: '6px' }} />
          {t('back')}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Datos de la Compra */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Datos de la Compra</h2>

          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Proveedor <span style={styles.required}>*</span>
              </label>
              <select
                name="proveedor_id"
                value={formData.proveedor_id}
                onChange={handleChange}
                style={styles.select}
                required
              >
                <option value="">Seleccionar proveedor</option>
                {proveedores.map(proveedor => (
                  <option key={proveedor.id} value={proveedor.id}>
                    {proveedor.razon_social}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Número de Factura</label>
              <input
                type="text"
                name="numero_factura"
                value={formData.numero_factura}
                onChange={handleChange}
                style={styles.input}
                placeholder="Ej: 0001-00001234"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Tipo de Comprobante <span style={styles.required}>*</span>
              </label>
              <select
                name="tipo_comprobante"
                value={formData.tipo_comprobante}
                onChange={handleChange}
                style={styles.select}
                required
              >
                <option value="factura_a">Factura A</option>
                <option value="factura_b">Factura B</option>
                <option value="factura_c">Factura C</option>
                <option value="remito">Remito</option>
                <option value="nota_debito">Nota de Débito</option>
                <option value="nota_credito">Nota de Crédito</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Forma de Pago <span style={styles.required}>*</span>
              </label>
              <select
                name="forma_pago"
                value={formData.forma_pago}
                onChange={handleChange}
                style={styles.select}
                required
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
                <option value="cheque">Cheque</option>
                <option value="cuenta_corriente">Cuenta Corriente</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Moneda <span style={styles.required}>*</span>
              </label>
              <select
                name="moneda_id"
                value={formData.moneda_id}
                onChange={handleChange}
                style={styles.select}
                required
              >
                {monedas.map(moneda => (
                  <option key={moneda.id} value={moneda.id}>
                    {moneda.codigo} ({moneda.simbolo})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Fecha <span style={styles.required}>*</span>
              </label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
          </div>
        </div>

        {/* Productos */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Productos</h2>
            <button
              type="button"
              onClick={() => setShowProductSearch(!showProductSearch)}
              style={styles.addProductButton}
              disabled={!formData.proveedor_id}
            >
              <Plus size={18} style={{ marginRight: '6px' }} />
              {t('addProduct')}
            </button>
          </div>

          {showProductSearch && (
            <div style={styles.productSearchBox}>
              <div style={styles.searchContainer}>
                <Search size={18} style={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={styles.searchInput}
                  autoFocus
                />
              </div>
              <div style={styles.productList}>
                {filteredProducts.slice(0, 10).map(producto => (
                  <div
                    key={producto.id}
                    onClick={() => handleAddProduct(producto)}
                    style={styles.productItem}
                  >
                    <div>
                      <div style={styles.productCode}>{producto.codigo}</div>
                      <div style={styles.productDesc}>{producto.descripcion}</div>
                    </div>
                    <div style={styles.productStockBox}>
                      <Package size={14} style={{ marginRight: '4px' }} />
                      <span style={styles.productStock}>
                        {producto.stock_actual}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detalle.length === 0 ? (
            <div style={styles.emptyDetalle}>
              <Package size={48} color="#9ca3af" />
              <p>No hay productos agregados</p>
              <p style={styles.emptyDetalleHint}>
                Selecciona un proveedor y haz clic en "Agregar Producto"
              </p>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Código</th>
                    <th style={styles.th}>Producto</th>
                    <th style={styles.th}>Cantidad</th>
                    <th style={styles.th}>Precio Unit.</th>
                    <th style={styles.th}>Desc. %</th>
                    <th style={styles.th}>Subtotal</th>
                    <th style={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.map((item, index) => (
                    <tr key={index} style={styles.tr}>
                      <td style={styles.td}>{item.producto_codigo}</td>
                      <td style={styles.td}>{item.descripcion}</td>
                      <td style={styles.td}>
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => handleDetalleChange(index, 'cantidad', e.target.value)}
                          style={styles.tableInput}
                          min="0.01"
                          step="0.01"
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          type="number"
                          value={item.precio_unitario}
                          onChange={(e) => handleDetalleChange(index, 'precio_unitario', e.target.value)}
                          style={styles.tableInput}
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          type="number"
                          value={item.descuento_porcentaje}
                          onChange={(e) => handleDetalleChange(index, 'descuento_porcentaje', e.target.value)}
                          style={styles.tableInput}
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </td>
                      <td style={styles.td}>
                        {formatCurrency(calcularSubtotalItem(item), monedaActual?.simbolo)}
                      </td>
                      <td style={styles.td}>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(index)}
                          style={styles.removeButton}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Totales */}
        {detalle.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Descuentos y Totales</h2>

            <div style={styles.totalesContainer}>
              <div style={styles.descuentosBox}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Descuento %</label>
                  <input
                    type="number"
                    name="descuento_porcentaje"
                    value={formData.descuento_porcentaje}
                    onChange={handleChange}
                    style={styles.input}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Descuento Monto</label>
                  <input
                    type="number"
                    name="descuento_monto"
                    value={formData.descuento_monto}
                    onChange={handleChange}
                    style={styles.input}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div style={styles.totalesBox}>
                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>Subtotal:</span>
                  <span style={styles.totalValue}>
                    {formatCurrency(totales.subtotal, monedaActual?.simbolo)}
                  </span>
                </div>
                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>Descuento:</span>
                  <span style={styles.totalValue}>
                    {formatCurrency(totales.descuento, monedaActual?.simbolo)}
                  </span>
                </div>
                <div style={styles.totalRowFinal}>
                  <span style={styles.totalLabelFinal}>Total:</span>
                  <span style={styles.totalValueFinal}>
                    {formatCurrency(totales.total, monedaActual?.simbolo)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Observaciones */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Observaciones</h2>
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            style={styles.textarea}
            rows="3"
            placeholder="Notas adicionales sobre la compra..."
          />
        </div>

        {/* Botones */}
        <div style={styles.actions}>
          <button
            type="button"
            onClick={() => navigate(buildTenantPath('/compras'))}
            style={styles.cancelButton}
            disabled={loading}
          >
            <X size={18} style={{ marginRight: '6px' }} />
            {t('cancel')}
          </button>
          <button
            type="submit"
            style={styles.submitButton}
            disabled={loading || detalle.length === 0}
          >
            <Save size={18} style={{ marginRight: '6px' }} />
            {loading ? 'Procesando...' : 'Registrar Compra'}
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
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
    paddingBottom: '12px',
    borderBottom: '2px solid #f3f4f6',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
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
  addProductButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  productSearchBox: {
    marginBottom: '20px',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
  },
  searchContainer: {
    position: 'relative',
    marginBottom: '15px',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px 12px 45px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
  },
  productList: {
    maxHeight: '300px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  productItem: {
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
  productCode: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
  },
  productDesc: {
    fontSize: '14px',
    color: '#1f2937',
    marginTop: '4px',
  },
  productStockBox: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 10px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
  },
  productStock: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#4b5563',
  },
  emptyDetalle: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#6b7280',
  },
  emptyDetalleHint: {
    fontSize: '14px',
    color: '#9ca3af',
    marginTop: '8px',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    borderBottom: '2px solid #e5e7eb',
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
  },
  td: {
    padding: '12px',
    fontSize: '14px',
    color: '#1f2937',
  },
  tableInput: {
    width: '100%',
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    outline: 'none',
  },
  removeButton: {
    padding: '8px',
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  totalesContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
  },
  descuentosBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  totalesBox: {
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  totalLabel: {
    fontSize: '15px',
    color: '#6b7280',
  },
  totalValue: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1f2937',
  },
  totalRowFinal: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '15px 0 0 0',
    marginTop: '10px',
    borderTop: '2px solid #1f2937',
  },
  totalLabelFinal: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalValueFinal: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#10b981',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
    paddingTop: '20px',
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

export default CompraForm;