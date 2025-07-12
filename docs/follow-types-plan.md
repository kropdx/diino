# Follow System Enhancements – Technical Plan

*Author: Planner*

---
## 1  Overview
We will extend Diino’s follow model to support three distinct modes:

| Mode | Behaviour |
|------|-----------|
| **Follow-Tag** | _Current behaviour_ – follower subscribes to one specific tag owned by another user.  Stored in `UserTagFollow`. |
| **Follow-All** | Follower receives **every** post from the author, across **all** tags, including tags the author creates in the future. |
| **Follow-All-Except** | Same as Follow-All **except** the follower may specify an exclusion list of tag IDs they do **not** want. |

This document details schema additions, RLS, API design, query patterns, and migration steps for the initial **Follow-All** implementation, while laying groundwork for the other modes.

---
## 2  Database Schema

### 2.1  `UserFollow` table
```sql
create table public."UserFollow" (
  follower_user_id  uuid references public."User"(user_id) on delete cascade,
  followed_user_id  uuid references public."User"(user_id) on delete cascade,
  mode              text check (mode in ('ALL','ALL_EXCEPT')) not null default 'ALL',
  exclude_tag_ids   uuid[] default '{}',    -- only used for ALL_EXCEPT
  created_at        timestamptz default now(),
  primary key (follower_user_id, followed_user_id)
);

create index idx_userfollow_follower on public."UserFollow"(follower_user_id);
create index idx_userfollow_followed on public."UserFollow"(followed_user_id);
```

### 2.2  Row-Level Security
```sql
alter table public."UserFollow" enable row level security;

-- A user can manage (select/insert/update/delete) his own follow rows
create policy "User manages own follows" on public."UserFollow"
  using (follower_user_id = auth.uid())
  with check (follower_user_id = auth.uid());
```

### 2.3  Materialised View (optional, future)
For large-scale optimisation we can create `vw_followed_user_tag_ids` which resolves *Follow-All* rows into concrete `(follower_user_id, user_tag_id)` pairs.  Triggers:
* **After INSERT/DELETE** on `UserFollow`
* **After INSERT** on `UserTag` (author creates new tag)

> **Start simple:** ship without this view; add only if feed latency dictates.

---
## 3  API Design

### 3.1  Routes
| Method | Route | Body / Params | Function |
|--------|-------|---------------|----------|
| **POST** | `/api/follows/user` | `{ followedUserId: UUID, mode?: 'ALL' | 'ALL_EXCEPT', excludeTagIds?: UUID[] }` | Upsert a row in `UserFollow`.  Removes redundant per-tag follows. |
| **DELETE** | `/api/follows/user/:followedUserId` | – | Delete the row, optionally cleanup `UserTagFollow`. |
| **POST** | `/api/follows/tag` | *(existing)* | unchanged |

### 3.2  Controller Logic (Follow-All)
1. **Validation** – cannot follow oneself.
2. **Upsert** `UserFollow` (`mode = 'ALL'`) returning row.
3. **Cleanup** – `delete from "UserTagFollow"` where follower = current user and tag.owner = followed user (prevents duplicates).
4. Respond `200`.

---
## 4  Feed Query Changes
### 4.1  Baseline (no materialised view)
```sql
with author_ids as (
  select followed_user_id
  from public."UserFollow"
  where follower_user_id = :viewer
    and mode = 'ALL'
)
select s.*
from public."Story" s
where s.author_id in (select followed_user_id from author_ids)
order by s.created_at desc
limit 50;
```
*Requires index* `create index idx_story_author_created on "Story"(author_id, created_at desc);`

### 4.2  Including per-tag follows
Union with current tag follow logic:
```sql
select * from stories_from_all
union all
select * from stories_from_tag_follows
order by created_at desc
limit 50;
```

### 4.3  Scalability Notes
* PostgreSQL IN-list is efficient for O(≤1k) author IDs.
* If p95 latency exceeds threshold, migrate to materialised view approach.

---
## 5  Front-End / UX
1. **Profile Page** – new button group:
   * “Follow All”  → POST `/api/follows/user`
   * “Unfollow”    → DELETE `/api/follows/user/...`
2. **State Hook** – FE keeps `isFollowingAll` boolean.
3. **Tag chips** – if user is already in Follow-All mode, hide “follow tag” toggles or show disabled state.

---
## 6  Migration Plan
1. **Create migration** `20250712000000_user_follow.sql` with schema + RLS + indexes.
2. **Deploy** to Supabase dev → run `supabase migration up`.
3. **Implement API routes** under `app/api/follows/user`.
4. **Add FE buttons** with optimistic updates.
5. **Test**
   * Unit tests for API.
   * Manual: create second account, follow all, create new tag on author → ensure follower feed auto-shows posts.
6. **Benchmark** feed query latency (pg_stat_statements).

---
## 7  Complexity / Effort Estimates
| Task | Time |
|------|------|
| DB migration & RLS | 0.5 day |
| API implementation | 0.5 day |
| Front-end integration | 0.5 day |
| Feed query refactor + tests | 0.5 day |
| **Total** | **2 dev-days** |

---
## 8  Future Work (ALL_EXCEPT & View Optimisation)
* Extend API to accept `mode = 'ALL_EXCEPT'` and `excludeTagIds`.
* Add exclusion logic in feed query `and s.user_tag_id <> all(:exclude_ids)`.
* Implement materialised view + triggers when follower counts grow.

---
*Planner document finished – ready for stakeholder review.* 