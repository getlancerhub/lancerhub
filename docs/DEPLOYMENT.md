# LancerHub Deployment Guide

## Prerequisites

- Docker & Docker Compose v2+
- Node.js 20+ (for local development)
- Git

## Quick Start (Local Development)

1. **Clone and setup**

   ```bash
   git clone <repository-url>
   cd lancerhub
   cp .env.example .env
   ```

2. **Edit environment variables**

   ```bash
   # Edit .env with your local settings
   # The defaults work for local development
   ```

3. **Start the development environment**

   ```bash
   cd infra/compose
   docker-compose up -d
   ```

4. **Check services**

   ```bash
   # Check all services are running
   docker-compose ps

   # Check API health
   curl http://localhost:3001/health

   # Access web app
   open http://localhost:3000
   ```

## Production Deployment

### Self-Hosted Production

1. **Prepare environment**

   ```bash
   # Set up your server (Ubuntu/Debian example)
   sudo apt update
   sudo apt install docker.io docker-compose-v2
   sudo systemctl enable docker
   sudo usermod -aG docker $USER
   ```

2. **Deploy application**

   ```bash
   git clone <repository-url>
   cd lancerhub
   cp .env.production .env

   # Edit .env with your production values
   # IMPORTANT: Change all passwords and secrets!
   ```

3. **Start production services**

   ```bash
   cd infra/compose
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

4. **Verify deployment**

   ```bash
   # Check services
   docker-compose ps

   # Check logs
   docker-compose logs -f

   # Test health endpoints
   curl https://yourdomain.com/health
   curl https://yourdomain.com/ready
   ```

### Cloud Deployment (AWS/GCP/Azure)

1. **Container Registry**

   ```bash
   # Build and push images
   docker build -t your-registry/lancerhub-api:latest apps/api
   docker build -t your-registry/lancerhub-web:latest apps/web
   docker build -t your-registry/lancerhub-worker:latest apps/worker

   docker push your-registry/lancerhub-api:latest
   docker push your-registry/lancerhub-web:latest
   docker push your-registry/lancerhub-worker:latest
   ```

2. **Use managed services**
   - PostgreSQL → AWS RDS, Google Cloud SQL, Azure Database
   - Redis → AWS ElastiCache, Google Memorystore, Azure Cache
   - Storage → AWS S3, Google Cloud Storage, Azure Blob
   - Load Balancer → AWS ALB, Google Load Balancer, Azure Load Balancer

## Environment Variables

### Required for Production

```bash
# Instance
PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production

# Database (use strong passwords!)
POSTGRES_PASSWORD=your-strong-password
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Authentication (generate strong secrets!)
JWT_SECRET=your-jwt-secret-min-32-chars

# Email (required for notifications)
SMTP_HOST=your-smtp-host
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
FROM_EMAIL=noreply@yourdomain.com

# Stripe (required for payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Storage
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=your-bucket-name
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Enable firewall rules
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerts
- [ ] Review security headers in Caddy
- [ ] Enable rate limiting
- [ ] Configure log retention

## Monitoring

### Health Checks

- API: `GET /health` - Basic health status
- API: `GET /ready` - Readiness check (database, Redis, etc.)

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f worker
```

### Metrics

Consider adding:

- Prometheus + Grafana for metrics
- Sentry for error tracking
- Uptime monitoring (Pingdom, DataDog, etc.)

## Backup Strategy

### Database Backups

```bash
# Manual backup
docker-compose exec postgres pg_dump -U lancerhub -d lancerhub > backup.sql

# Restore
docker-compose exec -T postgres psql -U lancerhub -d lancerhub < backup.sql
```

### File Storage Backups

If using MinIO, set up regular S3 sync:

```bash
# Sync to external S3 for backup
s3cmd sync s3://minio-bucket/ s3://backup-bucket/
```

## Scaling

### Horizontal Scaling

The application supports horizontal scaling:

1. **API servers** - Run multiple instances behind load balancer
2. **Workers** - Scale worker processes for background jobs
3. **Web servers** - Run multiple Next.js instances

### Database Scaling

1. **Read replicas** - For read-heavy workloads
2. **Connection pooling** - Use PgBouncer for connection management
3. **Partitioning** - For large datasets

## Troubleshooting

### Common Issues

1. **Container won't start**

   ```bash
   # Check logs
   docker-compose logs service-name

   # Check disk space
   df -h

   # Check memory
   free -h
   ```

2. **Database connection issues**

   ```bash
   # Test database connectivity
   docker-compose exec api npm run db:test

   # Check database logs
   docker-compose logs postgres
   ```

3. **Permission issues**
   ```bash
   # Fix file permissions
   sudo chown -R 1001:1001 data/
   ```

### Performance Issues

1. **Slow queries** - Enable PostgreSQL query logging
2. **High memory usage** - Tune container resource limits
3. **Slow file uploads** - Check MinIO/S3 configuration

## Updates and Maintenance

### Application Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Run database migrations
docker-compose exec api npm run migrate
```

### Database Migrations

Migrations run automatically on container startup, but you can run manually:

```bash
docker-compose exec migrate npx drizzle-kit migrate
```

## Support

- Documentation: [Link to docs]
- Issues: [Link to GitHub issues]
- Community: [Link to Discord/Slack]
