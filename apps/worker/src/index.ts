import 'dotenv/config'
import { Worker } from 'bullmq'

// Create Redis connection for BullMQ
// Handle both REDIS_URL format and individual host/port
let connection: any

if (process.env.REDIS_URL) {
  // Parse redis://host:port format
  const url = new URL(process.env.REDIS_URL)
  connection = {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
  }
} else {
  // Fallback to individual env vars
  connection = {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  }
}

const worker = new Worker(
  'jobs',
  async job => {
    console.log(`Processing job: ${job.name} with data:`, job.data)

    // TODO: handle email sends, pdf generation, webhooks, AI scope checks, etc.
    switch (job.name) {
      case 'send-email':
        console.log('Sending email:', job.data)
        break
      case 'generate-pdf':
        console.log('Generating PDF:', job.data)
        break
      case 'deliver-webhook':
        console.log('Delivering webhook:', job.data)
        break
      default:
        console.log('Unknown job type:', job.name)
    }

    return { jobId: job.id, name: job.name, status: 'completed' }
  },
  { connection }
)

worker.on('completed', job => {
  console.log(`Job ${job.id} completed successfully`)
})

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message)
})

worker.on('error', err => {
  console.error('Worker error:', err)
})

console.log('Worker started and waiting for jobs...')

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down worker gracefully...')
  await worker.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down worker gracefully...')
  await worker.close()
  process.exit(0)
})
