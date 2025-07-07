# Supabase Authentication Test Checklist

## Pre-Testing Setup

- [x] Development server running on http://localhost:3000
- [x] Build completes successfully
- [ ] SQL migrations run in Supabase dashboard:
  - [ ] 001_create_user_trigger.sql
  - [ ] 002_row_level_security.sql

## Authentication Flows

### 1. Sign Up Flow

- [ ] Navigate to /sign-up
- [ ] Test email/password registration
  - [ ] Valid email format required
  - [ ] Password meets requirements
  - [ ] User created in auth.users table
  - [ ] Trigger creates User record in public.User table
- [ ] Test Google OAuth sign up
  - [ ] Redirects to Google
  - [ ] Returns to callback URL
  - [ ] User created in both tables

### 2. Sign In Flow

- [ ] Navigate to /sign-in
- [ ] Test email/password login
  - [ ] Successful login redirects to home
  - [ ] Session cookie is set
  - [ ] User data available in app
- [ ] Test Google OAuth login
  - [ ] Existing user can sign in
  - [ ] Session established

### 3. Session Management

- [ ] Refresh page maintains session
- [ ] Session persists across browser restart
- [ ] Middleware correctly protects routes
- [ ] Public routes accessible without auth
- [ ] Protected routes redirect to sign-in

### 4. User Operations

- [ ] /settings shows current user info
- [ ] Can update user profile
- [ ] Onboarding flow for new users
- [ ] Username validation works

### 5. API Endpoints

- [ ] GET /api/user/me returns current user
- [ ] POST /api/user/onboard updates user
- [ ] GET /api/stories respects auth
- [ ] POST /api/stories requires auth
- [ ] All other API routes check auth

### 6. Database Operations

- [ ] RLS policies prevent unauthorized access
- [ ] Users can only modify their own data
- [ ] Stories respect author relationships
- [ ] Comments tied to authenticated user

### 7. Edge Cases

- [ ] Sign out clears session completely
- [ ] Invalid tokens handled gracefully
- [ ] Database connection errors handled
- [ ] Rate limiting on auth endpoints

## Post-Testing Cleanup

- [ ] Remove test users from database
- [ ] Check for any error logs
- [ ] Verify no sensitive data exposed
