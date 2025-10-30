# DS-Corralón - Sistema de Gestión

Sistema completo de gestión para corralones y depósitos de materiales de construcción.

## 🚀 Características

- ✅ **Gestión de Clientes** - CRUD completo con contactos y sistema de fidelización
- ✅ **Gestión de Productos** - Categorías, precios multi-moneda, control de stock, imágenes
- ✅ **Gestión de Proveedores** - CRUD completo con contactos
- ✅ **Presupuestos** - Creación, envío por email, impresión, conversión a ventas
- ✅ **Ventas** - Punto de venta, múltiples formas de pago, actualización de stock
- ✅ **Compras** - Registro de compras, actualización de stock y costos
- ✅ **Multi-idioma** - Español, Inglés, Portugués
- ✅ **Multi-moneda** - ARS, USD
- ✅ **Roles de usuario** - Admin, Vendedor, Cajero

## 🛠️ Tecnologías

### Backend
- Node.js + Express
- SQLite (better-sqlite3)
- Resend (envío de emails)

### Frontend
- React 18
- React Router
- Context API

## 📋 Requisitos

- Node.js 18 o superior
- npm o yarn

## 🔧 Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/TU_USUARIO/ds-corralon.git
cd ds-corralon
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```
PORT=5000
SESSION_SECRET=tu_secreto_super_seguro_aqui
RESEND_API_KEY=tu_api_key_de_resend
EMAIL_FROM=onboarding@resend.dev
```

4. Crear la base de datos:
```bash
node backend/db/migrate.js
node backend/db/reset.js
```

## 🚀 Uso

### Modo Desarrollo

Terminal 1 - Backend:
```bash
npm run dev:server
```

Terminal 2 - Frontend:
```bash
npm run dev:client
```

La aplicación estará disponible en `http://localhost:5173`

### Modo Producción
```bash
npm run build
npm start
```

## 👤 Usuario por Defecto

- **Email:** admin@corralon.com
- **Password:** admin123
- **Rol:** Administrador

## 📁 Estructura del Proyecto
```
ds-corralon/
├── backend/
│   ├── controllers/     # Lógica de negocio
│   ├── db/             # Base de datos y migraciones
│   ├── middleware/     # Middlewares de Express
│   ├── routes/         # Rutas de la API
│   └── services/       # Servicios (email, etc.)
├── client/
│   ├── public/         # Archivos estáticos
│   └── src/
│       ├── api/        # Llamadas a la API
│       ├── components/ # Componentes React
│       ├── context/    # Context API
│       ├── pages/      # Páginas de la aplicación
│       ├── routes/     # Configuración de rutas
│       └── utils/      # Utilidades
├── .env.example        # Ejemplo de variables de entorno
├── package.json
└── server.js           # Punto de entrada
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la Licencia MIT.

## 👨‍💻 Autor

Tu Nombre - [@tu_usuario](https://github.com/TU_USUARIO)

## 🙏 Agradecimientos

- Proyecto desarrollado con la asistencia de Claude (Anthropic)