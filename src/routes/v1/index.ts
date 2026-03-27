import { Router } from 'express';
import { timeStamp } from 'node:console';
import { stat } from 'node:fs';
import authRoutes from '@/routes/v1/auth';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    message: 'API server is live',
    status: 'ok',
    version: '1.0.0',
    docs: 'https://docs.blog-api.codewithsadee.com/',
    timeStamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);

export default router;
