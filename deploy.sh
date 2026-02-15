#!/bin/bash
# Production deployment script for AI Interview platform
# Handles all edge cases: missing images, old containers, errors

set -e  # Exit on error

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

COMPOSE_FILE="docker-compose.timeweb.yml"

# Function to print colored messages
print_step() {
    echo ""
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if docker-compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    print_error "File $COMPOSE_FILE not found!"
    exit 1
fi

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         AI Interview Platform Deploy           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}Latest changes to deploy:${NC}"
echo "  • Female AI voice (Leda)"
echo "  • Consent checkbox on registration"
echo "  • Link marked as used only on session completion"
echo "  • 30 active links limit per interview"
echo "  • Thank you page after interview completion"
echo "  • Fixed microphone auto-start issues"
echo "  • Fixed backend STT audio timeout errors"
echo ""

read -p "Continue with deployment? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Step 1: Git pull
print_step "[1/7] Pulling latest changes from git..."
if git pull origin master; then
    print_success "Git pull successful"
else
    print_error "Git pull failed"
    exit 1
fi

# Step 2: Stop all containers gracefully (now with proper signal handling)
print_step "[2/7] Stopping containers..."
set +e  # Don't exit on error during cleanup
# Try graceful shutdown with docker-compose down (timeout 20s)
timeout 20 docker-compose -f $COMPOSE_FILE down 2>/dev/null
if [ $? -ne 0 ]; then
    print_warning "Graceful shutdown timed out, forcing stop..."
    # Force stop if graceful shutdown failed
    docker ps -a | grep -E "ai_hr_|ai_interview_" | awk '{print $1}' | xargs -r docker stop -t 5 2>/dev/null || true
    docker ps -a | grep -E "ai_hr_|ai_interview_" | awk '{print $1}' | xargs -r docker rm -f 2>/dev/null || true
fi
set -e  # Re-enable exit on error
print_success "Containers stopped"

# Step 3: Clean dangling images and networks
print_step "[3/7] Cleaning up..."
docker image prune -f > /dev/null 2>&1 || true
docker network prune -f > /dev/null 2>&1 || true
print_success "Cleanup completed"

# Step 4: Build backend
print_step "[4/7] Building backend (this may take a few minutes)..."
if docker-compose -f $COMPOSE_FILE build --no-cache backend; then
    print_success "Backend built successfully"
else
    print_error "Backend build failed"
    exit 1
fi

# Step 5: Build frontend
print_step "[5/7] Building frontend (this may take a few minutes)..."
if docker-compose -f $COMPOSE_FILE build frontend; then
    print_success "Frontend built successfully"
else
    print_error "Frontend build failed"
    exit 1
fi

# Step 6: Start all services
print_step "[6/7] Starting all services..."
if docker-compose -f $COMPOSE_FILE up -d; then
    print_success "Services started"
else
    print_error "Failed to start services"
    exit 1
fi

# Wait for containers to initialize
echo ""
echo -e "${YELLOW}Waiting for services to initialize (20 seconds)...${NC}"
sleep 20

# Step 7: Check status
print_step "[7/7] Checking deployment status..."
echo ""
docker-compose -f $COMPOSE_FILE ps

# Check if all containers are running
CONTAINERS_UP=$(docker-compose -f $COMPOSE_FILE ps | grep -c "Up" || true)
CONTAINERS_TOTAL=$(docker-compose -f $COMPOSE_FILE ps | tail -n +2 | wc -l)

echo ""
if [ "$CONTAINERS_UP" -eq "$CONTAINERS_TOTAL" ] && [ "$CONTAINERS_TOTAL" -gt 0 ]; then
    echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           DEPLOYMENT SUCCESSFUL! ✓             ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    print_success "All $CONTAINERS_UP containers are running"
    echo ""
    echo -e "${GREEN}Deployed features:${NC}"
    echo "  ✓ Female AI voice (Leda)"
    echo "  ✓ Consent checkbox (required)"
    echo "  ✓ Link usage tracking on completion"
    echo "  ✓ 30 links limit per interview"
    echo "  ✓ Thank you page after interview"
    echo "  ✓ Microphone issues fixed"
    echo "  ✓ Backend STT timeout fixed"
    echo ""
    echo -e "${YELLOW}Test the deployment:${NC}"
    echo "  1. Open https://screenme.pro"
    echo "  2. Create interview and generate link"
    echo "  3. Open link as candidate - check consent checkbox"
    echo "  4. Start interview - listen to female AI voice"
    echo ""
    echo -e "${YELLOW}Check logs if needed:${NC}"
    echo "  docker logs ai_hr_backend --tail 50"
    echo "  docker logs ai_hr_frontend --tail 50"
else
    echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         DEPLOYMENT COMPLETED WITH ISSUES       ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    print_warning "Some containers may not be running properly"
    echo ""
    echo -e "${YELLOW}Check logs for errors:${NC}"
    echo "  docker-compose -f $COMPOSE_FILE logs --tail=50"
    echo ""
    echo -e "${YELLOW}Or check specific service:${NC}"
    echo "  docker logs ai_hr_backend --tail 100"
    echo "  docker logs ai_hr_frontend --tail 100"
    echo "  docker logs ai_hr_db --tail 100"
fi

echo ""
