#!/bin/bash
# prepare-coolify-deployment.sh

echo "🚀 Preparing LancerHub for Coolify deployment..."

# 1. Commit the Coolify-specific files
git add docker-compose.coolify.yml .env.coolify
git commit -m "feat: Add Coolify deployment configuration"

# 2. Push to repository
git push origin main

echo "✅ Repository updated for Coolify deployment"
echo ""
echo "Next steps:"
echo "1. Go to your Coolify dashboard"
echo "2. Create new Docker Compose resource"  
echo "3. Point to this repository"
echo "4. Use docker-compose.coolify.yml as compose file"
echo "5. Set environment variables from .env.coolify"
echo "6. Deploy!"
echo ""
echo "🌐 Remember to update these URLs in Coolify:"
echo "   - PUBLIC_APP_URL: Your web app domain"
echo "   - NEXT_PUBLIC_API_URL: Your API domain"