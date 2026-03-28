import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { logger } from '@/lib/winston';
import config from '@/config';
import { genUsername } from '@/utils';

//types
import type { Request, Response } from 'express';
import type { IUser } from '@/models/user';

import user from '@/models/user';
import token from '@/models/token';

type userData = Pick<IUser, 'email' | 'password' | 'role'>;

const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, role }: userData = req.body;

  if (role === 'admin' && !config.WHITELIST_ADMINS_MAIL.includes(email)) {
    res.status(403).json({
      code: 'AuthorizationError',
      message: 'You are not authorized to register as admin',
    });
    logger.warn('Unauthorized admin registration attempt', { email });
    return;
  }

  try {
    const username = genUsername();

    const newUser = await user.create({
      username,
      email,
      password,
      role,
    });

    const accesToken = generateAccessToken(newUser._id);
    const refreshToken = generateRefreshToken(newUser._id);

    //store refresh token in db

    await token.create({
      token: refreshToken,
      userId: newUser._id,
    });
    logger.info('Refresh token stored in database', {
      userId: newUser._id,
      token: refreshToken,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      user: {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
      accesToken,
    });
    logger.info('User registered successfully', {
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    });
  } catch (error) {
    res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
      error: error,
    });
    logger.error('Error in register controller', error);
  }
};

export default register;
