#!/bin/bash

# Code Quality Check Script
# This script runs all code quality checks for both frontend and backend

echo "🔍 Running code quality checks..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command was successful
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 passed${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

echo -e "${YELLOW}Backend checks:${NC}"
echo "----------------"

# Backend type checking
echo "Running backend type checking..."
cd backend && npm run typecheck
check_result "Backend TypeScript compilation"

# Backend linting
echo "Running backend linting..."
npm run lint
check_result "Backend ESLint"

# Backend formatting check
echo "Checking backend formatting..."
npm run format -- --check
check_result "Backend Prettier formatting"

# Backend build
echo "Building backend..."
npm run build
check_result "Backend build"

echo ""
echo -e "${YELLOW}Frontend checks:${NC}"
echo "----------------"

# Frontend type checking
echo "Running frontend type checking..."
cd ../frontend && npm run typecheck
check_result "Frontend TypeScript compilation"

# Frontend linting
echo "Running frontend linting..."
npm run lint
check_result "Frontend ESLint"

# Frontend formatting check
echo "Checking frontend formatting..."
npm run format -- --check
check_result "Frontend Prettier formatting"

# Frontend build
echo "Building frontend..."
npm run build
check_result "Frontend build"

# Frontend tests
echo "Running frontend tests..."
npm test
check_result "Frontend tests"

echo ""
echo -e "${GREEN}🎉 All code quality checks passed!${NC}"
