import bcrypt from 'bcrypt';
import readline from 'readline';
import { runQuery, getOne } from '../database.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const createSuperAdmin = async () => {
  console.log('\n🔐 === CREAR USUARIO SUPER-ADMIN ===\n');

  try {
    // Solicitar datos
    const username = await question('Username: ');
    const nombre = await question('Nombre: ');
    const apellido = await question('Apellido: ');
    const email = await question('Email: ');
    const password = await question('Contraseña: ');

    // Validaciones básicas
    if (!username || !nombre || !apellido || !email || !password) {
      console.error('❌ Error: Todos los campos son obligatorios');
      rl.close();
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ Error: La contraseña debe tener al menos 6 caracteres');
      rl.close();
      process.exit(1);
    }

    // Verificar si el usuario ya existe
    const existing = await getOne(
      'SELECT id FROM usuarios WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing) {
      console.error('❌ Error: Ya existe un usuario con ese username o email');
      rl.close();
      process.exit(1);
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario super_admin (sin empresa_id, puede acceder a todas)
    const result = await runQuery(
      `INSERT INTO usuarios (
        username, password, nombre, apellido, email, rol, activo, empresa_id
      ) VALUES (?, ?, ?, ?, ?, 'super_admin', 1, NULL)`,
      [username, hashedPassword, nombre, apellido, email]
    );

    console.log('\n✅ Super-Admin creado exitosamente!');
    console.log(`   ID: ${result.id}`);
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Rol: super_admin`);
    console.log('\n💡 Puedes iniciar sesión con este usuario en cualquier empresa.\n');

  } catch (error) {
    console.error('\n❌ Error al crear super-admin:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
};

createSuperAdmin();