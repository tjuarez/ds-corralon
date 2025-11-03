/**
 * Formatea un número como moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Símbolo de moneda (opcional)
 * @returns {string} - Número formateado
 */
export const formatCurrency = (value, symbol = '$') => {
  // Validar que value sea un número válido
  const numValue = parseFloat(value);
  
  if (isNaN(numValue) || numValue === null || numValue === undefined) {
    return `${symbol}0.00`;
  }

  return `${symbol}${numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
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