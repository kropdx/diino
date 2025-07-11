# Diino Merge Plan  🚧

## Background and Motivation
We are building the Diino social-story platform described in `diino.md` with a real-time chat system using native Postgres/Supabase implementation.

### Architecture Decision: Native Supabase Chat ✅
- Built custom chat solution using Postgres + Supabase Realtime
- All chat functionality at `/home` route
- No external chat dependencies
- Full control over chat features and data

## Key Challenges and Analysis
- **Schema alignment** – Translate `diino.md` Prisma-style schema into Supabase SQL, removing Clerk references, ensuring proper FK & RLS.
- **Event fan-out** – Story → Edge Function → Native chat message
- **UI cohesion** – Chat interface needs a card renderer identical to story layout elsewhere; legacy component import strategy.
- **Migration safety** – Must rebuild dev DB from scratch; no prod data yet, so can iterate quickly.

## Scope Update After Reviewing old-code ✨
The `old-code/` directory contains the full Tiiny app (Next 15 + Prisma + Clerk). Key deltas vs current repo:
1. Extensive **React component library** (story cards, profile, sidebar, etc.) we can progressively port.
2. **Prisma ORM** layer & helper utilities.
3. Huge set of **API routes** hitting Prisma DB.
4. **Middleware & Auth** built around Supabase (already migrated) but still importing Prisma.

### Implications
- We will **remove Prisma** and migrate persistence to Supabase Postgres / SQL queries (or drizzle later).  Short-term we can keep Prisma types to speed porting but replace runtime.
- Clerk references already stripped; only legacy files in old-code referencing Prisma remain.
- UI components can largely be copied as-is; they import shadcn primitives which we already have.

## Revised High-level Task Breakdown

### Phase 1 – Database & RLS (completed ✅)
- [x] 1.1 Translate Tiiny schema to Supabase SQL (Tables listed in diino.md)
- [x] 1.2 Write migration `20250707000000_initial_diino.sql` under `supabase/migrations/`
- [x] 1.3 Add RLS policies per table (public read for stories, owner write, etc.)
- [x] 1.5 Verify locally with Supabase CLI & unit tests

### Phase 2 – Remove Prisma Layer (completed ✅)
- [x] 2.1 Delete `/old-code/src/lib/db.ts` and ORM usages (reference only)
- [x] 2.3 Generate TypeScript types from Supabase and add to repo

### Phase 3 – Edge Functions & Triggers (pending) 🚧
- [ ] 3.1 `story-to-chat` edge function to post story cards to native chat
- [ ] 3.2 `chat-reply-to-comment` edge function to sync chat replies as comments

### Phase 4 – API Routes Refactor
- [ ] 4.1 Port `stories` endpoints to Supabase (text/url/repost)
- [ ] 4.2 Port `user` endpoints (profile, tags) dropping Prisma patterns
- [ ] 4.3 Port `bookmark`, `upvote`, `follow` endpoints
- [ ] 4.4 Add `/api/chat/reply` that maps chat msg to comment

### Phase 5 – Front-end Integration
- [ ] 5.1 Wire Story composer toggle (chat vs story) – modify UI
- [ ] 5.2 Render story cards inside chat (Custom message renderer)
- [ ] 5.3 Port legacy pages sequentially: Profile → Tag view → Bookmarks → Settings/Trash

### Phase 6 – Cleanup & Tests
- [ ] 6.1 Remove unused legacy code
- [ ] 6.2 Jest / Playwright tests for RLS & API routes
- [ ] 6.3 Lighthouse + perf pass

## Native Supabase Chat Implementation (Completed) ✅

### Summary
Successfully built native chat/feed stored in Postgres with Supabase Realtime.

### Implementation Complete ✅
- Full real-time chat with optimistic updates and reconciliation
- Message persistence in Postgres with RLS
- 90-day retention via pg_cron
- Edge Function for rate-limiting and message validation
- Comprehensive stress testing tools
- Infinite scroll with smart pagination (50 messages per batch)
- Clickable @username mentions linking to profiles

### Performance Testing Capabilities
1. **UI Stress Test** (`/home/stress-test`)
   - Configurable burst testing (messages/concurrency)
   - Sustained load testing
   - Real-time latency measurement
   - Live metrics dashboard

2. **Console Utilities** (available on any page)
   ```javascript
   const tester = new ChatStressTester();
   await tester.runBurstTest({ messageCount: 100, concurrency: 10 });
   await tester.runSpikeTest(50); // 50 simultaneous messages
   await tester.measureRealtimeLatency(10);
   ```

