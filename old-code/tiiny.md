# Tiiny - Application & Database Schema Documentation

**Version:** 1.0
**Database:** PostgreSQL
**Last Updated:** June 27, 2025

## 1. Application Overview: What is Tiiny?

Tiiny is a next-generation social content platform designed to prioritize **user-curated interests, expertise, and reputation** over simple personality-driven follows. The core mission of Tiiny is to create a high-signal environment where users can discover and share quality content on any topic imaginable, from highly specific niches to broad subjects.

It achieves this through a unique social architecture that combines elements of a blogging platform, a social bookmarking site (like Pinterest or Delicious), and a reputation system.

### Core Concepts

- **The Social Model is "Follow Interests, Not Just People":** This is the platform's defining feature.
  - **User-Owned Tags:** When a user wants to post about a topic (e.g., "Vintage Watches"), they create their own personal instance of that tag. This effectively becomes their personal, subscribable channel or "magazine" on that topic.
  - **Hyper-Focused Following:** Other users can discover and choose to follow this specific user's "Vintage Watches" channel. This allows for the creation of a home feed that is precisely tailored, drawing content from various experts on various topics, rather than seeing everything a single person posts. A user's feed is a rich mosaic composed of the hundreds of individual User-Tags they follow.

- **The Reputation Engine Rewards Expertise:**
  - **Per-Topic Credibility:** A user's reputation is not a single global score. Instead, they build a `credibility_score` on each specific `UserTag` they own. A user can be a highly credible source on "Baking" while being a novice in "Cryptocurrency."
  - **Community Validation:** Credibility is earned through community engagement, such as upvotes on high-quality stories and comments within that tag, establishing a meritocratic system where knowledgeable voices are elevated.

- **Content Model Encourages Curation and Originality:**
  - **Text Stories:** Users can write and publish their own original, long-form thoughts and articles.
  - **URL Stories:** Users can share links to external content. The system is designed to encourage adding `commentary`, promoting a culture of value-add curation.
  - **Reposts:** A core social mechanic where a user can share another Tiiny story to their own User-Tag. This acts as a powerful endorsement, exposing quality content to new audiences and allowing it to spread virally through different interest graphs. Reposters can add their own optional commentary.

- **Community and Identity:**
  - The platform supports rich user profiles, including a unique visual identity through customizable username color gradients.
  - An invite-based system (`invited_by_user_id`) fosters controlled, community-vouched growth.
  - A robust moderation system allows users to report stories, and a detailed upvoting system tracks engagement on both stories and comments.

---

## 2. PostgreSQL Database Schema - Detailed Field Explanations

This section provides a field-by-field breakdown of each table in the Tiiny PostgreSQL database.

### `Users` Table

**Purpose:** Stores all user profile, authentication, and preference information.

| Column Name                   | Data Type       | Explanation                                                                                                                           |
| :---------------------------- | :-------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| `user_id`                     | `UUID`          | **Primary Key.** A unique identifier for the user, automatically generated.                                                           |
| `clerk_id`                    | `VARCHAR(255)`  | The unique ID from the Clerk.com authentication provider. Marked `NOT NULL UNIQUE`.                                                   |
| `username`                    | `VARCHAR(50)`   | The user's unique, public-facing username. Marked `NOT NULL UNIQUE`.                                                                  |
| `email`                       | `VARCHAR(255)`  | The user's unique email address. Marked `NOT NULL UNIQUE`.                                                                            |
| `display_name`                | `VARCHAR(100)`  | The user's optional, non-unique display name.                                                                                         |
| `bio`                         | `TEXT`          | A long-form text field for the user's profile biography.                                                                              |
| `profile_image_source_url`    | `VARCHAR(2048)` | The URL to the original, high-resolution source profile image uploaded by the user.                                                   |
| `profile_image_optimized_url` | `VARCHAR(2048)` | The URL to the Imgix (or other service) optimized version of the profile image for fast display.                                      |
| `gradient_colors`             | `JSONB`         | A JSONB object/array storing the HSL color values for the user's name gradient. `JSONB` is efficient for storage and can be indexed.  |
| `invited_by_user_id`          | `UUID`          | A self-referencing **Foreign Key** to the `user_id` of the person who invited this user. Can be `NULL` for users who weren't invited. |
| `onboarded`                   | `BOOLEAN`       | A flag indicating if the user has completed the initial onboarding process. Defaults to `false`.                                      |
| `created_at`                  | `TIMESTAMPTZ`   | The timestamp (with timezone) of when the user account was created. Defaults to the current time.                                     |
| `updated_at`                  | `TIMESTAMPTZ`   | The timestamp of the last update to the user's record. Automatically updated by a database trigger.                                   |

