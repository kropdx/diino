# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Diino is a real-time chat application built with Next.js 15 (App Router), TypeScript, Supabase, and Tailwind CSS. It provides authenticated real-time messaging with a modern UI using shadcn/ui components.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

Note: No test framework is currently configured. When tests are added, update this file with test commands.

## Architecture

### Tech Stack
- **Frontend**: Next.js 15.3.5 with App Router, React 19, TypeScript 5.8.3
- **Styling**: Tailwind CSS 3.4.17 with shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth) + Stream Chat (messaging)
- **Chat**: Stream Chat React SDK for real-time messaging
- **State**: React hooks (no external state management)

### Key Patterns
- **Server Components** for initial data fetching and auth checks
- **Client Components** for interactive UI (chat interface)
- **Middleware** at `/middleware.ts` handles authentication protection
- **Path Alias**: `@/*` maps to project root

### Project Structure
- `/app` - Next.js App Router pages and layouts
  - `/(auth)` - Authentication group route (login, signup, logout)
  - `/page.tsx` - Main chat interface
- `/components` - React components
  - `/ui` - Reusable shadcn/ui components
  - `/ChatInterface.tsx` - Main chat component
- `/lib` - Utilities and configurations
  - `/supabase` - Supabase client setup
  - `/utils.ts` - Utility functions

### Database Schema
Single `messages` table with:
- `id` (UUID primary key)
- `user_id` (references auth.users)
- `content` (text)
- `user_email` (text)
- `created_at` (timestamp)
- Row Level Security enabled
- Real-time subscriptions configured

## Environment Setup

Required environment variables in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
```

## Key Implementation Details

### Authentication Flow
1. Middleware (`/middleware.ts`) protects routes requiring authentication
2. Login/signup handled in `/(auth)` group routes
3. Supabase Auth manages sessions
4. Logout is a server action at `/app/(auth)/logout/route.ts`

### Real-time Messaging (Stream Chat)
1. `StreamChatInterface.tsx` initializes Stream Chat client with user authentication
2. Users are automatically synced with Stream Chat on signup
3. Token generation handled by `/api/stream/token` endpoint
4. Messages are managed by Stream Chat's infrastructure
5. Built-in features: typing indicators, read receipts, threads, reactions

### Styling Approach
- Tailwind CSS utilities with CSS variables for theming
- shadcn/ui components for consistent UI patterns
- Dark mode support via class strategy
- Custom theme colors defined in `tailwind.config.ts`