### Key Learnings
1. **State closure issues** - React subscriptions can capture stale state; use functional updates
2. **RLS gotchas** - UPSERT tries SELECT first, can fail RLS; use INSERT with conflict handling
3. **Realtime setup** - Tables need explicit publication and replica identity for change streaming
4. **Client reconciliation** - Use client_id as primary key to handle optimistic updates cleanly
5. **Pagination best practices** - 50 messages per load, debounce scroll triggers, prevent rapid DB hits

## Project Status Board
- [x] Phase 1 – DB & RLS *(completed)*
- [x] Phase 2 – Remove Prisma Layer *(completed)*
- [ ] **Phase 3 – Edge Functions** *(current)*
- [ ] Phase 4 – API Routes
- [ ] Phase 5 – Front-end Integration
- [ ] Phase 6 – Polish

## Current Task: Phase 3 – Edge Functions

### 3.1 `story-to-chat` Edge Function (Active)
Create an edge function that:
1. Triggers on new Story inserts (via Postgres trigger)
2. Formats story data as a structured chat message
3. Inserts formatted message into `chat_messages` table
4. Includes story metadata for rendering story cards in chat

Implementation approach:
- Create Postgres trigger `AFTER INSERT ON "Story"`
- Trigger calls Edge Function via HTTP POST
- Edge Function formats story and inserts into chat
- Message includes special `message_type: 'story'` and story data in metadata

### 3.2 `chat-reply-to-comment`
Edge function to sync chat replies that reference stories back to the Comment table.
- Monitor chat messages for replies to story messages
- Extract story reference and create Comment record
- Maintain bidirectional sync between chat and comments

## Executor's Feedback or Assistance Requests
- ✅ Successfully built native chat solution from scratch
- ✅ Main page redirects to `/home` 
- ✅ Navigation simplified to single Home link
- ✅ All external chat dependencies removed
- ✅ Fixed build errors (missing autoprefixer)
- 🛠️ Eliminated TypeScript diagnostics in `supabase/functions/send-message` by adding a `deno.json` import map, VSCode Deno settings, and refactored import specifiers.
- 🛠️ Updated tag displays in story cards to link to `/${username}/${tagName}` in both tag feed and user-tag pages.
- Ready to implement `story-to-chat` edge function for story/chat integration

## Lessons
*(collect recurring gotchas here)*

### Guidance from User (2025-07-07)
> We will **not** run any legacy code.  Use old-code only for reference.  Copy UI/UX primitives (layout, components).  Re-implement data access fresh against Supabase.  Work feature-by-feature, test each before next.

### Native Chat Decision (2025-07-08)
> Built our own chat solution using Postgres + Supabase Realtime. Full control over features and data.

### Route Rename (2025-07-08)
> Renamed `/chat` route to `/home` to better reflect its purpose as the main landing page after login. 

# Diino Project - Multi-Agent System Scratchpad

## Background and Motivation
We are building Diino, a social storytelling platform with real-time chat functionality. The system uses Supabase for authentication, database, and real-time features. The tech stack includes Next.js, TypeScript, Tailwind CSS, and Radix UI components.

### Current Implementation Status
1. Successfully removed all Stream Chat dependencies and components
2. Migrated from /chat to /home routes
3. Implemented native Supabase chat with PostgreSQL
4. Fixed build errors and server is running on http://localhost:3000
5. **NEW**: Implemented tag creation system (required for posting stories)
6. **NEW**: Created `/post` page with story creation
7. **NEW**: Enhanced profile page with tag management

### Tag System Implementation (Just Completed)
- Created `/api/tags` route for fetching and creating tags
- Built `TagManager` component for UI
- Added to home page above chat section
- Created RLS policies migration (needs to be applied)
- Tags follow the two-table structure:
  - `CanonicalTag` - Global registry of unique tag names
  - `UserTag` - User's ownership/association with tags

### Post Creation Implementation (Just Completed)
- Created `/post` page with NaviBar component
- Ported NaviBar from old code with Supabase adaptations
- Created `/api/stories` route for story creation
- Created `/api/fetch-url` route for URL metadata (simple version)
- Added "Create Post" to sidebar navigation
- Profile page now shows TagManager for own profile
- Profile page includes "Create a Post" button

## Project Status Board

### Completed ✅
- [x] Remove all Stream Chat dependencies
- [x] Rename /chat route to /home
- [x] Fix build errors
- [x] Implement tag creation system
- [x] Create /post page for story creation
- [x] Update profile page with tag management

### To Do
- [ ] Apply tag RLS policies migration to enable tag creation
- [ ] Test the posting functionality end-to-end
- [ ] Phase 3.1: Create `story-to-chat` edge function
- [ ] Phase 3.2: Create `like-story` edge function  
- [ ] Phase 4.1: Implement story listing/display
- [ ] Phase 4.2: Add story interactions (like, bookmark, repost)