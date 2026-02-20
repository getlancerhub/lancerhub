# Contributing to LancerHub

Welcome to LancerHub! We're excited to have you contribute to our open-source freelancer operations platform.

## 🏗️ Monorepo Structure

This is a monorepo containing multiple packages and applications:

```
├── apps/                   # Applications
│   ├── api/               # Fastify backend API
│   ├── web/               # Next.js frontend
│   └── worker/            # Background job processor
├── packages/              # Shared packages
│   ├── db/                # Database schema & migrations
│   ├── sdk/               # TypeScript SDK
│   └── plugin-kit/        # Plugin development kit
├── infra/                 # Infrastructure
│   └── compose/           # Docker Compose configurations
├── docs/                  # Documentation
└── scripts/               # Build & deployment scripts
```

## 🚀 Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd lancerhub
   ```

2. **Start development environment**

   ```bash
   ./scripts/dev-setup.sh
   ```

3. **Access the applications**
   - Web App: http://localhost:3000
   - API: http://localhost:3001
   - MinIO Console: http://localhost:9001

## 📝 Commit Guidelines

We use [Conventional Commits](https://conventionalcommits.org/) for consistent commit messages:

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Maintenance tasks

### Scopes

- `api`: Backend API service
- `web`: Frontend application
- `worker`: Background worker
- `db`: Database package
- `sdk`: SDK package
- `plugin-kit`: Plugin kit
- `infra`: Infrastructure
- `docs`: Documentation

### Examples

```bash
feat(api): add user authentication endpoints
fix(web): resolve navigation bug on mobile devices
docs: update deployment guide
build(infra): optimize Docker build process
```

## 🔧 Development Workflow

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features
- `fix/*`: Bug fixes
- `hotfix/*`: Critical production fixes

### Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes following our coding standards
3. Write/update tests as needed
4. Update documentation
5. Submit a pull request to `develop`
6. Ensure all checks pass
7. Request review from maintainers

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific app
npm run test:api
npm run test:web

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Unit tests: `*.test.ts` files alongside source
- Integration tests: `tests/` directory in each package
- E2E tests: `e2e/` directory in web app

## 📦 Working with Packages

### Adding Dependencies

```bash
# Install to specific package
npm install --workspace=apps/api <package-name>
npm install --workspace=packages/db <package-name>

# Install to root (affects all packages)
npm install <package-name>
```

### Building Packages

```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=packages/db
```

## 🐛 Debugging

### API Server

- Logs: `docker-compose logs -f api`
- Debug mode: Set `LOG_LEVEL=debug` in `.env`

### Database

- Connect: `docker-compose exec postgres psql -U dev_user -d lancerhub_dev`
- Migrations: `npm run migrate --workspace=packages/db`

### Worker

- Job queue: Check Redis keys with `docker-compose exec redis redis-cli`

## 📋 Code Standards

### TypeScript

- Strict mode enabled
- Use explicit types when possible
- Follow existing code patterns

### Formatting

- Prettier for code formatting
- ESLint for code quality
- Pre-commit hooks ensure consistency

### File Organization

- Group related files in directories
- Use index files for clean imports
- Follow existing naming conventions

## 🔒 Security

### Environment Variables

- Never commit `.env` files
- Use strong secrets in production
- Document required environment variables

### Dependencies

- Regularly update dependencies
- Audit for vulnerabilities: `npm audit`
- Review dependency licenses

## 🚀 Deployment

### Development

```bash
./scripts/dev-setup.sh
```

### Production

```bash
./scripts/prod-deploy.sh
```

See [Deployment Guide](./docs/DEPLOYMENT.md) for detailed instructions.

## 📚 Resources

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Database Schema](./packages/db/docs/SCHEMA.md)
- [Plugin Development](./packages/plugin-kit/README.md)

## 🤝 Getting Help

- 📖 Check the documentation first
- 🔍 Search existing issues
- 💬 Join our Discord community
- 📧 Email: dev@lancerhub.org

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

Thank you for contributing to LancerHub! 🚀
