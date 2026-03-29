import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { logger } from '@/lib/winston';
import User from '@/models/user';
import Token from '@/models/token';
import config from '@/config';
import type { Request, Response } from 'express';
import type { IUser } from '@/models/user';

type UserData = Pick<IUser, 'email' | 'password'>;

const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as UserData;

    // 1. Kullanıcıyı bul
    const user = await User.findOne({ email })
      .select('username email role password')
      .lean()
      .exec();

    // 2. Kullanıcı yok
    if (!user) {
      res.status(404).json({
        code: 'NotFoundError',
        message: 'User email or password is invalid',
      });
      return;
    }

    // 3. Şifre kontrolü ✅
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        code: 'UnauthorizedError',
        message: 'User email or password is invalid',
      });
      return;
    }

    // 4. Token üret
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // 5. DB'ye kaydet
    await Token.create({ token: refreshToken, userId: user._id });

    // 6. Cookie'ye yaz
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 7. Cevap dön
    res.status(200).json({
      user: { username: user.username, email: user.email, role: user.role },
      accessToken,
    });

    logger.info('User logged in successfully', { userId: user._id });
  } catch (error) {
    logger.error('Error in login controller', error);
    res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
    });
  }
};

export default login;
