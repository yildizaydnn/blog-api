import express from 'express';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

// custom modeules
import config from '@/config';
import limiter from '@/lib/express_rate_limit';
import v1Routes from '@/routes/v1';
import { connectToDatabase, disconnectFromDatabase } from '@/lib/mongoose';
import { logger } from '@/lib/winston';

// types
import type { CorsOptions } from 'cors';

const app = express();

//configure cors options
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (
      config.NODE_ENV === 'development' ||
      !origin ||
      config.WHITELIST_ORIGINS.includes(origin || '')
    ) {
      callback(null, true);
    } else {
      callback(new Error(`CORS error: ${origin} is not allowed`), false);
    }
    logger.error(`CORS error: ${origin} is not allowed`);
  },
};

//apply cors middleware
app.use(cors(corsOptions));

//enable JSON request body parsing
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(
  compression({
    threshold: 1024, // Minimum response size in bytes to compress
  }),
);

app.use(helmet());

app.use(limiter);

(async () => {
  try {
    await connectToDatabase();

    app.use('/api/v1', v1Routes);

    app.listen(config.PORT, () => {
      logger.info(`Server is running: http://localhost:${config.PORT}`);
    });
  } catch (error) {
    logger.error('Error starting server:', error);

    if (config.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
})();

const handleServerShutdown = async () => {
  try {
    await disconnectFromDatabase();
    logger.info('Server SHUTDOWN');
    process.exit(0);
  } catch (error) {
    logger.error('Error during server shutdown:', error);
  }
};

process.on('SIGINT', handleServerShutdown);
process.on('SIGTERM', handleServerShutdown);

//48zaVbLAubF0P7iq
