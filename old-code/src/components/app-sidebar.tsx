'use client';

import {
  Home,
  User,
  Settings,
  Moon,
  Sun,
  Hash,
  ChevronDown,
  ChevronRight,
  Bookmark,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { NavUser } from '@/components/nav-user';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TagWithSubtags {
  id: string;
  tagName: string;
  subtags: string[];
}

// Simple cache to prevent re-fetching tags on every navigation
const tagsCache = new Map<string, { data: TagWithSubtags[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface AppSidebarProps {
  username?: string;
}

export interface AppSidebarRef {
  refreshTags: () => void;
}

export const AppSidebar = forwardRef<AppSidebarRef, AppSidebarProps>(({ username }, ref) => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [tags, setTags] = useState<TagWithSubtags[]>([]);
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  // Fetch user's tags with subtags (memoized to prevent unnecessary re-fetching)
  const fetchTags = useCallback(async () => {
    if (!username) {
      setTags([]);
      return;
    }

    // Check cache first
    const cacheKey = username;
    const cached = tagsCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      setTags(cached.data);
      return; // Use cached data, skip loading state
    }

    setIsLoadingTags(true);
    try {
      const response = await fetch('/api/user/tags-with-subtags');
      if (response.ok) {
        const data = await response.json();
        setTags(data);
        // Cache the result
        tagsCache.set(cacheKey, { data, timestamp: now });
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setIsLoadingTags(false);
    }
  }, [username]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Expose refresh function to parent
  useImperativeHandle(ref, () => ({
    refreshTags: () => {
      // Clear cache for this user to force refresh
      if (username) {
        tagsCache.delete(username);
      }
      fetchTags();
    },
  }));

  const toggleTagExpansion = (tagName: string) => {
    const newExpanded = new Set(expandedTags);
    if (newExpanded.has(tagName)) {
      newExpanded.delete(tagName);
    } else {
      newExpanded.add(tagName);
    }
    setExpandedTags(newExpanded);
  };

  const menuItems = [
    {
      title: 'Home',
      href: '/home',
      icon: Home,
    },
    {
      title: 'Profile',
      href: username ? `/${username}` : '/profile',
      icon: User,
    },
    {
      title: 'Bookmarked',
      href: '/bookmarks',
      icon: Bookmark,
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Tags</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {!username ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <Hash className="h-4 w-4" />
                    <span>Sign in to see tags</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : isLoadingTags ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <Hash className="h-4 w-4" />
                    <span>Loading...</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : tags.length === 0 ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <Hash className="h-4 w-4" />
                    <span>No tags yet</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                tags.map((tag) => {
                  const isExpanded = expandedTags.has(tag.tagName);
                  const hasSubtags = tag.subtags.length > 0;
                  const tagPath = `/${username}/${tag.tagName}`;
                  const isTagActive = pathname === tagPath;

                  return (
                    <Collapsible
                      key={tag.tagName}
                      open={isExpanded}
                      onOpenChange={() => toggleTagExpansion(tag.tagName)}
                    >
                      <SidebarMenuItem>
                        <div className="flex items-center w-full">
                          {hasSubtags ? (
                            <CollapsibleTrigger asChild>
                              <button className="flex items-center justify-center w-5 h-5 mr-1 hover:bg-muted rounded-sm">
                                {isExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </button>
                            </CollapsibleTrigger>
                          ) : (
                            <Hash className="h-4 w-4 mr-1" />
                          )}
                          <SidebarMenuButton asChild isActive={isTagActive} className="flex-1">
                            <Link href={tagPath}>
                              <span>#{tag.tagName}</span>
                            </Link>
                          </SidebarMenuButton>
                        </div>
                      </SidebarMenuItem>
                      {hasSubtags && (
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {tag.subtags.map((subtag) => {
                              const subtagPath = `/${username}/${tag.tagName}.${subtag}`;
                              const isSubtagActive = pathname === subtagPath;

                              return (
                                <SidebarMenuSubItem key={subtag}>
                                  <SidebarMenuSubButton asChild isActive={isSubtagActive}>
                                    <Link href={subtagPath}>
                                      <span>.{subtag}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Appearance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="cursor-pointer"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
});

AppSidebar.displayName = 'AppSidebar';
