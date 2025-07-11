import { serve } from "$std/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Environment variables are injected automatically by Supabase Edge Functions
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const schema = z.object({
  room_id: z.string().uuid(),
  content: z.string().min(1).max(2000),
  client_id: z.string().uuid(),
  metadata: z.record(z.any()).optional(),
});

// Simple in-memory token bucket per user (resets when function instance reloads)
const RATE_LIMIT_QPS = 5; // max 5 messages per second
const buckets: Record<string, { tokens: number; lastRefill: number }> = {};

function allowRequest(userId: string): boolean {
  const now = Date.now();
  const bucket = buckets[userId] ?? { tokens: RATE_LIMIT_QPS, lastRefill: now };
  const elapsed = (now - bucket.lastRefill) / 1000;
  const refill = Math.floor(elapsed * RATE_LIMIT_QPS);
  if (refill > 0) {
    bucket.tokens = Math.min(RATE_LIMIT_QPS, bucket.tokens + refill);
    bucket.lastRefill = now;
  }
  if (bucket.tokens <= 0) {
    buckets[userId] = bucket;
    return false;
  }
  bucket.tokens -= 1;
  buckets[userId] = bucket;
  return true;
}

function containsProfanity(text: string): boolean {
  // Placeholder: naive profanity check – replace with better library/service
  const badWords = ["badword1", "badword2"];
  return badWords.some((w) => text.toLowerCase().includes(w));
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  // Create supabase client with service role to bypass RLS for insert ownership checks handled manually
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace("Bearer ", "");
  if (!jwt) {
    return new Response(JSON.stringify({ error: "Missing auth token" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser(jwt);
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Invalid auth" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
  const userId = user.id;

  // Rate limit check
  if (!allowRequest(userId)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
  const { room_id, content, client_id, metadata } = parsed.data;

  if (containsProfanity(content)) {
    return new Response(JSON.stringify({ error: "Profanity detected" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Ensure user is room member (enforced also by policy but we want custom error)
  const { count } = await supabase
    .from("chat_members")
    .select("user_id", { count: "exact", head: true })
    .eq("room_id", room_id)
    .eq("user_id", userId);
  if ((count ?? 0) === 0) {
    const { error: joinErr } = await supabase
      .from("chat_members")
      .insert({ room_id, user_id: userId });
    if (joinErr) {
      return new Response(JSON.stringify({ error: "Join room failed" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      room_id,
      sender_id: userId,
      content,
      metadata: metadata ?? {},
      client_id,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  return new Response(JSON.stringify({ message: data }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}); 