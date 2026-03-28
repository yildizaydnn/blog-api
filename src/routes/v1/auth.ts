import { Router } from 'express';
import { body } from 'express-validator';

import register from '@/controllers/v1/auth/register';
import validationError from '@/middlewares/validationError';

const router = Router();

router.post(
  '/register',
  body('email').trim().isEmail().withMessage('Invalid email'),
  body('password')
    .trim()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  validationError,
  register,
);

export default router;
