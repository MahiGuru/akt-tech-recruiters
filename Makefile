# At Bench Docker Makefile
# Usage: make [command]

# Variables
COMPOSE_FILE_DEV = docker-compose.yml
COMPOSE_FILE_PROD = docker-compose.prod.yml
APP_NAME = atbench

# Colors
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

.PHONY: help dev prod build up down logs shell clean health migrate seed backup restore

# Default target
.DEFAULT_GOAL := help

## Show this help message
help:
	@echo "$(GREEN)At Bench Docker Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)Development:$(NC)"
	@echo "  make dev          - Start development environment"
	@echo "  make dev-build    - Build and start development environment"
	@echo "  make dev-down     - Stop development environment"
	@echo "  make dev-logs     - View development logs"
	@echo ""
	@echo "$(YELLOW)Production:$(NC)"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-build   - Build and start production environment"
	@echo "  make prod-down    - Stop production environment"
	@echo "  make prod-logs    - View production logs"
	@echo ""
	@echo "$(YELLOW)Database:$(NC)"
	@echo "  make migrate      - Run database migrations"
	@echo "  make seed         - Seed database with sample data"
	@echo "  make backup       - Backup database"
	@echo "  make restore      - Restore database from backup"
	@echo ""
	@echo "$(YELLOW)Utilities:$(NC)"
	@echo "  make shell        - Access application shell"
	@echo "  make health       - Check application health"
	@echo "  make clean        - Clean up containers and volumes"
	@echo "  make logs         - View all logs"
	@echo ""

## Development Environment

# Start development environment
dev:
	@echo "$(GREEN)Starting development environment...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) up -d
	@echo "$(GREEN)✅ Development environment started!$(NC)"
	@echo "🌐 Application: http://localhost:3000"
	@echo "📊 Health Check: http://localhost:3000/api/health"

# Build and start development environment
dev-build:
	@echo "$(GREEN)Building and starting development environment...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) up -d --build
	@make migrate
	@echo "$(GREEN)✅ Development environment built and started!$(NC)"

# Stop development environment
dev-down:
	@echo "$(YELLOW)Stopping development environment...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) down

# View development logs
dev-logs:
	docker-compose -f $(COMPOSE_FILE_DEV) logs -f

## Production Environment

# Start production environment
prod:
	@echo "$(GREEN)Starting production environment...$(NC)"
	docker-compose -f $(COMPOSE_FILE_PROD) up -d
	@echo "$(GREEN)✅ Production environment started!$(NC)"

# Build and start production environment
prod-build:
	@echo "$(GREEN)Building and starting production environment...$(NC)"
	docker-compose -f $(COMPOSE_FILE_PROD) up -d --build
	@make migrate-prod
	@echo "$(GREEN)✅ Production environment built and started!$(NC)"

# Stop production environment
prod-down:
	@echo "$(YELLOW)Stopping production environment...$(NC)"
	docker-compose -f $(COMPOSE_FILE_PROD) down

# View production logs
prod-logs:
	docker-compose -f $(COMPOSE_FILE_PROD) logs -f

## Database Operations

# Run database migrations (development)
migrate:
	@echo "$(GREEN)Running database migrations...$(NC)"
	sleep 10  # Wait for database to be ready
	docker-compose -f $(COMPOSE_FILE_DEV) exec app npx prisma db push
	@echo "$(GREEN)✅ Database migrations completed!$(NC)"

# Run database migrations (production)
migrate-prod:
	@echo "$(GREEN)Running database migrations (production)...$(NC)"
	sleep 10
	docker-compose -f $(COMPOSE_FILE_PROD) exec app npx prisma migrate deploy
	@echo "$(GREEN)✅ Database migrations completed!$(NC)"

# Seed database with sample data
seed:
	@echo "$(GREEN)Seeding database...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) exec app npm run seed-jobs
	@echo "$(GREEN)✅ Database seeded successfully!$(NC)"

# Backup database
backup:
	@echo "$(GREEN)Creating database backup...$(NC)"
	mkdir -p ./backups
	docker-compose -f $(COMPOSE_FILE_DEV) exec postgres pg_dump -U postgres recruiting_db > ./backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Database backup created in ./backups/$(NC)"

# Restore database from latest backup
restore:
	@echo "$(YELLOW)Restoring database from latest backup...$(NC)"
	@echo "$(RED)⚠️  This will overwrite the current database!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		LATEST_BACKUP=$$(ls -t ./backups/*.sql | head -n1); \
		docker-compose -f $(COMPOSE_FILE_DEV) exec -T postgres psql -U postgres recruiting_db < $$LATEST_BACKUP; \
		echo "$(GREEN)✅ Database restored successfully!$(NC)"; \
	else \
		echo "$(YELLOW)Restore cancelled.$(NC)"; \
	fi

## Utilities

# Access application shell
shell:
	docker-compose -f $(COMPOSE_FILE_DEV) exec app sh

# Check application health
health:
	@echo "$(GREEN)Checking application health...$(NC)"
	@curl -s http://localhost:3000/api/health | jq '.' || echo "$(RED)❌ Health check failed$(NC)"

# View all logs
logs:
	docker-compose -f $(COMPOSE_FILE_DEV) logs -f

# Clean up containers, networks, and volumes
clean:
	@echo "$(YELLOW)Cleaning up Docker resources...$(NC)"
	@echo "$(RED)⚠️  This will remove all containers, networks, and volumes!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose -f $(COMPOSE_FILE_DEV) down -v --remove-orphans; \
		docker-compose -f $(COMPOSE_FILE_PROD) down -v --remove-orphans; \
		docker system prune -f; \
		echo "$(GREEN)✅ Cleanup completed!$(NC)"; \
	else \
		echo "$(YELLOW)Cleanup cancelled.$(NC)"; \
	fi

# Build without cache
rebuild:
	@echo "$(GREEN)Rebuilding application without cache...$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) build --no-cache app
	@echo "$(GREEN)✅ Rebuild completed!$(NC)"

# Show container status
status:
	@echo "$(GREEN)Container Status:$(NC)"
	docker-compose -f $(COMPOSE_FILE_DEV) ps

# Quick setup for new developers
setup:
	@echo "$(GREEN)Setting up At Bench for development...$(NC)"
	@if [ ! -f .env.local ]; then \
		echo "$(YELLOW)Creating .env.local from template...$(NC)"; \
		cp .env.docker .env.local; \
		echo "$(RED)⚠️  Please update .env.local with your credentials before continuing!$(NC)"; \
		exit 1; \
	fi
	@make dev-build
	@make migrate
	@echo "$(GREEN)🎉 Setup completed! Application is running at http://localhost:3000$(NC)"

# Install dependencies and setup environment
install:
	@echo "$(GREEN)Installing dependencies...$(NC)"
	npm install
	@if [ ! -f .env.local ]; then \
		echo "$(YELLOW)Creating .env.local from template...$(NC)"; \
		cp .env.docker .env.local; \
		echo "$(YELLOW)Please update .env.local with your actual credentials.$(NC)"; \
	fi
	@echo "$(GREEN)✅ Dependencies installed!$(NC)"