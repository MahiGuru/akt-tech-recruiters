#!/bin/bash

# At Bench Docker Deployment Script
# Usage: ./scripts/docker-deploy.sh [development|production]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Environment setup
setup_environment() {
    local env=${1:-development}
    
    if [ "$env" = "production" ]; then
        print_status "Setting up production environment..."
        
        if [ ! -f .env.local ]; then
            print_warning ".env.local not found. Creating from template..."
            cp .env.docker .env.local
            print_warning "Please update .env.local with your actual credentials before running again."
            exit 1
        fi
        
        COMPOSE_FILE="docker-compose.prod.yml"
    else
        print_status "Setting up development environment..."
        
        if [ ! -f .env.local ]; then
            print_warning ".env.local not found. Creating from template..."
            cp .env.docker .env.local
        fi
        
        COMPOSE_FILE="docker-compose.yml"
    fi
}

# Database migration
migrate_database() {
    print_status "Running database migrations..."
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Run Prisma migrations
    docker-compose -f $COMPOSE_FILE exec app npx prisma migrate deploy
    
    if [ $? -eq 0 ]; then
        print_success "Database migrations completed successfully!"
    else
        print_error "Database migrations failed!"
        exit 1
    fi
}

# Build and start services
start_services() {
    print_status "Building and starting services..."
    
    # Build images
    docker-compose -f $COMPOSE_FILE build --no-cache
    
    # Start services
    docker-compose -f $COMPOSE_FILE up -d
    
    if [ $? -eq 0 ]; then
        print_success "Services started successfully!"
    else
        print_error "Failed to start services!"
        exit 1
    fi
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Wait for application to start
    sleep 30
    
    # Check if application is healthy
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "Application is healthy!"
    else
        print_error "Application health check failed!"
        print_status "Checking application logs..."
        docker-compose -f $COMPOSE_FILE logs app
        exit 1
    fi
}

# Show status
show_status() {
    print_status "Service Status:"
    docker-compose -f $COMPOSE_FILE ps
    
    print_status "\nApplication URLs:"
    echo "🌐 Application: http://localhost:3000"
    echo "📊 Health Check: http://localhost:3000/api/health"
    echo "🗄️  Database: localhost:5432"
    
    if [ "$1" = "production" ]; then
        echo "⚡ Redis: localhost:6379"
    fi
    
    print_status "\nUseful Commands:"
    echo "📋 View logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "🔧 Shell access: docker-compose -f $COMPOSE_FILE exec app sh"
    echo "🛑 Stop services: docker-compose -f $COMPOSE_FILE down"
    echo "🗑️  Clean up: docker-compose -f $COMPOSE_FILE down -v"
}

# Main deployment function
main() {
    local environment=${1:-development}
    
    print_status "Starting At Bench deployment in $environment mode..."
    
    # Validate environment
    if [ "$environment" != "development" ] && [ "$environment" != "production" ]; then
        print_error "Invalid environment. Use 'development' or 'production'"
        exit 1
    fi
    
    # Run deployment steps
    check_docker
    setup_environment $environment
    start_services
    migrate_database
    health_check
    show_status $environment
    
    print_success "Deployment completed successfully! 🎉"
}

# Run main function with arguments
main "$@"