### `CanonicalTags` Table

**Purpose:** Stores the unique, master list of all tag names to ensure consistency.

| Column Name  | Data Type      | Explanation                                                                             |
| :----------- | :------------- | :-------------------------------------------------------------------------------------- |
| `tag_id`     | `UUID`         | **Primary Key.** A unique identifier for the canonical tag name.                        |
| `name`       | `VARCHAR(100)` | The unique, normalized (e.g., all lowercase) name of the tag. Marked `NOT NULL UNIQUE`. |
| `created_at` | `TIMESTAMPTZ`  | The timestamp of when this tag name was first added to the system.                      |

### `UserTags` Table

**Purpose:** The core logic table representing a specific user's instance of a tag, holding their personal reputation for that topic.

| Column Name         | Data Type                  | Explanation                                                                                       |
| :------------------ | :------------------------- | :------------------------------------------------------------------------------------------------ |
| `user_tag_id`       | `UUID`                     | **Primary Key.** The unique identifier for this specific user-tag instance.                       |
| `user_id`           | `UUID`                     | **Foreign Key** to the `Users` table, identifying the owner. Marked `NOT NULL`.                   |
| `tag_id`            | `UUID`                     | **Foreign Key** to the `CanonicalTags` table, identifying the tag's name. Marked `NOT NULL`.      |
| `credibility_score` | `BIGINT`                   | The credibility score this user has for this topic. Defaults to `0`.                              |
| `follower_count`    | `BIGINT`                   | A denormalized counter for the number of users following this specific user-tag. Defaults to `0`. |
| `created_at`        | `TIMESTAMPTZ`              | The timestamp of when the user first created their instance of this tag.                          |
| `updated_at`        | `TIMESTAMPTZ`              | The timestamp of the last update. Automatically updated by a database trigger.                    |
| _Constraint_        | `UNIQUE (user_id, tag_id)` | A unique constraint ensuring a user cannot own two instances of the same canonical tag.           |

### `Stories` Table

**Purpose:** The central content table for all posts.

| Column Name         | Data Type       | Explanation                                                                                                 |
| :------------------ | :-------------- | :---------------------------------------------------------------------------------------------------------- |
| `story_id`          | `UUID`          | **Primary Key.** A unique identifier for the story.                                                         |
| `short_id`          | `VARCHAR(20)`   | A unique, short, shareable ID for use in URLs (e.g., `tiiny.com/s/short_id`). Marked `NOT NULL UNIQUE`.     |
| `author_id`         | `UUID`          | **Foreign Key** to `Users`. This is the creator of THIS row (the original author or the reposter).          |
| `user_tag_id`       | `UUID`          | **Foreign Key** to `UserTags`. The specific user-tag instance this story was posted under.                  |
| `story_type`        | `VARCHAR(20)`   | A discriminator defining the post type. Must be one of 'TEXT', 'URL', or 'REPOST'.                          |
| `content`           | `TEXT`          | The body text for a 'TEXT' type story. `NULL` for other types.                                              |
| `url`               | `VARCHAR(2048)` | The external link for a 'URL' type story. `NULL` for other types.                                           |
| `title`             | `VARCHAR(255)`  | The optional title for a story, often used for 'URL' types.                                                 |
| `original_story_id` | `UUID`          | **Foreign Key** to `Stories`. For 'REPOST' types, this links to the original story. `NULL` for other types. |
| `commentary`        | `TEXT`          | Optional text provided by a user, typically on a 'REPOST' or 'URL' story.                                   |
| `upvotes`           | `BIGINT`        | A denormalized counter for fast reads of the total upvote count. Defaults to `0`.                           |
| `created_at`        | `TIMESTAMPTZ`   | The timestamp of when the story was posted.                                                                 |
| `updated_at`        | `TIMESTAMPTZ`   | The timestamp of the last update. Automatically updated by a database trigger.                              |

