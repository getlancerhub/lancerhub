import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  },
  trustProxy: true,
})

// Security middleware
await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
})

// CORS configuration
await app.register(cors, {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
    ]

    // Allow no origin (for mobile apps, server-to-server, etc.)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'), false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})

// Rate limiting
await app.register(rateLimit, {
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  timeWindow: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  errorResponseBuilder: (request, context) => ({
    code: 429,
    error: 'Too Many Requests',
    message: `Rate limit exceeded, retry in ${Math.round(context.ttl / 1000)} seconds`,
    retryAfter: Math.round(context.ttl / 1000),
  }),
})

// Health check endpoint
app.get('/health', async (_request, _reply) => {
  return {
    ok: true,
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0',
    environment: process.env.NODE_ENV,
  }
})

// Readiness check
app.get('/ready', async (_request, _reply) => {
  // Here you would check database connectivity, Redis, etc.
  // For now, just return OK
  return {
    ok: true,
    timestamp: new Date().toISOString(),
  }
})

// Global error handler
app.setErrorHandler((error: Error, request, reply) => {
  const isDev = process.env.NODE_ENV !== 'production'

  request.log.error(error)

  // Don't expose internal errors in production
  const statusCode = (error as any).statusCode || 500
  const message = isDev ? error.message : 'Internal Server Error'

  reply.status(statusCode).send({
    error: true,
    message,
    statusCode,
    ...(isDev && { stack: error.stack }),
  })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  app.log.info('SIGTERM received, shutting down gracefully')
  app.close(() => {
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  app.log.info('SIGINT received, shutting down gracefully')
  app.close(() => {
    process.exit(0)
  })
})

const port = Number(process.env.API_PORT || process.env.PORT || 3001)
const host = process.env.API_HOST || '0.0.0.0'

try {
  await app.listen({ port, host })
  app.log.info(`API server listening on ${host}:${port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
