import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { productosApi } from '../api/productos';
import { configuracionApi } from '../api/configuracion';
import Layout from '../components/Layout';
import { proveedoresApi } from '../api/proveedores';
import { ArrowLeft, Save, X, Plus, Trash2, Upload, Link as LinkIcon, Calculator } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 

const ProductoForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();
  const { user, sucursalActiva } = useAuth();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [categorias, setCategorias] = useState([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    categoria_id: '',
    marca: '',
    unidad_medida: 'unidad',
    stock_minimo: '0',
    stock_actual: '0',
    ubicacion: '',
    proveedor_id: '',
    imagen_url: '',
    observaciones: '',
  });

  const [proveedores, setProveedores] = useState([]);

  const [precios, setPrecios] = useState([
    { lista_precio_id: 1, moneda_id: 1, precio: '' }, // Minorista ARS
    { lista_precio_id: 1, moneda_id: 2, precio: '' }, // Minorista USD
    { lista_precio_id: 2, moneda_id: 1, precio: '' }, // Mayorista ARS
    { lista_precio_id: 2, moneda_id: 2, precio: '' }, // Mayorista USD
    { lista_precio_id: 3, moneda_id: 1, precio: '' }, // Obra ARS
    { lista_precio_id: 3, moneda_id: 2, precio: '' }, // Obra USD
  ]);

  const [imagenMode, setImagenMode] = useState('url'); // 'url' o 'file'
  const [imagenFile, setImagenFile] = useState(null);
  const [imagenPreview, setImagenPreview] = useState('');
  const [uploadingImagen, setUploadingImagen] = useState(false);

  const [cotizacion, setCotizacion] = useState(null);
  const [loadingCotizacion, setLoadingCotizacion] = useState(true);
  const [preciosSugeridos, setPreciosSugeridos] = useState({}); // Para almacenar sugerencias

  const debeDeshabilitarStock = user?.rol === 'admin' && !sucursalActiva;

  useEffect(() => {
    loadCategorias();
    loadProveedores();
    if (isEdit) {
      loadProducto();
    }
  }, [id]);

  useEffect(() => {
    loadCotizacion();
  }, []);

  const loadCotizacion = async () => {
    try {
      setLoadingCotizacion(true);
      const data = await configuracionApi.getCotizacionActual();
      if (data.configuracion && data.configuracion.valor) {
        setCotizacion(parseFloat(data.configuracion.valor));
      }
    } catch (error) {
      console.error('Error al cargar cotización:', error);
    } finally {
      setLoadingCotizacion(false);
    }
  };

  const calcularPrecioSugerido = (precio, monedaOrigenId, monedaDestinoId) => {
    if (!precio || !cotizacion || cotizacion <= 0) return null;
    
    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum <= 0) return null;

    // Moneda 1 = ARS, Moneda 2 = USD
    if (monedaOrigenId === 1 && monedaDestinoId === 2) {
      // ARS a USD: dividir por cotización
      return (precioNum / cotizacion).toFixed(2);
    } else if (monedaOrigenId === 2 && monedaDestinoId === 1) {
      // USD a ARS: multiplicar por cotización
      return (precioNum * cotizacion).toFixed(2);
    }
    
    return null;
  };

  const aplicarPrecioSugerido = (listaId, monedaId) => {
    const key = `${listaId}-${monedaId}`;
    const sugerido = preciosSugeridos[key];
    
    if (sugerido) {
      const index = precios.findIndex(
        p => p.lista_precio_id === listaId && p.moneda_id === monedaId
      );
      
      if (index !== -1) {
        handlePrecioChange(index, sugerido);
        
        // Limpiar la sugerencia después de aplicarla
        setPreciosSugeridos(prev => {
          const newSugeridos = { ...prev };
          delete newSugeridos[key];
          return newSugeridos;
        });
      }
    }
  };

  const loadCategorias = async () => {
    try {
      const data = await productosApi.getCategorias();
      setCategorias(data.categoriasPlanas || []);
    } catch (error) {
      showError(error.message);
    }
  };

  const loadProveedores = async () => {
    try {
      const data = await proveedoresApi.getAll({ activo: 'true' });
      setProveedores(data.proveedores || []);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
    }
  };

  const loadProducto = async () => {
    try {
      setLoadingData(true);
      const data = await productosApi.getById(id);
      const producto = data.producto;

      setFormData({
        codigo: producto.codigo || '',
        descripcion: producto.descripcion || '',
        categoria_id: producto.categoria_id?.toString() || '',
        marca: producto.marca || '',
        unidad_medida: producto.unidad_medida || 'unidad',
        stock_minimo: producto.stock_minimo?.toString() || '0',
        stock_actual: producto.stock_actual?.toString() || '0',
        ubicacion: producto.ubicacion || '',
        proveedor_id: producto.proveedor_id?.toString() || '',
        imagen_url: producto.imagen_url || '',
        observaciones: producto.observaciones || '',
      });

      // Cargar precios existentes
      if (producto.precios && producto.precios.length > 0) {
        const preciosMap = {};
        producto.precios.forEach(p => {
          const key = `${p.lista_precio_id}-${p.moneda_id}`;
          preciosMap[key] = p.precio;
        });

        setPrecios(precios.map(p => ({
          ...p,
          precio: preciosMap[`${p.lista_precio_id}-${p.moneda_id}`] || ''
        })));
      }
    } catch (error) {
      showError(error.message);
      navigate('/productos');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePrecioChange = (index, value) => {
    const newPrecios = [...precios];
    newPrecios[index].precio = value;
    setPrecios(newPrecios);

    // Calcular sugerencias para la otra moneda en la misma lista
    const precioActual = newPrecios[index];
    const listaId = precioActual.lista_precio_id;
    const monedaActualId = precioActual.moneda_id;
    const otraMonedaId = monedaActualId === 1 ? 2 : 1;

    // Buscar el índice del precio en la otra moneda para la misma lista
    const otraMonedaIndex = precios.findIndex(
      p => p.lista_precio_id === listaId && p.moneda_id === otraMonedaId
    );

    // SOLO sugerir si el campo de la otra moneda está VACÍO
    if (otraMonedaIndex !== -1 && value && !newPrecios[otraMonedaIndex].precio) {
      const sugerido = calcularPrecioSugerido(value, monedaActualId, otraMonedaId);
      
      if (sugerido) {
        // Guardar la sugerencia
        setPreciosSugeridos(prev => ({
          ...prev,
          [`${listaId}-${otraMonedaId}`]: sugerido
        }));
      }
    } else {
      // Limpiar sugerencia si:
      // - Se borra el precio origen
      // - Ya hay un precio en destino
      setPreciosSugeridos(prev => {
        const newSugeridos = { ...prev };
        delete newSugeridos[`${listaId}-${otraMonedaId}`];
        return newSugeridos;
      });
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showError('El nombre de la categoría es obligatorio');
      return;
    }

    try {
      const result = await productosApi.createCategoria({
        nombre: newCategoryName,
        descripcion: '',
        parent_id: null
      });
      
      showSuccess('Categoría creada exitosamente');
      setNewCategoryName('');
      setShowNewCategory(false);
      await loadCategorias();
      
      // Seleccionar la nueva categoría
      setFormData(prev => ({
        ...prev,
        categoria_id: result.categoriaId?.toString() || ''
      }));
    } catch (error) {
      showError(error.message);
    }
  };

  const handleImagenFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        showError('Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)');
        return;
      }

      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('La imagen es demasiado grande. Tamaño máximo: 5MB');
        return;
      }

      setImagenFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImagenPreview = () => {
    setImagenFile(null);
    setImagenPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.codigo.trim() || !formData.descripcion.trim()) {
      showError('Código y descripción son obligatorios');
      return;
    }

    setLoading(true);

    try {
      let imagenUrl = formData.imagen_url;

      // Si se seleccionó un archivo, subirlo primero
      if (imagenMode === 'file' && imagenFile) {
        setUploadingImagen(true);
        try {
          const uploadResult = await productosApi.uploadImagen(imagenFile);
          imagenUrl = uploadResult.imageUrl;
        } catch (error) {
          showError('Error al subir la imagen: ' + error.message);
          setLoading(false);
          setUploadingImagen(false);
          return;
        }
        setUploadingImagen(false);
      }

      const dataToSend = {
        ...formData,
        imagen_url: imagenUrl,
        categoria_id: formData.categoria_id ? parseInt(formData.categoria_id) : null,
        stock_minimo: parseFloat(formData.stock_minimo) || 0,
        stock_actual: parseFloat(formData.stock_actual) || 0,
        proveedor_id: formData.proveedor_id ? parseInt(formData.proveedor_id) : null,
        precios: precios
          .filter(p => p.precio && parseFloat(p.precio) > 0)
          .map(p => ({
            lista_precio_id: p.lista_precio_id,
            moneda_id: p.moneda_id,
            precio: parseFloat(p.precio)
          }))
      };

      if (isEdit) {
        await productosApi.update(id, dataToSend);
        showSuccess('Producto actualizado exitosamente');
      } else {
        await productosApi.create(dataToSend);
        showSuccess('Producto creado exitosamente');
      }

      navigate('/productos');
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getListaNombre = (listaId) => {
    const nombres = {
      1: t('retail'),
      2: t('wholesale'),
      3: t('construction')
    };
    return nombres[listaId] || `Lista ${listaId}`;
  };

  const getMonedaNombre = (monedaId) => {
    return monedaId === 1 ? 'ARS' : 'USD';
  };

  if (loadingData) {
    return (
      <Layout>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>{t('loading')}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            {isEdit ? t('editProduct') : t('newProduct')}
          </h1>
          <p style={styles.subtitle}>
            {isEdit ? 'Modifica la información del producto' : 'Completa los datos del nuevo producto'}
          </p>
        </div>
        <button
          onClick={() => navigate('/productos')}
          style={styles.backButton}
        >
          <ArrowLeft size={18} style={{ marginRight: '6px' }} />
          {t('back')}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Información Básica */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Información Básica</h2>

          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Código <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                style={styles.input}
                required
                placeholder="Ej: PROD-001"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Unidad de Medida <span style={styles.required}>*</span>
              </label>
              <select
                name="unidad_medida"
                value={formData.unidad_medida}
                onChange={handleChange}
                style={styles.select}
                required
              >
                <option value="unidad">Unidad</option>
                <option value="metro">Metro</option>
                <option value="kilogramo">Kilogramo</option>
                <option value="litro">Litro</option>
                <option value="caja">Caja</option>
                <option value="pallet">Pallet</option>
                <option value="metro2">Metro²</option>
                <option value="metro3">Metro³</option>
              </select>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Descripción <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              style={styles.input}
              required
              placeholder="Nombre descriptivo del producto"
            />
          </div>

          <div style={styles.grid3}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Marca</label>
              <input
                type="text"
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                style={styles.input}
                placeholder="Marca del producto"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Categoría</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select
                  name="categoria_id"
                  value={formData.categoria_id}
                  onChange={handleChange}
                  style={{ ...styles.select, flex: 1 }}
                >
                  <option value="">Sin categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(!showNewCategory)}
                  style={styles.iconButton}
                  title="Nueva categoría"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Proveedor</label>
              <select
                name="proveedor_id"
                value={formData.proveedor_id}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="">Sin proveedor</option>
                {proveedores.map(prov => (
                  <option key={prov.id} value={prov.id}>
                    {prov.razon_social}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {showNewCategory && (
            <div style={styles.newCategoryBox}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ ...styles.inputGroup, flex: 1, marginBottom: 0 }}>
                  <label style={styles.label}>Nueva Categoría</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    style={styles.input}
                    placeholder="Nombre de la categoría"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  style={styles.createButton}
                >
                  <Plus size={16} style={{ marginRight: '6px' }} />
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCategory(false);
                    setNewCategoryName('');
                  }}
                  style={styles.cancelIconButton}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stock */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Control de Stock</h2>

          {debeDeshabilitarStock && !isEdit && (
            <div style={styles.warningBox}>
              <span>ℹ️</span>
              <div>
                <strong>Stock deshabilitado</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                  Para asignar stock inicial, selecciona una sucursal específica en el menú superior. 
                  También puedes crear el producto sin stock y realizar ajustes después.
                </p>
              </div>
            </div>
          )}

          <div style={styles.grid3}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Stock Actual</label>
              <input
                type="number"
                name="stock_actual"
                value={debeDeshabilitarStock && !isEdit ? '0' : formData.stock_actual}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(debeDeshabilitarStock && !isEdit ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {})
                }}
                min="0"
                step="0.01"
                placeholder="0"
                disabled={debeDeshabilitarStock && !isEdit}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Stock Mínimo</label>
              <input
                type="number"
                name="stock_minimo"
                value={formData.stock_minimo}
                onChange={handleChange}
                style={styles.input}
                min="0"
                step="0.01"
                placeholder="0"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Ubicación</label>
              <input
                type="text"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleChange}
                style={styles.input}
                placeholder="Ej: Estante A-3"
              />
            </div>
          </div>
        </div>

        {/* Precios */}
        <div style={styles.section}>
          <div style={styles.preciosHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Listas de Precios</h2>
              <p style={styles.sectionDescription}>
                Define los precios para cada lista y moneda
              </p>
            </div>
            {cotizacion && (
              <div style={styles.cotizacionBadge}>
                <Calculator size={16} />
                <span>Cotización: ${cotizacion.toLocaleString('es-AR')} ARS = 1 USD</span>
              </div>
            )}
          </div>

          <div style={styles.preciosGrid}>
            {precios.map((precio, index) => {
              const key = `${precio.lista_precio_id}-${precio.moneda_id}`;
              const tieneSugerencia = preciosSugeridos[key];

              return (
                <div key={index} style={styles.precioCard}>
                  <div style={styles.precioHeader}>
                    <span style={styles.precioLabel}>
                      {getListaNombre(precio.lista_precio_id)}
                    </span>
                    <span style={styles.precioMoneda}>
                      {getMonedaNombre(precio.moneda_id)}
                    </span>
                  </div>
                  
                  <div style={styles.precioInputContainer}>
                    <input
                      type="number"
                      value={precio.precio}
                      onChange={(e) => handlePrecioChange(index, e.target.value)}
                      style={styles.precioInput}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    
                    {tieneSugerencia && (
                      <button
                        type="button"
                        onClick={() => aplicarPrecioSugerido(precio.lista_precio_id, precio.moneda_id)}
                        style={styles.sugerenciaButton}
                        title={`Aplicar precio sugerido: ${tieneSugerencia}`}
                      >
                        <Calculator size={14} />
                        <span>{tieneSugerencia}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!cotizacion && !loadingCotizacion && (
            <div style={styles.warningBox}>
              <span>⚠️</span>
              <span>
                No hay cotización configurada. Ve a <strong>Configuración</strong> para establecer la cotización USD/ARS y habilitar sugerencias automáticas.
              </span>
            </div>
          )}
        </div>

        {/* Imagen y Observaciones */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Información Adicional</h2>

          {/* Selector de modo de imagen */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Imagen del Producto</label>
            <div style={styles.imagenModeSelector}>
              <button
                type="button"
                onClick={() => setImagenMode('url')}
                style={{
                  ...styles.modeButton,
                  ...(imagenMode === 'url' ? styles.modeButtonActive : {})
                }}
              >
                <LinkIcon size={16} style={{ marginRight: '6px' }} />
                URL
              </button>
              <button
                type="button"
                onClick={() => setImagenMode('file')}
                style={{
                  ...styles.modeButton,
                  ...(imagenMode === 'file' ? styles.modeButtonActive : {})
                }}
              >
                <Upload size={16} style={{ marginRight: '6px' }} />
                Subir Archivo
              </button>
            </div>
          </div>

          {/* Input de URL */}
          {imagenMode === 'url' && (
            <div style={styles.inputGroup}>
              <input
                type="url"
                name="imagen_url"
                value={formData.imagen_url}
                onChange={handleChange}
                style={styles.input}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
              {formData.imagen_url && (
                <div style={styles.imagePreviewContainer}>
                  <img 
                    src={formData.imagen_url} 
                    alt="Preview"
                    style={styles.imagePreview}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'block';
                    }}
                  />
                  <p style={{ display: 'none', color: '#dc2626', textAlign: 'center' }}>
                    Error al cargar la imagen
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Input de archivo */}
          {imagenMode === 'file' && (
            <div style={styles.inputGroup}>
              <div style={styles.fileUploadContainer}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagenFileChange}
                  style={styles.fileInput}
                  id="imagen-file"
                />
                <label htmlFor="imagen-file" style={styles.fileLabel}>
                  <Upload size={20} />
                  <span>
                    {imagenFile ? imagenFile.name : 'Seleccionar imagen'}
                  </span>
                  <span style={styles.fileHint}>
                    JPG, PNG, GIF, WEBP (máx. 5MB)
                  </span>
                </label>
              </div>

              {imagenPreview && (
                <div style={styles.imagePreviewContainer}>
                  <img 
                    src={imagenPreview} 
                    alt="Preview"
                    style={styles.imagePreview}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImagenPreview}
                    style={styles.removePreviewButton}
                  >
                    <Trash2 size={16} style={{ marginRight: '6px' }} />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              style={styles.textarea}
              rows="4"
              placeholder="Notas adicionales sobre el producto..."
            />
          </div>
        </div>

        {/* Botones */}
        <div style={styles.actions}>
          <button
            type="button"
            onClick={() => navigate('/productos')}
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
            {loading ? t('loading') : t('save')}
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
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 20px 0',
    paddingBottom: '12px',
    borderBottom: '2px solid #f3f4f6',
  },
  sectionDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
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
    padding: '12px 14px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: 'white',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  iconButton: {
    padding: '12px',
    fontSize: '16px',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newCategoryBox: {
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
  },
  createButton: {
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  cancelIconButton: {
    padding: '12px',
    fontSize: '16px',
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preciosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
  },
  precioCard: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
  },
  precioHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  precioLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },
  precioMoneda: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    padding: '4px 8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
  },
  precioInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '16px',
    fontWeight: '600',
    border: '2px solid #e5e7eb',
    borderRadius: '6px',
    outline: 'none',
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
  imagenModeSelector: {
    display: 'flex',
    gap: '10px',
    marginTop: '8px',
  },
  modeButton: {
    flex: 1,
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  modeButtonActive: {
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  fileUploadContainer: {
    marginTop: '8px',
  },
  fileInput: {
    display: 'none',
  },
  fileLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '40px 20px',
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: '#f9fafb',
    color: '#6b7280',
  },
  fileHint: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  imagePreviewContainer: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  imagePreview: {
    maxWidth: '100%',
    maxHeight: '300px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  removePreviewButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  preciosHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  cotizacionBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    border: '2px solid #bfdbfe',
  },
  precioInputContainer: {
    position: 'relative',
  },
  sugerenciaButton: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#d1fae5',
    border: '2px solid #10b981',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
  warningBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#eff6ff',
    border: '2px solid #3b82f6',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#1e40af',
    marginBottom: '20px',
  },
};

export default ProductoForm;