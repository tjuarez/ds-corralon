import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiDir = path.join(__dirname, 'client', 'src', 'api');

// Lista de archivos API (excepto auth.js que ya lo actualizamos)
const apiFiles = [
  'caja.js',
  'clientes.js',
  'compras.js',
  'cuentaCorriente.js',
  'presupuestos.js',
  'productos.js',
  'proveedores.js',
  'reportes.js',
  'sucursales.js',
  'usuarios.js',
  'ventas.js'
];

console.log('🔄 Actualizando archivos API...\n');

apiFiles.forEach(file => {
  const filePath = path.join(apiDir, file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Agregar import si no existe
    if (!content.includes("import { fetchWithSucursal }")) {
      // Buscar la línea del API_URL
      const apiUrlLine = "const API_URL = '/api';";
      if (content.includes(apiUrlLine)) {
        content = content.replace(
          apiUrlLine,
          `import { fetchWithSucursal } from '../utils/fetchWithSucursal';\n\n${apiUrlLine}`
        );
      }
    }
    
    // Reemplazar todas las ocurrencias de "await fetch(" por "await fetchWithSucursal("
    content = content.replace(/await fetch\(/g, 'await fetchWithSucursal(');
    
    // Escribir el archivo actualizado
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Actualizado: ${file}`);
  } catch (error) {
    console.error(`❌ Error al actualizar ${file}:`, error.message);
  }
});

console.log('\n✨ Actualización completada!');