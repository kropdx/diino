# Database Setup Guide

## Overview
This document describes the database setup requirements for Diino after a fresh installation or reset.

## Required Initial Data

### Chat System
The application expects the following chat rooms to exist:

1. **Global Chat Room**
   - ID: `00000000-0000-0000-0000-000000000001`
   - Name: "Global Chat"
   - This is hardcoded in `app/home/page.tsx`

## Database Reset Process

When resetting the database:

```bash
# Reset the database (this will run all migrations including initial data)
supabase db reset --linked
```

This will:
1. Drop all existing data
2. Run all migrations in order
3. Seed initial data (including the global chat room)

## Post-Reset Checklist

After resetting the database:

1. ✅ Global chat room exists (created by migration)
2. ✅ RLS policies are enabled (created by migrations)
3. ✅ User table has proper policies for onboarding
4. ✅ Chat tables have proper RLS policies
5. ❌ No users exist - first user must sign up and complete onboarding

## Known Issues Fixed

1. **Chat room foreign key error**: Fixed by ensuring global chat room is created in initial data migration
2. **Username trigger error**: Removed problematic `set_message_username` trigger that referenced non-existent column
3. **User onboarding**: Fixed RLS policies to allow username checking and profile updates

## Environment Variables Required

Ensure these are set in your `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 