-- Novaa Neo PostgreSQL Schema
-- Version 1.0 (for PostgreSQL-compatible systems like Neon)
-- This script creates all tables, functions, triggers, and indexes.

-- #####################################################################
-- SECTION 1: HELPER FUNCTION FOR 'updated_at'
-- This function automatically updates the 'updated_at' column on any row update.
-- #####################################################################

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;

$$
LANGUAGE plpgsql;


-- #####################################################################
-- SECTION 2: FOUNDATIONAL TABLES
-- #####################################################################

CREATE TABLE Users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    bio TEXT,
    profile_image_source_url VARCHAR(2048),
    profile_image_optimized_url VARCHAR(2048),
    gradient_colors JSONB,
    invited_by_user_id UUID REFERENCES Users(user_id),
    onboarded BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON Users
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();


CREATE TABLE CanonicalTags (
    tag_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- #####################################################################
-- SECTION 3: CORE LOGIC TABLES
-- #####################################################################

CREATE TABLE UserTags (
    user_tag_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(user_id),
    tag_id UUID NOT NULL REFERENCES CanonicalTags(tag_id),
    credibility_score BIGINT NOT NULL DEFAULT 0,
    follower_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, tag_id) -- Ensures a user can only have one instance of a canonical tag
);

CREATE TRIGGER set_timestamp_usertags
BEFORE UPDATE ON UserTags
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();


CREATE TABLE Stories (
    story_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_id VARCHAR(20) NOT NULL UNIQUE,
    author_id UUID NOT NULL REFERENCES Users(user_id),
    user_tag_id UUID NOT NULL REFERENCES UserTags(user_tag_id),
    story_type VARCHAR(20) NOT NULL,
    content TEXT,
    url VARCHAR(2048),
    title VARCHAR(255),
    original_story_id UUID REFERENCES Stories(story_id),
    commentary TEXT,
    upvotes BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT story_type_is_valid CHECK (story_type IN ('TEXT', 'URL', 'REPOST')),
    CONSTRAINT story_content_is_valid CHECK (
        (story_type = 'TEXT' AND content IS NOT NULL) OR
        (story_type = 'URL' AND url IS NOT NULL) OR
        (story_type = 'REPOST' AND original_story_id IS NOT NULL)
    )
);

CREATE TRIGGER set_timestamp_stories
BEFORE UPDATE ON Stories
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();


CREATE TABLE Comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES Stories(story_id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES Users(user_id),
    content TEXT NOT NULL,
    upvotes BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_timestamp_comments
BEFORE UPDATE ON Comments
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();


-- #####################################################################
-- SECTION 4: RELATIONSHIP & ENGAGEMENT TABLES
-- #####################################################################

CREATE TABLE UserTagFollows (
    follower_user_id UUID NOT NULL REFERENCES Users(user_id),
    followed_user_tag_id UUID NOT NULL REFERENCES UserTags(user_tag_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_user_id, followed_user_tag_id)
);

CREATE TABLE StoryUpvotes (
    story_id UUID NOT NULL REFERENCES Stories(story_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES Users(user_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (story_id, user_id)
);

CREATE TABLE CommentUpvotes (
    comment_id UUID NOT NULL REFERENCES Comments(comment_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES Users(user_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (comment_id, user_id)
);

CREATE TABLE StoryReports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES Stories(story_id) ON DELETE CASCADE,
    reporting_user_id UUID NOT NULL REFERENCES Users(user_id),
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- #####################################################################
-- SECTION 5: INDEXES
-- Secondary indexes for critical query performance.
-- #####################################################################

-- Indexes on Stories Table
CREATE INDEX idx_stories_author_id ON Stories(author_id);
CREATE INDEX idx_stories_user_tag_id ON Stories(user_tag_id);
CREATE INDEX idx_stories_story_type ON Stories(story_type);

-- Index on Comments Table (For fetching all comments for a story)
CREATE INDEX idx_comments_story_id ON Comments(story_id);

-- Index on StoryReports Table
CREATE INDEX idx_story_reports_reporting_user_id ON StoryReports(reporting_user_id);
$$
