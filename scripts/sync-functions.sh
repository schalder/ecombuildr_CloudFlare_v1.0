#!/bin/bash

# Edge Functions Sync Script
# Syncs only Edge Functions (faster for function-only changes)

set -e

echo "⚡ Syncing Edge Functions..."

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in Supabase project directory. Please run from project root."
    exit 1
fi

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
        echo "📦 Deploying function: $func"
        if npx supabase functions deploy "$func"; then
            echo "✅ Function $func deployed successfully!"
        else
            echo "⚠️ Failed to deploy function: $func"
        fi
    else
        echo "⚠️ Function directory not found: $func"
    fi
done

echo "🎉 Edge Functions sync completed!"