### `Comments` Table

**Purpose:** Stores all user-submitted comments on stories.

| Column Name  | Data Type     | Explanation                                                                                                                                                                                                            |
| :----------- | :------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `comment_id` | `UUID`        | **Primary Key.** A unique identifier for the comment.                                                                                                                                                                  |
| `story_id`   | `UUID`        | **Foreign Key** to `Stories`. Identifies the parent story. An index on this column ensures fast retrieval of a story's comments. `ON DELETE CASCADE` means if the story is deleted, all its comments are also deleted. |
| `author_id`  | `UUID`        | **Foreign Key** to `Users` for the comment's author.                                                                                                                                                                   |
| `content`    | `TEXT`        | The text content of the comment.                                                                                                                                                                                       |
| `upvotes`    | `BIGINT`      | A denormalized counter for the number of upvotes on the comment.                                                                                                                                                       |
| `created_at` | `TIMESTAMPTZ` | The timestamp of when the comment was posted.                                                                                                                                                                          |
| `updated_at` | `TIMESTAMPTZ` | The timestamp of the last update. Automatically updated by a database trigger.                                                                                                                                         |

### `UserTagFollows` Table

**Purpose:** A join table tracking who follows which specific UserTag instance.

| Column Name            | Data Type     | Explanation                                                                       |
| :--------------------- | :------------ | :-------------------------------------------------------------------------------- |
| `follower_user_id`     | `UUID`        | **Primary Key, Foreign Key** to `Users`. The user doing the following.            |
| `followed_user_tag_id` | `UUID`        | **Primary Key, Foreign Key** to `UserTags`. The user-tag instance being followed. |
| `created_at`           | `TIMESTAMPTZ` | The timestamp of when the follow relationship was established.                    |

### `StoryUpvotes` Table

**Purpose:** Tracks each individual upvote on a story to prevent duplicates and for auditing.

| Column Name  | Data Type     | Explanation                                                          |
| :----------- | :------------ | :------------------------------------------------------------------- |
| `story_id`   | `UUID`        | **Primary Key, Foreign Key** to `Stories`. `ON DELETE CASCADE`.      |
| `user_id`    | `UUID`        | **Primary Key, Foreign Key** to `Users`. The user who cast the vote. |
| `created_at` | `TIMESTAMPTZ` | The timestamp of when the vote was cast.                             |

### `CommentUpvotes` Table

**Purpose:** Tracks each individual upvote on a comment.

| Column Name  | Data Type     | Explanation                                                          |
| :----------- | :------------ | :------------------------------------------------------------------- |
| `comment_id` | `UUID`        | **Primary Key, Foreign Key** to `Comments`. `ON DELETE CASCADE`.     |
| `user_id`    | `UUID`        | **Primary Key, Foreign Key** to `Users`. The user who cast the vote. |
| `created_at` | `TIMESTAMPTZ` | The timestamp of when the vote was cast.                             |

### `StoryReports` Table

**Purpose:** Logs moderation reports filed by users against stories.

| Column Name         | Data Type     | Explanation                                                                               |
| :------------------ | :------------ | :---------------------------------------------------------------------------------------- |
| `report_id`         | `UUID`        | **Primary Key.** A unique identifier for this specific report instance.                   |
| `story_id`          | `UUID`        | **Foreign Key** to `Stories`. The story being reported. `ON DELETE CASCADE`.              |
| `reporting_user_id` | `UUID`        | **Foreign Key** to `Users`. The user who filed the report.                                |
| `reason`            | `TEXT`        | The optional reason provided by the user for the report.                                  |
| `status`            | `VARCHAR(50)` | The moderation status of the report (e.g., 'PENDING', 'REVIEWED'). Defaults to 'PENDING'. |
| `created_at`        | `TIMESTAMPTZ` | The timestamp of when the report was filed.                                               |
