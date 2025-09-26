import { Router } from 'express';
import authRoutes from './auth';
import productRoutes from './products';
import customerRoutes from './customers';
import saleRoutes from './sales';
import statsRoutes from './stats';

const router = Router();

// Rutas de la API
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/sales', saleRoutes);
router.use('/stats', statsRoutes);

// Ruta de estado de la API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;