import { getOne } from '../db/database.js';

/**
 * Obtiene la cotización USD/ARS vigente
 * @returns {Promise<number>} Cotización actual o 1 si no existe
 */
export const getCotizacionActual = async () => {
  try {
    const config = await getOne(
      "SELECT valor FROM configuracion WHERE clave = 'cotizacion_usd_ars'"
    );

    if (!config || !config.valor) {
      console.warn('⚠️ No se encontró cotización configurada, usando 1');
      return 1;
    }

    return parseFloat(config.valor);
  } catch (error) {
    console.error('Error al obtener cotización:', error);
    return 1;
  }
};

/**
 * Convierte un monto de una moneda a otra usando la cotización proporcionada
 * @param {number} monto - Monto a convertir
 * @param {string} monedaOrigen - Código de moneda origen (ARS/USD)
 * @param {string} monedaDestino - Código de moneda destino (ARS/USD)
 * @param {number} cotizacion - Cotización USD/ARS
 * @returns {number} Monto convertido
 */
export const convertirMoneda = (monto, monedaOrigen, monedaDestino, cotizacion) => {
  if (monedaOrigen === monedaDestino) {
    return monto;
  }

  if (monedaOrigen === 'USD' && monedaDestino === 'ARS') {
    // USD a ARS: multiplicar por cotización
    return monto * cotizacion;
  }

  if (monedaOrigen === 'ARS' && monedaDestino === 'USD') {
    // ARS a USD: dividir por cotización
    return monto / cotizacion;
  }

  return monto;
};

/**
 * Formatea un monto con el símbolo de la moneda
 * @param {number} monto 
 * @param {string} moneda - Código de moneda (ARS/USD)
 * @returns {string} Monto formateado
 */
export const formatearMoneda = (monto, moneda) => {
  const montoNum = parseFloat(monto);
  
  if (moneda === 'USD') {
    return `USD ${montoNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  return `$ ${montoNum.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};