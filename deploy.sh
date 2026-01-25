#!/bin/bash

# Glance Money - Google Cloud Run Deployment Script
# Usage: ./deploy.sh [project-id] [supabase-url] [supabase-anon-key] [supabase-service-key]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required arguments are provided
if [ $# -lt 4 ]; then
    print_error "Usage: $0 <project-id> <supabase-url> <supabase-anon-key> <supabase-service-key>"
    print_error "Example: $0 my-project https://xxx.supabase.co eyJ0... eyJ0..."
    exit 1
fi

PROJECT_ID=$1
SUPABASE_URL=$2
SUPABASE_ANON_KEY=$3
SUPABASE_SERVICE_KEY=$4

print_status "Starting deployment to Google Cloud Run..."
print_status "Project ID: $PROJECT_ID"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Set the project
print_status "Setting Google Cloud project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
print_status "Enabling required Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy using Cloud Build
print_status "Building and deploying with Cloud Build..."
gcloud builds submit --config cloudbuild.yaml \
    --substitutions=_SUPABASE_URL="$SUPABASE_URL",_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY",_SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY"

# Get the service URL
SERVICE_URL=$(gcloud run services describe glance-money --region=us-central1 --format='value(status.url)')

print_status "Deployment completed successfully!"
print_status "Your application is available at: $SERVICE_URL"

# Optional: Open the URL in browser (macOS/Linux)
if command -v open &> /dev/null; then
    read -p "Open the application in your browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open $SERVICE_URL
    fi
elif command -v xdg-open &> /dev/null; then
    read -p "Open the application in your browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open $SERVICE_URL
    fi
fi

print_status "Deployment script completed!"
print_warning "Remember to:"
print_warning "1. Configure your domain (if needed)"
print_warning "2. Set up monitoring and alerting"
print_warning "3. Review security settings"
print_warning "4. Set up automated deployments"