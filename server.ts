import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase, getDbStatus } from './server/db';
import { authMiddleware } from './server/middleware/auth';
import authRoutes from './server/routes/authRoutes';
import productRoutes from './server/routes/productRoutes';
import categoryRoutes from './server/routes/categoryRoutes';
import checkoutRoutes from './server/routes/checkoutRoutes';
import orderRoutes from './server/routes/orderRoutes';
import reviewRoutes from './server/routes/reviewRoutes';
import cmsRoutes from './server/routes/cmsRoutes';
import uploadRoutes from './server/routes/uploadRoutes';
import adminRoutes from './server/routes/adminRoutes';
import analyticsRoutes from './server/routes/analyticsRoutes';
import cartRoutes from './server/routes/cartRoutes';
import homepageBuilderRoutes from './server/routes/homepageBuilderRoutes';
import contactRoutes from './server/routes/contactRoutes';
import blogRoutes from './server/routes/blogRoutes';
import wishlistRoutes from './server/routes/wishlistRoutes';
import paymentRoutes from './server/routes/paymentRoutes';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(authMiddleware);

  // Initialize MongoDB Atlas connection
  console.log('🚀 [NOVARA COMMERCE] Initializing backend services...');
  await initDatabase();

  // API Health & DB status
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'NOVARA COMMERCE',
      environment: process.env.NODE_ENV || 'development',
      database: getDbStatus(),
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/checkout', checkoutRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/cms', cmsRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/homepage', homepageBuilderRoutes);
  app.use('/api/admin/homepage', homepageBuilderRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/blog', blogRoutes);
  app.use('/api/wishlist', wishlistRoutes);
  app.use('/api/payment', paymentRoutes);

  // Convenience root aliases for sliders, banners, and ads
  app.use('/api/sliders', (req, res, next) => {
    req.url = req.url === '/' ? '/sliders' : `/sliders${req.url}`;
    cmsRoutes(req, res, next);
  });
  app.use('/api/banners', (req, res, next) => {
    req.url = req.url === '/' ? '/banners' : `/banners${req.url}`;
    cmsRoutes(req, res, next);
  });
  app.use('/api/advertisements', (req, res, next) => {
    req.url = req.url === '/' ? '/advertisements' : `/advertisements${req.url}`;
    cmsRoutes(req, res, next);
  });

  // Fallback error handler when database is offline
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err.name === 'MongooseError' || err.name === 'MongoNetworkError' || (err.message && err.message.includes('buffering timed out'))) {
      console.warn('[AI Studio] Database offline — returning mock fallback response');
      if (req.method === 'GET') {
        return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
      }
      return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
    }
    next(err);
  });

  // Serve static assets from public
  app.use(express.static(path.resolve(__dirname, 'public')));

  if (!isProduction) {
    // Development mode with Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ [NOVARA COMMERCE] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
