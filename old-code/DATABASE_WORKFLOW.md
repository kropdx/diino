# Database Change Workflow

## For Schema Changes (Tables, Columns, etc.)

1. **Modify your schema.prisma file**

   ```prisma
   model User {
     // Add new field
     avatarUrl String?
   }
   ```

2. **Create a migration**

   ```bash
   npx prisma migrate dev --name add_avatar_url
   ```

   This creates a new file in `/prisma/migrations/`

3. **Push to GitHub**
   The migration file is committed with your code

4. **Deploy to Vercel**
   The build script automatically runs `prisma migrate deploy`
   Your changes are applied to production!

## For Supabase-Specific Changes (RLS, Policies, Triggers)

1. **Create a new SQL file**

   ```bash
   # Name it with timestamp for ordering
   touch supabase/migrations/20250706_add_user_policy.sql
   ```

2. **Write your SQL**

   ```sql
   -- Add new policy
   CREATE POLICY "Users can view profiles with public flag" ON "User"
     FOR SELECT USING (is_public = true OR auth_id = auth.uid());
   ```

3. **Test locally**

   ```bash
   # Run against dev database
   npx supabase db push
   ```

4. **After deploy, run manually**
   - Option A: Supabase Dashboard SQL Editor
   - Option B: Create a post-deploy script
   - Option C: Use GitHub Actions for automated migrations

## Automated Approach (Recommended)

Create a GitHub Action that runs after Vercel deploy:

```yaml
name: Run Supabase Migrations
on:
  push:
    branches: [main]
    paths:
      - 'supabase/migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
        run: |
          npm install
          node scripts/execute-migrations.mjs
```

## Key Points

- ✅ **Prisma migrations** = Automatic on deploy
- ❌ **Supabase features** = Manual or automated via CI/CD
- 📁 **All changes tracked in Git** = Version controlled
- 🔄 **Same files work in dev & prod** = Consistency

## Example Workflow

1. Add a new feature requiring a column AND a policy:

   ```bash
   # 1. Update schema.prisma
   # 2. Create Prisma migration
   npx prisma migrate dev --name add_is_public_field

   # 3. Create Supabase migration
   echo "CREATE POLICY..." > supabase/migrations/20250706_add_public_policy.sql

   # 4. Commit both
   git add .
   git commit -m "Add public profile feature"

   # 5. Push (Prisma runs automatically, Supabase needs manual run)
   git push
   ```

Remember: Prisma handles structure, Supabase handles security!
