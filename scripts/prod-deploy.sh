#!/bin/bash
set -e

# LancerHub Production Deployment Script
echo "🚀 Deploying LancerHub to production..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Aborting." >&2; exit 1; }

# Check for production environment
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it from .env.production template."
    exit 1
fi

# Validate critical environment variables
echo "🔍 Validating environment variables..."

required_vars=(
    "PUBLIC_APP_URL"
    "POSTGRES_PASSWORD"
    "JWT_SECRET"
    "STRIPE_SECRET_KEY"
    "SMTP_HOST"
    "S3_ACCESS_KEY"
    "S3_SECRET_KEY"
)

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env || grep -q "^${var}=$" .env || grep -q "^${var}=.*change-me" .env; then
        echo "❌ ${var} is not properly set in .env file"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Check if NODE_ENV is production
if ! grep -q "^NODE_ENV=production" .env; then
    echo "⚠️  Warning: NODE_ENV is not set to production"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Navigate to compose directory
cd infra/compose

# Create backup of existing deployment
if docker-compose ps | grep -q "Up"; then
    echo "💾 Creating backup of current deployment..."
    
    # Backup database
    docker-compose exec -T postgres pg_dump -U lancerhub -d lancerhub > "backup-$(date +%Y%m%d-%H%M%S).sql" 2>/dev/null || echo "⚠️  Could not create database backup"
    
    # Stop services gracefully
    echo "🛑 Stopping current services..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml down --timeout 30
fi

# Pull latest images
echo "📦 Pulling latest images..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull

# Build services
echo "🔨 Building services..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --parallel

# Start infrastructure services first
echo "🏗️  Starting infrastructure services..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d postgres redis minio

# Wait for infrastructure
echo "⏳ Waiting for infrastructure services..."
sleep 15

# Initialize MinIO bucket
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up minio_init

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up migrate

# Start application services
echo "🚀 Starting application services..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d api worker web

# Start reverse proxy
echo "🔀 Starting reverse proxy..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d caddy

# Health checks
echo "🏥 Running health checks..."
sleep 20

# Check services
services=("postgres" "redis" "minio" "api" "web" "worker")
for service in "${services[@]}"; do
    if docker-compose ps | grep "$service" | grep -q "Up"; then
        echo "✅ $service is running"
    else
        echo "❌ $service is not running"
        echo "📋 Service logs:"
        docker-compose logs --tail=20 "$service"
        exit 1
    fi
done

# Test API health endpoint
max_attempts=60
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -f -s "$(grep PUBLIC_APP_URL ../../.env | cut -d'=' -f2)/health" >/dev/null 2>&1; then
        echo "✅ API health check passed"
        break
    else
        if [ $attempt -eq $max_attempts ]; then
            echo "❌ API health check failed after $max_attempts attempts"
            echo "📋 API logs:"
            docker-compose logs --tail=20 api
            exit 1
        fi
        echo "⏳ Waiting for API health check... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    fi
done

# Test web app
if curl -f -s "$(grep PUBLIC_APP_URL ../../.env | cut -d'=' -f2)" >/dev/null 2>&1; then
    echo "✅ Web app is accessible"
else
    echo "❌ Web app is not accessible"
    echo "📋 Web app logs:"
    docker-compose logs --tail=20 web
    exit 1
fi

echo ""
echo "🎉 LancerHub production deployment completed successfully!"
echo ""
echo "🌐 Web App: $(grep PUBLIC_APP_URL ../../.env | cut -d'=' -f2)"
echo "🔌 API: $(grep PUBLIC_APP_URL ../../.env | cut -d'=' -f2)/api"
echo ""
echo "📖 View logs:    docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
echo "🛑 Stop:         docker-compose -f docker-compose.yml -f docker-compose.prod.yml down"
echo "🔄 Restart:      docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart"
echo ""
echo "🔐 Security reminders:"
echo "  - Verify SSL certificates are working"
echo "  - Review firewall rules"
echo "  - Set up monitoring and backups"
echo "  - Test all critical user flows"
echo ""