# Docker Deployment Guide

This guide explains how to deploy the At Bench recruiting platform using Docker.

## 📋 Prerequisites

- **Docker**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Docker Compose**: Included with Docker Desktop
- **Git**: To clone the repository

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd at-bench-recruiting

# Make deployment script executable
chmod +x scripts/docker-deploy.sh
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.docker .env.local

# Edit environment variables
nano .env.local  # or use your preferred editor
```

**Required Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://postgres:your_password@postgres:5432/recruiting_db
POSTGRES_PASSWORD=your_secure_password

# NextAuth
NEXTAUTH_SECRET=your-very-long-random-secret-key
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers (get from respective developer consoles)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# OpenAI API
OPENAI_API_KEY=your-openai-api-key
```

### 3. Deploy

**Development:**
```bash
./scripts/docker-deploy.sh development
```

**Production:**
```bash
./scripts/docker-deploy.sh production
```

## 📁 Docker Files Overview

### Core Files

- **`Dockerfile`**: Multi-stage build optimized for Next.js
- **`.dockerignore`**: Excludes unnecessary files from build context
- **`docker-compose.yml`**: Development environment
- **`docker-compose.prod.yml`**: Production environment
- **`.env.docker`**: Environment variables template

### Support Files

- **`next.config.mjs`**: Next.js configuration with standalone output
- **`app/api/health/route.js`**: Health check endpoint
- **`scripts/docker-deploy.sh`**: Automated deployment script

## 🏗️ Architecture

### Development Stack
```
┌─────────────────┐
│   Next.js App   │ ← Port 3000
│   (Development) │
└─────────────────┘
          │
┌─────────────────┐
│   PostgreSQL    │ ← Port 5432
│   Database      │
└─────────────────┘
          │
┌─────────────────┐
│     Redis       │ ← Port 6379
│   (Optional)    │
└─────────────────┘
```

### Production Stack
```
┌─────────────────┐
│     Nginx       │ ← Ports 80/443
│  (Reverse Proxy)│
└─────────────────┘
          │
┌─────────────────┐
│   Next.js App   │ ← Port 3000
│  (Production)   │
└─────────────────┘
          │
┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Redis       │
│   Database      │    │   (Sessions)    │
└─────────────────┘    └─────────────────┘
```

## 🛠️ Manual Docker Commands

### Development

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean up (removes volumes)
docker-compose down -v
```

### Production

```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d --build

# View production logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop production services
docker-compose -f docker-compose.prod.yml down
```

### Database Operations

```bash
# Run Prisma migrations
docker-compose exec app npx prisma migrate deploy

# Generate Prisma client
docker-compose exec app npx prisma generate

# Seed database
docker-compose exec app npm run seed-jobs

# Access database shell
docker-compose exec postgres psql -U postgres -d recruiting_db

# Database backup
docker-compose exec postgres pg_dump -U postgres recruiting_db > backup.sql

# Database restore
docker-compose exec -T postgres psql -U postgres recruiting_db < backup.sql
```

### Application Management

```bash
# Access application shell
docker-compose exec app sh

# View application logs
docker-compose logs app -f

# Restart application only
docker-compose restart app

# Rebuild application
docker-compose build app --no-cache
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Permission Denied on Scripts
```bash
chmod +x scripts/docker-deploy.sh
```

#### 2. Port Already in Use
```bash
# Check what's using the port
lsof -i :3000

# Stop the process or change port in docker-compose.yml
```

#### 3. Database Connection Failed
```bash
# Check database logs
docker-compose logs postgres

# Verify database is running
docker-compose ps postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

#### 4. Environment Variables Not Loading
```bash
# Verify .env.local exists and has correct format
cat .env.local

# Restart services after env changes
docker-compose restart
```

### Health Checks

```bash
# Application health
curl http://localhost:3000/api/health

# Database health
docker-compose exec postgres pg_isready -U postgres

# Redis health (if using)
docker-compose exec redis redis-cli ping
```

### Performance Monitoring

```bash
# Container resource usage
docker stats

# Container logs with timestamps
docker-compose logs -t

# Disk usage
docker system df
```

## 🔒 Security Considerations

### Environment Variables
- Never commit `.env.local` to version control
- Use strong, unique passwords for production
- Rotate secrets regularly

### Network Security
```bash
# Production network isolation
docker network ls
docker network inspect atbench-network
```

### SSL/TLS Setup
For production, configure SSL certificates:

1. Place certificates in `./ssl/` directory
2. Update `nginx.conf` with SSL configuration
3. Update `NEXTAUTH_URL` to use HTTPS

## 📊 Monitoring

### Application Metrics
- Health endpoint: `http://localhost:3000/api/health`
- Application logs: `docker-compose logs app`
- Performance: `docker stats`

### Database Monitoring
```bash
# Connection count
docker-compose exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Database size
docker-compose exec postgres psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('recruiting_db'));"
```

## 🚀 Production Deployment

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
```

### 2. Application Deployment
```bash
# Clone repository
git clone <your-repo> /opt/at-bench
cd /opt/at-bench

# Setup environment
cp .env.docker .env.local
# Edit .env.local with production values

# Deploy
./scripts/docker-deploy.sh production
```

### 3. Setup Process Manager (Optional)
```bash
# Using systemd
sudo nano /etc/systemd/system/at-bench.service
sudo systemctl enable at-bench
sudo systemctl start at-bench
```

## 🔄 Updates and Maintenance

### Updating Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate deploy
```

### Backup Strategy
```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dump -U postgres recruiting_db > backups/backup_$DATE.sql
```

## 📞 Support

For issues related to:
- **Docker**: Check [Docker documentation](https://docs.docker.com/)
- **Next.js**: Check [Next.js documentation](https://nextjs.org/docs)
- **PostgreSQL**: Check [PostgreSQL documentation](https://www.postgresql.org/docs/)

## 🎉 Success!

After successful deployment, your application will be available at:
- **Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **Database**: localhost:5432

Happy coding! 🚀