#!/bin/bash

# Supabase Sync Script
# This script syncs database migrations and Edge Functions to Supabase

set -e  # Exit on any error

echo "🚀 Starting Supabase sync..."

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

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    print_error "Not in Supabase project directory. Please run from project root."
    exit 1
fi

# Check if Supabase CLI is available
if ! command -v npx &> /dev/null; then
    print_error "npx not found. Please install Node.js."
    exit 1
fi

print_status "Checking Supabase project status..."
npx supabase status

# 1. Sync Database Migrations
print_status "Syncing database migrations..."
if npx supabase db push; then
    print_success "Database migrations synced successfully!"
else
    print_error "Failed to sync database migrations"
    exit 1
fi

# 2. Deploy Edge Functions
print_status "Deploying Edge Functions..."

# List of functions to deploy
FUNCTIONS=(
    "account-enforcement"
    "admin-impersonate"
    "bkash-payment"
    "course-checkout"
    "course-payment"
    "create-order"
    "create-order-on-payment-success"
    "delete-order"
    "dns-domain-manager"
    "download-digital-file"
    "ebpay-payment"
    "ebpay-verify-payment"
    "ensure-download-links"
    "eps-payment"
    "eps-verify-payment"
    "funnel-offer"
    "get-course-order-public"
    "get-order"
    "get-order-admin"
    "get-order-public"
    "get-recent-orders-for-fomo"
    "image-transform"
    "member-login"
    "nagad-payment"
    "platform-ebpay-payment"
    "platform-ebpay-verify-payment"
    "send-low-stock-email"
    "send-order-email"
    "steadfast-balance"
    "steadfast-create-order"
    "steadfast-webhook"
    "submit-contact-form"
    "subscribe-newsletter"
    "top-sellers"
    "verify-payment"
)

# Deploy each function
for func in "${FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
        print_status "Deploying function: $func"
        if npx supabase functions deploy "$func"; then
            print_success "Function $func deployed successfully!"
        else
            print_warning "Failed to deploy function: $func"
        fi
    else
        print_warning "Function directory not found: $func"
    fi
done

# 3. Verify deployment
print_status "Verifying deployment..."
npx supabase status

print_success "🎉 Supabase sync completed!"
print_status "Your codebase is now synced with Supabase."
