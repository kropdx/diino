-- Add RLS policies for chat tables

-- Enable RLS on chat tables
alter table public.chat_rooms enable row level security;
alter table public.chat_members enable row level security;
alter table public.chat_messages enable row level security;

-- Chat rooms policies
create policy "Public can view chat rooms" on public.chat_rooms
  for select using (true);

-- Chat members policies
create policy "Users can view room members" on public.chat_members
  for select using (true);

create policy "Users can join rooms" on public.chat_members
  for insert with check (auth.uid() = user_id);

create policy "Users can leave rooms" on public.chat_members
  for delete using (auth.uid() = user_id);

-- Chat messages policies
create policy "Members can view room messages" on public.chat_messages
  for select using (
    exists (
      select 1 from public.chat_members
      where chat_members.room_id = chat_messages.room_id
      and chat_members.user_id = auth.uid()
    )
  );

create policy "Members can send messages" on public.chat_messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.chat_members
      where chat_members.room_id = chat_messages.room_id
      and chat_members.user_id = auth.uid()
    )
  );

create policy "Users can update own messages" on public.chat_messages
  for update using (auth.uid() = sender_id)
  with check (auth.uid() = sender_id);

create policy "Users can delete own messages" on public.chat_messages
  for delete using (auth.uid() = sender_id); 