import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import { ventasApi } from '../api/ventas';
import { clientesApi } from '../api/clientes';
import { productosApi } from '../api/productos';
import { presupuestosApi } from '../api/presupuestos';
import Layout from '../components/Layout';
import { ArrowLeft, Save, X, Plus, Trash2, Search, AlertCircle, Package } from 'lucide-react';

const VentaForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();

  const presupuestoId = location.state?.presupuestoId;

  const [loading, setLoading] = useState(false);
  const [loadingPresupuesto, setLoadingPresupuesto] = useState(!!presupuestoId);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [monedas] = useState([
    { id: 1, codigo: 'ARS', simbolo: '$' },
    { id: 2, codigo: 'USD', simbolo: 'US$' }
  ]);

  const [formData, setFormData] = useState({
    cliente_id: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo_comprobante: 'ticket',
    moneda_id: '1',
    forma_pago: 'efectivo',
    descuento_porcentaje: '0',
    descuento_monto: '0',
    observaciones: '',
  });

  const [detalle, setDetalle] = useState([]);
  const [usarPagosMultiples, setUsarPagosMultiples] = useState(false);
  const [pagos, setPagos] = useState([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    loadClientes();
    loadProductos();
    
    if (presupuestoId) {
      loadPresupuesto();
    }
  }, [presupuestoId]);

  const loadClientes = async () => {
    try {
      const data = await clientesApi.getAll({ activo: 'true' });
      setClientes(data.clientes || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
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

  const loadPresupuesto = async () => {
    try {
      setLoadingPresupuesto(true);
      const data = await presupuestosApi.getById(presupuestoId);
      const presupuesto = data.presupuesto;

      setFormData({
        cliente_id: presupuesto.cliente_id?.toString() || '',
        fecha: new Date().toISOString().split('T')[0],
        tipo_comprobante: 'factura_b',
        moneda_id: presupuesto.moneda_id?.toString() || '1',
        forma_pago: 'efectivo',
        descuento_porcentaje: presupuesto.descuento_porcentaje?.toString() || '0',
        descuento_monto: presupuesto.descuento_monto?.toString() || '0',
        observaciones: presupuesto.observaciones || '',
      });

      // Cargar detalle
      const detalleFormateado = presupuesto.detalle.map(item => ({
        producto_id: item.producto_id,
        descripcion: item.descripcion || item.producto_descripcion,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        descuento_porcentaje: item.descuento_porcentaje || 0,
        producto_codigo: item.producto_codigo,
        producto_unidad: item.producto_unidad,
        stock_disponible: null, // Se cargará después
      }));

      // Cargar stock de cada producto
      for (let i = 0; i < detalleFormateado.length; i++) {
        try {
          const prod = await productosApi.getById(detalleFormateado[i].producto_id);
          detalleFormateado[i].stock_disponible = prod.producto.stock_actual;
        } catch (error) {
          console.error('Error al cargar stock:', error);
        }
      }

      setDetalle(detalleFormateado);

      // Cargar cliente seleccionado
      const cliente = clientes.find(c => c.id === presupuesto.cliente_id);
      if (cliente) {
        setSelectedCliente(cliente);
      }
    } catch (error) {
      showError(error.message);
      navigate('/ventas');
    } finally {
      setLoadingPresupuesto(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Si cambia el cliente, actualizar precios
    if (name === 'cliente_id') {
      const cliente = clientes.find(c => c.id === parseInt(value));
      setSelectedCliente(cliente);
      
      // Actualizar precios de productos ya agregados
      if (cliente && detalle.length > 0) {
        updatePreciosDetalle(cliente.lista_precio_id || 1);
      }
    }
  };

  const updatePreciosDetalle = async (listaId) => {
    const detalleActualizado = await Promise.all(
      detalle.map(async (item) => {
        try {
          const producto = await productosApi.getById(item.producto_id);
          const precio = producto.producto.precios.find(
            p => p.lista_precio_id === listaId && p.moneda_id === parseInt(formData.moneda_id)
          );
          return {
            ...item,
            precio_unitario: precio ? precio.precio : item.precio_unitario
          };
        } catch (error) {
          return item;
        }
      })
    );
    setDetalle(detalleActualizado);
  };

  const handleAddProduct = async (producto) => {
    if (!formData.cliente_id) {
      showError('Selecciona un cliente primero');
      return;
    }

    // Verificar si el producto ya está en el detalle
    const exists = detalle.find(d => d.producto_id === producto.id);
    if (exists) {
      showError('El producto ya está agregado');
      return;
    }

    // Verificar stock
    if (producto.stock_actual <= 0) {
      showError(`Sin stock disponible para ${producto.codigo} - ${producto.descripcion}`);
      return;
    }

    try {
      // Obtener precio del producto según la lista del cliente
      const productoCompleto = await productosApi.getById(producto.id);
      const listaId = selectedCliente?.lista_precio_id || 1;
      const monedaId = parseInt(formData.moneda_id);

      const precio = productoCompleto.producto.precios.find(
        p => p.lista_precio_id === listaId && p.moneda_id === monedaId
      );

      if (!precio) {
        showError(`No hay precio configurado para este producto en ${monedaId === 1 ? 'ARS' : 'USD'}`);
        return;
      }

      const nuevoItem = {
        producto_id: producto.id,
        descripcion: producto.descripcion,
        cantidad: 1,
        precio_unitario: precio.precio,
        descuento_porcentaje: 0,
        producto_codigo: producto.codigo,
        producto_unidad: producto.unidad_medida,
        stock_disponible: producto.stock_actual,
      };

      setDetalle([...detalle, nuevoItem]);
      setShowProductSearch(false);
      setProductSearch('');
    } catch (error) {
      showError('Error al obtener precio del producto');
    }
  };

  const handleRemoveProduct = (index) => {
    setDetalle(detalle.filter((_, i) => i !== index));
  };

  const handleDetalleChange = (index, field, value) => {
    const newDetalle = [...detalle];
    
    // Validar que la cantidad no supere el stock
    if (field === 'cantidad') {
      const item = newDetalle[index];
      if (parseFloat(value) > item.stock_disponible) {
        showError(`Stock insuficiente. Disponible: ${item.stock_disponible}`);
        return;
      }
    }
    
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

    if (!formData.cliente_id) {
      showError('Debe seleccionar un cliente');
      return;
    }

    if (detalle.length === 0) {
      showError('Debe agregar al menos un producto');
      return;
    }

    // Validar límite de crédito si es cuenta corriente
    if (!usarPagosMultiples && formData.forma_pago === 'cuenta_corriente' && selectedCliente) {
      const creditoDisponible = selectedCliente.limite_credito - selectedCliente.saldo_cuenta_corriente;
      
      if (totales.total > creditoDisponible) {
        showError(
          `El total ($${formatCurrency(totales.total)}) supera el crédito disponible del cliente ($${formatCurrency(creditoDisponible)}). ` +
          `Use "Múltiples formas de pago" para pagar parte en cuenta corriente y parte con otro medio.`
        );
        return;
      }
      
      // Advertencia si supera el límite de crédito pero aún no está en deuda
      if (selectedCliente.limite_credito > 0 && totales.total > selectedCliente.limite_credito) {
        const confirmed = window.confirm(
          `Esta venta superará el límite de crédito del cliente.\n` +
          `Límite: $${formatCurrency(selectedCliente.limite_credito)}\n` +
          `Total venta: $${formatCurrency(totales.total)}\n\n` +
          `¿Desea continuar?`
        );
        
        if (!confirmed) return;
      }
    }

    // Validar stock de todos los productos
    for (const item of detalle) {
      if (item.cantidad > item.stock_disponible) {
        showError(`Stock insuficiente para ${item.producto_codigo}. Disponible: ${item.stock_disponible}`);
        return;
      }
    }

    // Validar pagos múltiples
    if (usarPagosMultiples) {
      const sumaPagos = pagos.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
      if (Math.abs(sumaPagos - totales.total) > 0.01) {
        showError(`La suma de los pagos ($${sumaPagos.toFixed(2)}) no coincide con el total ($${totales.total.toFixed(2)})`);
        return;
      }

      if (pagos.some(p => !p.monto || parseFloat(p.monto) <= 0)) {
        showError('Todos los pagos deben tener un monto mayor a 0');
        return;
      }
    }

    setLoading(true);

    try {
      const dataToSend = {
        cliente_id: parseInt(formData.cliente_id),
        fecha: formData.fecha,
        tipo_comprobante: formData.tipo_comprobante,
        moneda_id: parseInt(formData.moneda_id),
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
        presupuesto_id: presupuestoId || null,
        usuario_id: user.id,
      };

      // Agregar pagos
      if (usarPagosMultiples) {
        dataToSend.pagos = pagos.map(p => ({
          forma_pago: p.forma_pago,
          monto: parseFloat(p.monto),
        }));
        dataToSend.forma_pago = null;
      } else {
        dataToSend.forma_pago = formData.forma_pago;
        dataToSend.pagos = null;
      }

      const result = await ventasApi.create(dataToSend);
      showSuccess(`Venta ${result.numero_comprobante} creada exitosamente`);
      navigate('/ventas');
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = productos.filter(p =>
    (p.codigo.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.descripcion.toLowerCase().includes(productSearch.toLowerCase())) &&
    p.stock_actual > 0
  );

  const totales = calcularTotales();
  const monedaActual = monedas.find(m => m.id === parseInt(formData.moneda_id));

  if (loadingPresupuesto) {
    return (
      <Layout>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Cargando presupuesto...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            {presupuestoId ? 'Nueva Venta desde Presupuesto' : t('newSale')}
          </h1>
          <p style={styles.subtitle}>
            {presupuestoId ? 'Completar los datos para finalizar la venta' : 'Completa los datos de la nueva venta'}
          </p>
        </div>
        <button
          onClick={() => navigate('/ventas')}
          style={styles.backButton}
        >
          <ArrowLeft size={18} style={{ marginRight: '6px' }} />
          {t('back')}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Datos de la Venta */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Datos de la Venta</h2>

          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Cliente <span style={styles.required}>*</span>
              </label>
              <select
                name="cliente_id"
                value={formData.cliente_id}
                onChange={handleChange}
                style={styles.select}
                required
                disabled={!!presupuestoId}
              >
                <option value="">Seleccionar cliente</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.razon_social} - {cliente.tipo_cliente}
                  </option>
                ))}
              </select>
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
                <option value="ticket">Ticket</option>
                <option value="factura_a">Factura A</option>
                <option value="factura_b">Factura B</option>
                <option value="factura_c">Factura C</option>
                <option value="remito">Remito</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Forma de Pago <span style={styles.required}>*</span>
              </label>
              
              {!usarPagosMultiples ? (
                <>
                  <select
                    name="forma_pago"
                    value={formData.forma_pago}
                    onChange={handleChange}
                    style={styles.select}
                    required={!usarPagosMultiples}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="cheque">Cheque</option>
                    <option value="cuenta_corriente">Cuenta Corriente</option>
                  </select>


                  {!usarPagosMultiples && formData.forma_pago === 'cuenta_corriente' && selectedCliente && detalle.length > 0 && (
                    (() => {
                      const creditoDisponible = selectedCliente.limite_credito - selectedCliente.saldo_cuenta_corriente;
                      const excedeLimite = totales.total > creditoDisponible;
                      
                      return (
                        <div style={{
                          marginTop: '12px',
                          padding: '12px',
                          borderRadius: '8px',
                          backgroundColor: excedeLimite ? '#fee2e2' : '#d1fae5',
                          border: `2px solid ${excedeLimite ? '#dc2626' : '#10b981'}`,
                          fontSize: '14px',
                        }}>
                          <div style={{ 
                            fontWeight: '600', 
                            color: excedeLimite ? '#991b1b' : '#065f46',
                            marginBottom: '4px' 
                          }}>
                            {excedeLimite ? '⚠️ Crédito insuficiente' : '✓ Crédito suficiente'}
                          </div>
                          <div style={{ color: excedeLimite ? '#7f1d1d' : '#047857' }}>
                            Crédito disponible: ${formatCurrency(creditoDisponible)}<br/>
                            Total de la venta: ${formatCurrency(totales.total)}

                            {excedeLimite && (
                              <>
                                <br/>
                                <span style={{ fontWeight: '600' }}>
                                  Faltante: ${formatCurrency(totales.total - creditoDisponible)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  )}


                  <button
                    type="button"
                    onClick={() => {
                      setUsarPagosMultiples(true);
                      setPagos([{ forma_pago: 'efectivo', monto: '' }]);
                    }}
                    style={styles.switchButton}
                  >
                    Usar múltiples formas de pago
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setUsarPagosMultiples(false);
                    setPagos([]);
                  }}
                  style={styles.switchButton}
                >
                  Usar una sola forma de pago
                </button>
              )}
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

        {/* Pagos Múltiples */}
        {usarPagosMultiples && detalle.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Formas de Pago</h2>
            
            {pagos.map((pago, index) => {
              const creditoDisponible = selectedCliente 
                ? selectedCliente.limite_credito - selectedCliente.saldo_cuenta_corriente
                : 0;

              return (
                <div key={index} style={styles.pagoRow}>
                  <div style={styles.pagoInputs}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Forma de Pago</label>
                      <select
                        value={pago.forma_pago}
                        onChange={(e) => {
                          const newPagos = [...pagos];
                          newPagos[index].forma_pago = e.target.value;
                          
                          // Si cambia a cuenta corriente, sugerir el crédito disponible
                          if (e.target.value === 'cuenta_corriente' && creditoDisponible > 0) {
                            const montoPendiente = totales.total - pagos.reduce((sum, p, i) => 
                              i !== index ? sum + (parseFloat(p.monto) || 0) : sum, 0
                            );
                            newPagos[index].monto = Math.min(creditoDisponible, montoPendiente).toFixed(2);
                          }
                          
                          setPagos(newPagos);
                        }}
                        style={styles.select}
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="cheque">Cheque</option>
                        <option value="cuenta_corriente">
                          Cuenta Corriente {creditoDisponible > 0 && `(Disp: $${creditoDisponible.toFixed(2)})`}
                        </option>
                      </select>
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Monto</label>
                      <input
                        type="number"
                        value={pago.monto}
                        onChange={(e) => {
                          const newPagos = [...pagos];
                          const nuevoMonto = parseFloat(e.target.value) || 0;
                          
                          // Validar límite de crédito si es cuenta corriente
                          if (pago.forma_pago === 'cuenta_corriente' && nuevoMonto > creditoDisponible) {
                            alert(`El monto supera el crédito disponible ($${creditoDisponible.toFixed(2)})`);
                            return;
                          }
                          
                          newPagos[index].monto = e.target.value;
                          setPagos(newPagos);
                        }}
                        style={styles.input}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPagos(pagos.filter((_, i) => i !== index))}
                    style={styles.removePagoButton}
                    disabled={pagos.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => setPagos([...pagos, { forma_pago: 'efectivo', monto: '' }])}
              style={styles.addPagoButton}
            >
              <Plus size={16} style={{ marginRight: '6px' }} />
              Agregar Forma de Pago
            </button>

            {/* Resumen de pagos */}
            <div style={styles.resumenPagos}>
              <div style={styles.resumenRow}>
                <span>Total a pagar:</span>
                <span style={{ fontWeight: 'bold' }}>
                  {formatCurrency(totales.total, monedaActual?.simbolo)}
                </span>
              </div>
              <div style={styles.resumenRow}>
                <span>Total pagos:</span>
                <span style={{ 
                  fontWeight: 'bold',
                  color: Math.abs(pagos.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0) - totales.total) < 0.01 
                    ? '#10b981' 
                    : '#dc2626'
                }}>
                  {formatCurrency(pagos.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0), monedaActual?.simbolo)}
                </span>
              </div>
              <div style={styles.resumenRow}>
                <span>Diferencia:</span>
                <span style={{ fontWeight: 'bold', color: '#dc2626' }}>
                  {formatCurrency(totales.total - pagos.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0), monedaActual?.simbolo)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Productos */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Productos</h2>
            <button
              type="button"
              onClick={() => setShowProductSearch(!showProductSearch)}
              style={styles.addProductButton}
              disabled={!formData.cliente_id}
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
                      <span style={{
                        ...styles.productStock,
                        color: producto.stock_actual <= producto.stock_minimo ? '#dc2626' : '#059669'
                      }}>
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
                Selecciona un cliente y haz clic en "Agregar Producto"
              </p>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Código</th>
                    <th style={styles.th}>Producto</th>
                    <th style={styles.th}>Stock</th>
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
                        <span style={{
                          fontWeight: '600',
                          color: item.stock_disponible <= 10 ? '#dc2626' : '#059669'
                        }}>
                          {item.stock_disponible}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => handleDetalleChange(index, 'cantidad', e.target.value)}
                          style={styles.tableInput}
                          min="0.01"
                          max={item.stock_disponible}
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
            placeholder="Notas adicionales..."
          />
        </div>

        {/* Alerta de Stock */}
        {detalle.some(item => item.cantidad > item.stock_disponible) && (
          <div style={styles.alertBox}>
            <AlertCircle size={20} />
            <span>Hay productos con stock insuficiente. Verifica las cantidades.</span>
          </div>
        )}

        {/* Botones */}
        <div style={styles.actions}>
          <button
            type="button"
            onClick={() => navigate('/ventas')}
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
            {loading ? 'Procesando...' : 'Completar Venta'}
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
  alertBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    backgroundColor: '#fef3c7',
    border: '2px solid #f59e0b',
    borderRadius: '8px',
    color: '#92400e',
    fontSize: '14px',
    fontWeight: '600',
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
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  switchButton: {
    marginTop: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  pagoRow: {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px',
    padding: '15px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    alignItems: 'flex-end',
  },
  pagoInputs: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  },
  removePagoButton: {
    padding: '10px',
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  addPagoButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#10b981',
    backgroundColor: '#d1fae5',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
  },
  resumenPagos: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
  },
  resumenRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '15px',
  },
};

export default VentaForm;