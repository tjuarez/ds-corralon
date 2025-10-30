import express from 'express';
import { upload, uploadProductoImagen, deleteProductoImagen } from '../controllers/uploadController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// Subir imagen de producto
router.post('/producto-imagen', upload.single('imagen'), uploadProductoImagen);

// Eliminar imagen de producto
router.delete('/producto-imagen/:filename', deleteProductoImagen);

export default router;