# Coolify Deployment Troubleshooting Guide

## 🔧 Common Issues & Solutions

### Build Failures

**Issue**: Docker build fails for some services
**Solution**:

```bash
# Check Dockerfile paths in docker-compose.coolify.yml
# Ensure context paths are correct relative to repository root
build:
  context: ./apps/api  # ✅ Correct
  context: apps/api    # ✅ Also works
  context: ../../apps/api  # ❌ Wrong for Coolify
```

### Environment Variable Issues

**Issue**: Services can't connect to database/redis
**Solution**:

- Verify all environment variables are set in Coolify
- Check service names match in DATABASE_URL and REDIS_URL
- Use internal Docker network names: `postgres:5432`, `redis:6379`

### Database Connection Errors

**Issue**: `ECONNREFUSED` or database connection timeout
**Solutions**:

1. Ensure PostgreSQL service is healthy before API starts
2. Check depends_on conditions in compose file
3. Verify DATABASE_URL format: `postgresql://user:pass@postgres:5432/dbname`

### MinIO/S3 Storage Issues

**Issue**: File upload failures
**Solutions**:

1. Verify S3_ENDPOINT uses internal service name: `http://minio:9000`
2. Check MinIO credentials are set correctly
3. Ensure bucket initialization completed successfully

### SSL/HTTPS Configuration

**Issue**: Mixed content errors or SSL issues
**Solutions**:

1. Enable HTTPS in Coolify domain settings
2. Update PUBLIC_APP_URL to use https://
3. Configure CORS properly in API service

### Memory/Resource Limits

**Issue**: Services crashing due to resource constraints
**Solutions**:

1. Remove resource limits from docker-compose.coolify.yml for Coolify
2. Let Coolify manage resource allocation
3. Monitor resource usage in Coolify dashboard

## 🐛 Debug Commands

### Check Service Health

```bash
# In Coolify container terminal
docker ps                    # Check running containers
docker logs <container-name> # Check service logs
docker exec -it <container> sh  # Access container shell
```

### Database Debug

```bash
# Connect to PostgreSQL
docker exec -it <postgres-container> psql -U postgres -d lancerhub

# Check tables
\dt

# Check migrations
SELECT * FROM __drizzle_migrations;
```

### Redis Debug

```bash
# Connect to Redis
docker exec -it <redis-container> redis-cli

# Check keys
KEYS *
INFO
```

## 📊 Monitoring

### Health Check Endpoints

Add these to your monitoring:

- `/health` - API health
- `/api/health` - Database connectivity
- MinIO health: `http://minio:9000/minio/health/live`

### Log Aggregation

Coolify automatically aggregates logs from all services. Check:

1. Individual service logs in Coolify dashboard
2. Application-level logs for errors
3. Database transaction logs for performance

## 🚀 Performance Optimization

### Production Optimizations

1. Enable Next.js output tracing
2. Use Redis for session storage
3. Configure PostgreSQL connection pooling
4. Set up CDN for static assets via MinIO

### Resource Scaling

- API: Scale horizontally (multiple replicas)
- Worker: Scale based on queue depth
- Database: Scale vertically (more CPU/RAM)
- Redis: Usually single instance sufficient
