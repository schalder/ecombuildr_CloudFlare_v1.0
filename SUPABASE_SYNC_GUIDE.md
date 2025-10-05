# 🚀 Supabase Sync Guide

This guide explains how to keep your local codebase synchronized with your Supabase project.

## 📋 Quick Commands

### Full Sync (Database + Functions)
```bash
npm run sync:supabase
# or
./scripts/sync-supabase.sh
```

### Database Only
```bash
npm run sync:db
# or
./scripts/sync-db.sh
```

### Functions Only
```bash
npm run sync:functions
# or
./scripts/sync-functions.sh
```

## 🔧 Manual Commands

### Database Migrations
```bash
# Push all pending migrations
npx supabase db push

# Check migration status
npx supabase migration list

# Create new migration
npx supabase migration new "migration_name"
```

### Edge Functions
```bash
# Deploy specific function
npx supabase functions deploy function-name

# Deploy all functions
npx supabase functions deploy

# Check function status
npx supabase functions list
```

## 🤖 Automated Deployment (GitHub Actions)

The project includes automated deployment via GitHub Actions:

1. **Triggers**: 
   - Push to `main` branch with changes in `supabase/` directory
   - Manual workflow dispatch

2. **Required Secrets**:
   - `SUPABASE_ACCESS_TOKEN`: Your Supabase access token
   - `SUPABASE_PROJECT_REF`: Your Supabase project reference

3. **Setup**:
   ```bash
   # Get your access token
   npx supabase login
   
   # Get your project reference
   npx supabase status
   ```

## 📁 Project Structure

```
supabase/
├── migrations/          # Database schema changes
├── functions/           # Edge Functions
│   ├── function-name/
│   │   └── index.ts
│   └── ...
└── config.toml         # Supabase configuration

scripts/
├── sync-supabase.sh    # Full sync script
├── sync-db.sh          # Database only sync
└── sync-functions.sh   # Functions only sync
```

## ⚠️ Important Notes

1. **Always test locally** before pushing to production
2. **Database migrations** are irreversible - be careful!
3. **Edge Functions** are deployed individually
4. **Vercel Edge Functions** (`api/` directory) are separate from Supabase Edge Functions

## 🐛 Troubleshooting

### Supabase CLI not found
```bash
# Install via npx (recommended)
npx supabase --version

# Or install globally
npm install -g supabase
```

### Authentication issues
```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF
```

### Migration conflicts
```bash
# Check migration status
npx supabase migration list

# Reset local migrations (DANGEROUS!)
npx supabase db reset
```

## 🔄 Workflow

### When you make changes:

1. **Database changes**: Create migration files in `supabase/migrations/`
2. **Function changes**: Update files in `supabase/functions/`
3. **Test locally**: Use `npx supabase start` for local development
4. **Sync to production**: Run appropriate sync command
5. **Verify**: Check Supabase dashboard or run `npx supabase status`

### Best Practices:

- ✅ Always backup before major changes
- ✅ Test migrations locally first
- ✅ Use descriptive migration names
- ✅ Deploy functions individually for faster updates
- ✅ Monitor Supabase logs after deployment
