# Supabase Migration Plan (Database + Auth)

## Executive Summary

This document outlines a comprehensive plan to migrate Tiiny.space from Neon PostgreSQL + Clerk Auth to Supabase (database + authentication). Since existing data can be discarded, we'll focus on schema migration and authentication system replacement.

## Current State vs Target State

### Current

- **Database**: Neon PostgreSQL
- **Auth**: Clerk (webhook-based)
- **User Sync**: Webhook creates DB records
- **Protected Routes**: Clerk middleware
- **OAuth**: Google via Clerk

### Target

- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **User Sync**: Automatic (same DB)
- **Protected Routes**: Supabase RLS + middleware
- **OAuth**: Google via Supabase

## Migration Strategy

### Phase 1: Planning & Setup (Week 1)

#### 1.1 Supabase Project Setup

```bash
# Create projects
- [ ] Create development Supabase project
- [ ] Create production Supabase project
- [ ] Enable Google OAuth in Supabase Dashboard
- [ ] Configure redirect URLs
```

#### 1.2 Schema Modifications

```sql
-- Current schema uses clerkId, we'll need to adapt for Supabase
-- Option 1: Keep existing schema, map auth.uid() to clerkId field
-- Option 2: Modify schema to use Supabase patterns (recommended)

-- Example modifications needed:
ALTER TABLE "User" ADD COLUMN supabase_id UUID;
ALTER TABLE "User" ADD CONSTRAINT fk_supabase_user
  FOREIGN KEY (supabase_id) REFERENCES auth.users(id);
```

#### 1.3 Environment Variables

```env
# New variables needed
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Remove these
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
```

### Phase 2: Code Migration (Week 1-2)

#### 2.1 Install Supabase Dependencies

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm uninstall @clerk/nextjs
```

#### 2.2 Create Supabase Client

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );
}
```

#### 2.3 Replace Middleware

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const protectedPaths = ['/', '/home', '/bookmarks', '/settings'];
  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/lock', request.url));
  }

  // Redirect authenticated users away from auth pages
  const authPaths = ['/sign-in', '/sign-up', '/lock'];
  const isAuthPage = authPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isAuthPage && user && !user.user_metadata?.onboarded) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  if (isAuthPage && user && user.user_metadata?.onboarded) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return response;
}
```

#### 2.4 Auth Component Updates

**Replace ClerkProvider in layout.tsx:**

```typescript
// src/app/layout.tsx
import { createClient } from '@/lib/supabase/server'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Update Sign-in Page:**

```typescript
// src/app/sign-in/[[...sign-in]]/page.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      router.push('/home');
    }
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  // ... rest of UI
}
```

#### 2.5 API Route Updates

**Replace Clerk webhook with Supabase trigger:**

```sql
-- In Supabase SQL editor
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."User" (id, email, "createdAt", onboarded)
  VALUES (
    gen_random_uuid(),
    NEW.email,
    NOW(),
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Update auth helpers:**

```typescript
// src/lib/auth-helpers.ts
import { createClient } from '@/lib/supabase/server';

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get full user data from database
  const { data: dbUser } = await supabase.from('User').select('*').eq('email', user.email).single();

  return dbUser;
}
```

### Phase 3: Database Migration (Week 2)

#### 3.1 Schema Adjustments

```sql
-- Remove Clerk-specific fields
ALTER TABLE "User" DROP COLUMN "clerkId";

-- Add Supabase auth reference
ALTER TABLE "User" ADD COLUMN auth_id UUID REFERENCES auth.users(id);

-- Update to use Supabase user IDs
UPDATE "User" SET auth_id = auth.users.id
FROM auth.users
WHERE "User".email = auth.users.email;
```

#### 3.2 Enable RLS

```sql
-- Enable RLS on all tables
ALTER TABLE "Story" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserTag" ENABLE ROW LEVEL SECURITY;

-- Example policies
CREATE POLICY "Users can view public stories" ON "Story"
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own stories" ON "Story"
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own stories" ON "Story"
  FOR UPDATE USING (user_id = auth.uid());
```

### Phase 4: Testing (Week 3)

#### 4.1 Component Testing Checklist

- [ ] Sign up flow (email/password)
- [ ] Sign up flow (Google OAuth)
- [ ] Sign in flow (email/password)
- [ ] Sign in flow (Google OAuth)
- [ ] Password reset flow
- [ ] Onboarding flow
- [ ] Protected route access
- [ ] User profile updates
- [ ] Sign out functionality

#### 4.2 API Testing Checklist

- [ ] Story creation with auth
- [ ] Tag management
- [ ] User data fetching
- [ ] Upvote/bookmark functionality
- [ ] Comment system

#### 4.3 Migration Testing

```bash
# Test database migration
npm run db:migrate:dev

# Run all tests
npm test

# Test auth flows manually
npm run dev
```

### Phase 5: Deployment (Week 3-4)

#### 5.1 Pre-deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured in Vercel
- [ ] Supabase production project configured
- [ ] OAuth redirect URLs updated
- [ ] RLS policies reviewed

#### 5.2 Deployment Steps

1. **Deploy to staging**

   ```bash
   vercel --env preview
   ```

2. **Test all critical paths**

3. **Deploy to production**
   ```bash
   vercel --prod
   ```

#### 5.3 Post-deployment

- [ ] Monitor error logs
- [ ] Check auth success rates
- [ ] Verify database performance
- [ ] Remove Clerk from billing

## File Change Summary

### Files to Delete

- `/src/app/api/webhooks/clerk/route.ts`
- Any Clerk-specific components

### Files to Create

- `/src/lib/supabase/client.ts`
- `/src/lib/supabase/server.ts`
- `/src/app/auth/callback/route.ts`

### Files to Modify (Major Changes)

- `/src/middleware.ts` - Complete rewrite
- `/src/app/layout.tsx` - Remove ClerkProvider
- `/src/lib/auth-helpers.ts` - New auth logic
- `/src/app/sign-in/[[...sign-in]]/page.tsx` - New auth UI
- `/src/app/sign-up/[[...sign-up]]/page.tsx` - New auth UI
- `/src/app/onboarding/page.tsx` - Update user creation
- All API routes - Update auth checks

## Migration Commands Reference

```bash
# 1. Install dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/ssr
npm uninstall @clerk/nextjs

# 2. Export schema from Neon
pg_dump --schema-only --no-owner --no-privileges $NEON_DATABASE_URL > schema.sql

# 3. Modify schema for Supabase
# Edit schema.sql to remove clerkId, add auth_id

# 4. Import to Supabase
psql $SUPABASE_URL < schema.sql

# 5. Apply RLS policies
psql $SUPABASE_URL < rls-policies.sql

# 6. Run migrations
DATABASE_URL=$SUPABASE_URL prisma migrate deploy

# 7. Test locally
npm run dev

# 8. Deploy
vercel --prod
```

## Timeline Summary

- **Week 1**: Setup & Initial Code Migration
- **Week 2**: Complete Code Migration & Database Setup
- **Week 3**: Testing & Bug Fixes
- **Week 4**: Deployment & Monitoring

Total estimated time: **3-4 weeks** for complete migration

## Rollback Plan

If issues arise:

1. Revert environment variables to Clerk
2. Revert code changes via Git
3. Point back to Neon database
4. Redeploy previous version

## Benefits After Migration

1. **Unified Platform** - Auth and database in one place
2. **Cost Savings** - Single billing, included auth
3. **Better Performance** - No webhook delays
4. **Native Features** - RLS, real-time, edge functions
5. **Simpler Architecture** - No user sync needed
