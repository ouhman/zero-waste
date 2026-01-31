# Supabase CLI Quick Reference

## Current Setup

- **Project ID (DEV):** lccpndhssuemudzpfvvg
- **Environment:** Development
- **CLI Version:** 2.72.7
- **Database Version:** PostgreSQL 17

## Common Commands

### Project Management
```bash
# Link to current project
npx supabase link --project-ref lccpndhssuemudzpfvvg

# Check project status
npx supabase status
```

### Migrations
```bash
# List all migrations
npx supabase migration list

# Create new migration
npx supabase migration new feature_name

# Push migrations to remote (dev)
npx supabase db push

# Pull schema from remote
npx supabase db pull

# Check for drift
npx supabase db diff

# Repair migration history (if needed)
npx supabase migration repair --status applied MIGRATION_ID
```

### Local Development (Docker)
```bash
# Start local Supabase stack
npx supabase start

# Stop local stack
npx supabase stop

# Reset database (wipes data + applies migrations + runs seed.sql)
npx supabase db reset

# View local dashboard
# Automatically opens at http://127.0.0.1:54323
```

### Edge Functions
```bash
# Deploy function
npx supabase functions deploy function-name

# View logs
npx supabase functions logs function-name --tail

# Set secrets
npx supabase secrets set KEY=value

# List secrets
npx supabase secrets list
```

### Database Direct Access
```bash
# Execute SQL file
npx supabase db execute -f path/to/file.sql

# Run SQL inline
npx supabase db execute --sql "SELECT * FROM categories"

# Get database URL
npx supabase db url
```

## Configuration Files

- **`supabase/config.toml`** - CLI configuration
- **`supabase/seed.sql`** - Development seed data
- **`supabase/migrations/`** - Database migrations (version controlled)

## Migration Workflow

1. **Create migration:**
   ```bash
   npx supabase migration new add_new_feature
   ```

2. **Edit the generated file:**
   ```
   supabase/migrations/YYYYMMDDHHMMSS_add_new_feature.sql
   ```

3. **Test in dev (if linked):**
   ```bash
   npx supabase db push
   ```

4. **Commit and push to Git:**
   ```bash
   git add supabase/migrations/
   git commit -m "feat: add new feature migration"
   git push
   ```

5. **GitHub Actions deploys to production** (configured in Phase 5)

## Seed Data

The `supabase/seed.sql` file contains test data for local development:
- 17 categories
- 10 test locations (approved and pending)

To apply seed data:
```bash
npx supabase db reset  # Wipes DB, applies migrations, then seeds
```

## Troubleshooting

### Migration history out of sync
```bash
# Mark migration as applied
npx supabase migration repair --status applied MIGRATION_ID

# Mark migration as reverted
npx supabase migration repair --status reverted MIGRATION_ID
```

### Can't connect to project
```bash
# Re-link to project
npx supabase link --project-ref lccpndhssuemudzpfvvg
```

### Local Docker issues
```bash
# Stop and remove all containers
npx supabase stop --no-backup

# Restart
npx supabase start
```

## Next Phase

Phase 2 will:
- Create new production Supabase project
- Set up GitHub Actions for automated deployments
- Configure dual environment (dev + prod)

## Documentation

- Supabase CLI Docs: https://supabase.com/docs/guides/cli
- Migration Guide: https://supabase.com/docs/guides/cli/local-development#database-migrations
