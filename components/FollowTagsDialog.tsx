"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Database } from "@/lib/supabase/types"

type UserTag = Database['public']['Tables']['UserTag']['Row'] & {
  tag: Database['public']['Tables']['CanonicalTag']['Row']
}

type Follow = Database['public']['Tables']['Follow']['Row']

interface FollowTagsDialogProps {
  targetUserId: string
  userTags: UserTag[]
  triggerButton?: React.ReactNode
}

export function FollowTagsDialog({ targetUserId, userTags, triggerButton }: FollowTagsDialogProps) {
  const [activeTab, setActiveTab] = React.useState("all")
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])
  const [excludedTags, setExcludedTags] = React.useState<string[]>([])
  const [currentFollows, setCurrentFollows] = React.useState<Follow[]>([])
  const [loading, setLoading] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [followStatus, setFollowStatus] = React.useState<'none' | 'all' | 'some'>('none')
  
  const { user } = useAuth()
  const supabase = createClient()

  const fetchCurrentFollows = React.useCallback(async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('Follow')
      .select('*')
      .eq('follower_user_id', user.id)
      .in('channel_id', [targetUserId])

    if (!error && data) {
      setCurrentFollows(data)
      
      // Set initial state based on current follows
      const tagFollows = data.filter(f => f.channel_type === 'USER_TAG')
      const allFollow = data.find(f => f.channel_type === 'USER_ALL')
      
      if (allFollow) {
        setActiveTab('all')
        setFollowStatus('all')
        // TODO: Handle excluded tags once metadata field is added to Follow table
        setExcludedTags([])
      } else if (tagFollows.length > 0) {
        setActiveTab('tags')
        setSelectedTags(tagFollows.map(f => f.channel_id!))
        setFollowStatus('some')
      } else {
        setActiveTab('none')
        setFollowStatus('none')
      }
    } else {
      setActiveTab('none')
      setFollowStatus('none')
    }
  }, [user, targetUserId, supabase])

  // Fetch current follow status when component mounts and when dialog opens
  React.useEffect(() => {
    if (user) {
      fetchCurrentFollows()
    }
  }, [user, fetchCurrentFollows])
  
  // Also fetch when dialog opens to ensure fresh data
  React.useEffect(() => {
    if (open && user) {
      fetchCurrentFollows()
    }
  }, [open, user, fetchCurrentFollows])

  const handleTagSelection = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  const handleExclusion = (tagId: string) => {
    setExcludedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  const handleSave = async () => {
    if (!user) return
    
    setLoading(true)
    
    try {
      // First, delete all existing follows for this user
      await supabase
        .from('Follow')
        .delete()
        .eq('follower_user_id', user.id)
        .in('channel_id', [targetUserId])

      // Then create new follows based on current selection
      const followsToCreate: Omit<Database['public']['Tables']['Follow']['Insert'], 'created_at'>[] = []

      if (activeTab === 'all') {
        // Following all tags
        followsToCreate.push({
          follower_user_id: user.id,
          channel_type: 'USER_ALL',
          channel_id: targetUserId
        })
      } else if (activeTab === 'tags' && selectedTags.length > 0) {
        // Following specific tags
        selectedTags.forEach(tagId => {
          followsToCreate.push({
            follower_user_id: user.id,
            channel_type: 'USER_TAG',
            channel_id: tagId
          })
        })
      } else if (activeTab === 'exclude') {
        // Following all except excluded
        followsToCreate.push({
          follower_user_id: user.id,
          channel_type: 'USER_ALL',
          channel_id: targetUserId
        })
        // TODO: Handle excluded tags - need to add metadata field to Follow table
        // or create a separate table for exclusions
      } else if (activeTab === 'none') {
        // Unfollowing all - no follows to create
        // The delete operation above already removed all follows
      }

      if (followsToCreate.length > 0) {
        const { error } = await supabase
          .from('Follow')
          .insert(followsToCreate)

        if (error) throw error
        
        // Update follow status based on what was saved
        if (activeTab === 'all' || activeTab === 'exclude') {
          setFollowStatus('all')
        } else if (activeTab === 'tags' && selectedTags.length > 0) {
          setFollowStatus('some')
        }
      } else {
        // No follows to create means unfollowing
        setFollowStatus('none')
      }

      setOpen(false)
    } catch (error) {
      console.error('Error saving follows:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSummaryText = () => {
    if (activeTab === "tags") {
      return "Select just the tags you'd like to follow"
    }
    if (activeTab === "all") {
      if (excludedTags.length === 0) {
        return "Following all tags, including subtags and future tags"
      }
      return `Following all (${userTags.length}) tags, excluding ${excludedTags.length}`
    }
    if (activeTab === "exclude") {
      return "Follow all tags, including future tags, but exclude some"
    }
    if (activeTab === "none") {
      return "You are not following any tags"
    }
    return ""
  }

  const getFooterText = () => {
    if (activeTab === "exclude") {
      const conjunction = excludedTags.length === 0 ? "with" : "but"
      return `Following all, ${conjunction} ${excludedTags.length} excluded`
    }
    
    if (activeTab === "none") {
      return "0 tags"
    }

    let count = 0
    if (activeTab === "all") {
      count = userTags.length - excludedTags.length
    } else if (activeTab === "tags") {
      count = selectedTags.length
    }
    return `${count} tags`
  }

  // Calculate follower counts for each tag
  const [tagFollowerCounts, setTagFollowerCounts] = React.useState<Record<string, number>>({})
  
  React.useEffect(() => {
    const fetchFollowerCounts = async () => {
      const counts: Record<string, number> = {}
      
      for (const userTag of userTags) {
        const { count } = await supabase
          .from('Follow')
          .select('*', { count: 'exact', head: true })
          .eq('channel_type', 'USER_TAG')
          .eq('channel_id', userTag.user_tag_id)
        
        counts[userTag.user_tag_id] = count || 0
      }
      
      setTagFollowerCounts(counts)
    }
    
    if (open) {
      fetchFollowerCounts()
    }
  }, [open, userTags, supabase])

  // Determine button text based on follow status
  const getButtonText = () => {
    switch (followStatus) {
      case 'all':
        return 'Following All'
      case 'some':
        return 'Following Some'
      default:
        return 'Follow Tags'
    }
  }

  const buttonVariant = followStatus === 'none' ? 'outline' : 'secondary'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton ? (
          React.cloneElement(triggerButton as React.ReactElement, {
            children: getButtonText(),
            variant: buttonVariant
          })
        ) : (
          <Button variant={buttonVariant}>{getButtonText()}</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Follow Tags</DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-4">
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">ALL</TabsTrigger>
              <TabsTrigger value="tags">SOME</TabsTrigger>
              <TabsTrigger value="exclude">EXCLUDE</TabsTrigger>
              <TabsTrigger value="none">NONE</TabsTrigger>
            </TabsList>
            <p className="text-sm text-muted-foreground mt-4 h-4">{getSummaryText()}</p>
            <TabsContent value="all">
              <div className="mt-4 rounded-md border">
                <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
                  <p className="text-sm font-medium text-muted-foreground">Tag Name</p>
                  <p className="text-sm font-medium text-muted-foreground">Followers</p>
                </div>
                <div className="p-4 space-y-4 max-h-[200px] overflow-y-auto">
                  {userTags.map((userTag) => (
                    <div key={userTag.user_tag_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          id={`tag-all-${userTag.user_tag_id}`} 
                          checked={!excludedTags.includes(userTag.user_tag_id)} 
                          disabled 
                        />
                        <Label htmlFor={`tag-all-${userTag.user_tag_id}`} className="font-semibold text-muted-foreground/80">
                          #{userTag.tag.name}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {tagFollowerCounts[userTag.user_tag_id]?.toLocaleString() || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="tags">
              <div className="mt-4 rounded-md border">
                <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
                  <p className="text-sm font-medium text-muted-foreground">Tag Name</p>
                  <p className="text-sm font-medium text-muted-foreground">Followers</p>
                </div>
                <div className="p-4 space-y-4 max-h-[200px] overflow-y-auto">
                  {userTags.map((userTag) => (
                    <div key={userTag.user_tag_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`tag-select-${userTag.user_tag_id}`}
                          checked={selectedTags.includes(userTag.user_tag_id)}
                          onCheckedChange={() => handleTagSelection(userTag.user_tag_id)}
                        />
                        <Label htmlFor={`tag-select-${userTag.user_tag_id}`} className="font-semibold cursor-pointer">
                          #{userTag.tag.name}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {tagFollowerCounts[userTag.user_tag_id]?.toLocaleString() || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="exclude">
              <div className="mt-4 rounded-md border">
                <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
                  <p className="text-sm font-medium text-muted-foreground">Tag Name</p>
                  <p className="text-sm font-medium text-muted-foreground">Followers</p>
                </div>
                <div className="p-4 space-y-4 max-h-[200px] overflow-y-auto">
                  {userTags.map((userTag) => (
                    <div key={userTag.user_tag_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`tag-exclude-${userTag.user_tag_id}`}
                          checked={excludedTags.includes(userTag.user_tag_id)}
                          onCheckedChange={() => handleExclusion(userTag.user_tag_id)}
                        />
                        <Label htmlFor={`tag-exclude-${userTag.user_tag_id}`} className="font-semibold cursor-pointer">
                          #{userTag.tag.name}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {tagFollowerCounts[userTag.user_tag_id]?.toLocaleString() || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="none">
              <div className="mt-4 rounded-md border">
                <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
                  <p className="text-sm font-medium text-muted-foreground">Tag Name</p>
                  <p className="text-sm font-medium text-muted-foreground">Followers</p>
                </div>
                <div className="p-4 space-y-4 max-h-[200px] overflow-y-auto">
                  {userTags.map((userTag) => (
                    <div key={userTag.user_tag_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`tag-none-${userTag.user_tag_id}`}
                          checked={false}
                          disabled
                        />
                        <Label htmlFor={`tag-none-${userTag.user_tag_id}`} className="font-semibold text-muted-foreground/80">
                          #{userTag.tag.name}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {tagFollowerCounts[userTag.user_tag_id]?.toLocaleString() || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter className="bg-muted/50 px-6 py-3 sm:justify-between items-center">
          <p className="text-sm text-muted-foreground">{getFooterText()}</p>
          <Button type="submit" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}