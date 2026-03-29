import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

import { logger } from '@/lib/winston';
import { generateAccessToken } from '@/lib/jwt';
import Token from '@/models/token';
import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { verifyRefreshToken } from '@/lib/jwt';

const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies.refreshToken as string;

  try {
    const tokenExist = await Token.exists({ token: refreshToken });

    if (!tokenExist) {
      res.status(401).json({
        code: 'UnauthorizedError',
        message: 'Refresh token is invalid',
      });
      logger.warn('Invalid refresh token attempt', { token: refreshToken });
      return;
    }

    const jwtPayload = verifyRefreshToken(refreshToken) as {
      userId: Types.ObjectId;
    };

    const accesToken = generateAccessToken(jwtPayload.userId);
    res.status(200).json({ accesToken });
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      res.status(401).json({
        code: 'UnauthorizedError',
        message: 'Refresh token has expired',
      });
      logger.warn('Expired refresh token attempt', { token: refreshToken });
      return;
    }

    if (error instanceof JsonWebTokenError) {
      res.status(401).json({
        code: 'UnauthorizedError',
        message: 'Refresh token is invalid',
      });
      logger.warn('Invalid refresh token attempt', { token: refreshToken });
      return;
    }
    res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
      error: error,
    });

    logger.error('Error during refresh token', error);
  }
};

export default refreshToken;
