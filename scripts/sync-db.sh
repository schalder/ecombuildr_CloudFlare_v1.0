#!/bin/bash

# Quick Database Sync Script
# Syncs only database migrations (faster for DB-only changes)

set -e

echo "🗄️ Syncing database migrations..."

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in Supabase project directory. Please run from project root."
    exit 1
fi

# Sync database migrations
if npx supabase db push; then
    echo "✅ Database migrations synced successfully!"
else
    echo "❌ Failed to sync database migrations"
    exit 1
fi

echo "🎉 Database sync completed!"
