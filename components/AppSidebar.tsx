'use client';

import { Home, User, Users, Activity, Plus, Tag, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface UserTag {
  user_tag_id: string;
  tag: {
    tag_id: string;
    name: string;
  };
  subtags?: string[];
}

export function AppSidebar() {
  const pathname = usePathname();
  const { profile: userProfile } = useAuth();
  const [userTags, setUserTags] = useState<UserTag[]>([]);
  const [openTags, setOpenTags] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags');
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched tags:', data);
          setUserTags(data);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };

    if (userProfile) {
      fetchTags();
    }
  }, [userProfile]);

  const items = [
    {
      title: 'Home',
      url: '/home',
      icon: Home,
    },
    {
      title: 'Create Post',
      url: '/post',
      icon: Plus,
    },
    {
      title: 'Profile',
      url: userProfile?.username ? `/${userProfile.username}` : '#',
      icon: User,
    },
    {
      title: 'Users',
      url: '/users',
      icon: Users,
    },
    {
      title: 'Stress Test',
      url: '/home/stress-test',
      icon: Activity,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center justify-between px-2 py-4">
          <h2 className="text-lg font-semibold px-2">Diino</h2>
          <ThemeToggle />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="h-8 px-2 flex items-center text-xs font-medium text-sidebar-foreground/70 uppercase">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span className="uppercase text-xs font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {userTags.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="h-8 px-2 flex items-center text-xs font-medium text-sidebar-foreground/70 uppercase">
              Tags
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {userTags.map((userTag) => {
                  const hasSubtags = userTag.subtags && userTag.subtags.length > 0;
                  const isOpen = openTags.has(userTag.user_tag_id);
                  
                  if (!hasSubtags) {
                    // Simple tag without subtags
                    return (
                      <SidebarMenuItem key={userTag.user_tag_id}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={pathname === `/tag/${userTag.tag.name}`}
                        >
                          <Link 
                            href={`/tag/${userTag.tag.name}`}
                            onClick={() => console.log('Navigating to tag:', userTag.tag.name, 'URL:', `/tag/${userTag.tag.name}`)}
                          >
                            <Tag className="size-4" />
                            <span className="uppercase text-xs font-medium">#{userTag.tag.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }
                  
                  // Tag with subtags - use collapsible
                  return (
                    <Collapsible
                      key={userTag.user_tag_id}
                      open={isOpen}
                      onOpenChange={(open) => {
                        setOpenTags(prev => {
                          const next = new Set(prev);
                          if (open) {
                            next.add(userTag.user_tag_id);
                          } else {
                            next.delete(userTag.user_tag_id);
                          }
                          return next;
                        });
                      }}
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton>
                            <Tag className="size-4" />
                            <span className="uppercase text-xs font-medium">#{userTag.tag.name}</span>
                            <ChevronRight className={`ml-auto size-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton 
                                asChild
                                isActive={pathname === `/tag/${userTag.tag.name}`}
                              >
                                <Link href={`/tag/${userTag.tag.name}`}>
                                  <span className="uppercase text-xs font-medium">All #{userTag.tag.name}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            {userTag.subtags?.map((subtag) => (
                              <SidebarMenuSubItem key={subtag}>
                                <SidebarMenuSubButton 
                                  asChild
                                  isActive={pathname === `/tag/${userTag.tag.name}/${subtag}`}
                                >
                                  <Link href={`/tag/${userTag.tag.name}/${subtag}`}>
                                    <span className="uppercase text-xs font-medium">#{userTag.tag.name}.{subtag}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t">
        {userProfile?.username && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === `/${userProfile.username}`}>
                <Link href={`/${userProfile.username}`} className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarFallback className="text-xs">
                      {userProfile.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">@{userProfile.username}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}