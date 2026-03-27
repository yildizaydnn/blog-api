import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 6000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.',
  },
});

export default limiter;
