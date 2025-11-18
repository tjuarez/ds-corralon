import { createClient } from '@libsql/client';

let db;

// Función para inicializar la conexión
async function initializeDatabase() {
  if (process.env.NODE_ENV === 'production') {
    // Producción: usar Turso
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
      throw new Error('TURSO_DATABASE_URL y TURSO_AUTH_TOKEN son requeridas en producción');
    }

    db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    console.log('✅ Conectado a la base de datos Turso (producción)');
  } else {
    // Desarrollo: usar SQLite local
    const sqlite3Module = await import('sqlite3');
    const sqlite3 = sqlite3Module.default;
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const dbPath = path.join(__dirname, 'corralon.sqlite');

    const sqliteDb = new sqlite3.Database(dbPath);

    // Adaptar interfaz de sqlite3 a la de libsql
    db = {
      execute: (sql, params = []) => {
        return new Promise((resolve, reject) => {
          sqliteDb.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve({ rows });
          });
        });
      },
    };

    console.log(`✅ Conectado a la base de datos SQLite local: ${dbPath}`);
  }
}

// Inicializar la base de datos
await initializeDatabase();

// Wrapper functions adaptadas para ambos clientes
export const runQuery = async (sql, params = []) => {
  try {
    const result = await db.execute(sql, params);
    return result.rows || [];
  } catch (error) {
    console.error('Error en runQuery:', error);
    throw error;
  }
};

export const getAll = async (sql, params = []) => {
  try {
    const result = await db.execute(sql, params);
    return result.rows || [];
  } catch (error) {
    console.error('Error en getAll:', error);
    throw error;
  }
};

export const getOne = async (sql, params = []) => {
  try {
    const result = await db.execute(sql, params);
    return result.rows?.[0] || null;
  } catch (error) {
    console.error('Error en getOne:', error);
    throw error;
  }
};

export default db;