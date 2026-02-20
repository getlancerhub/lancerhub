#!/bin/bash
set -e

# LancerHub Development Setup Script
echo "🚀 Setting up LancerHub for development..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Aborting." >&2; exit 1; }

# Set up environment
if [ ! -f .env ]; then
    echo "📝 Setting up environment variables..."
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please review and update .env file with your settings"
else
    echo "✅ .env file already exists"
fi

# Navigate to compose directory
cd infra/compose

# Copy .env file to compose directory  
if [ ! -f .env ]; then
    echo "📋 Copying environment file..."
    cp ../../.env .env
    echo "✅ Environment file copied"
fi

# Pull latest images
echo "📦 Pulling latest Docker images..."
docker-compose pull

# Build services
echo "🔨 Building services..."
docker-compose build

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Health check
echo "🏥 Running health checks..."

# Check PostgreSQL
if docker-compose exec -T postgres pg_isready -U lancerhub >/dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
    exit 1
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping | grep -q PONG; then
    echo "✅ Redis is ready"
else
    echo "❌ Redis is not ready"
    exit 1
fi

# Check MinIO
if curl -f http://localhost:9000/minio/health/live >/dev/null 2>&1; then
    echo "✅ MinIO is ready"
else
    echo "❌ MinIO is not ready"
    exit 1
fi

# Check API
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        echo "✅ API is ready"
        break
    else
        if [ $attempt -eq $max_attempts ]; then
            echo "❌ API is not ready after $max_attempts attempts"
            exit 1
        fi
        echo "⏳ Waiting for API... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    fi
done

# Check Web
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ Web app is ready"
        break
    else
        if [ $attempt -eq $max_attempts ]; then
            echo "❌ Web app is not ready after $max_attempts attempts"
            exit 1
        fi
        echo "⏳ Waiting for web app... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    fi
done

echo ""
echo "🎉 LancerHub is ready for development!"
echo ""
echo "📱 Web App:      http://localhost:3000"
echo "🔌 API:          http://localhost:3001"
echo "💾 MinIO Console: http://localhost:9001"
echo "🗄️  PostgreSQL:   localhost:5432"
echo "📊 Redis:        localhost:6379"
echo ""
echo "📖 View logs:    docker-compose logs -f"
echo "🛑 Stop:         docker-compose down"
echo "🔄 Restart:      docker-compose restart"
echo ""