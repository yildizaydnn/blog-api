import { Router } from 'express';
import { body, cookie } from 'express-validator';
import bcrypt from 'bcrypt';
import User from '@/models/user';

import validationError from '@/middlewares/validationError';
import login from '@/controllers/v1/auth/login';
import register from '@/controllers/v1/auth/register';
import refreshToken from '@/controllers/v1/auth/refresh_tokens';

const router = Router();

// Register
router.post(
  '/register',
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email')
    .custom(async (value) => {
      const userExists = await User.exists({ email: value });
      if (userExists) {
        throw new Error('User email or password is invalid');
      }
    }),
  body('password')
    .trim()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .trim()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  validationError,
  register,
);

// Login
router.post(
  '/login',
  body('email').trim().isEmail().withMessage('Invalid email'),
  body('password')
    .trim()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  validationError,
  login,
);

router.post(
  '/refresh-token',
  cookie('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isJWT()
    .withMessage('Invalid refresh token format'),
  validationError,
  refreshToken,
);

export default router;
