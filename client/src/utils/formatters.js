/**
 * Formatea un número como moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Símbolo de moneda (opcional)
 * @returns {string} - Número formateado
 */
export const formatCurrency = (amount, currency = '') => {
  const formatted = parseFloat(amount).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return currency ? `${currency} ${formatted}` : formatted;
};

/**
 * Formatea un número con decimales
 * @param {number} number - Número a formatear
 * @param {number} decimals - Cantidad de decimales (default: 2)
 * @returns {string} - Número formateado
 */
export const formatNumber = (number, decimals = 2) => {
  return parseFloat(number).toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};