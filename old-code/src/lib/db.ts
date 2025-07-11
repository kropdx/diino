import { PrismaClient } from '@prisma/client';
import { createClient } from '@/lib/supabase/server';
import { userCache } from './cache';

declare global {
  var prisma: PrismaClient | undefined;
}

// Create Prisma client with appropriate logging for each environment
const isDevelopment = process.env.NODE_ENV === 'development';

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: isDevelopment ? ['query', 'error', 'warn'] : ['error'], // Only log errors in production
  });

if (isDevelopment) global.prisma = prisma;

export async function getCurrentUser() {
  console.log('[getCurrentUser] Getting current user');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log('[getCurrentUser] No user from auth');
    return null;
  }

  console.log('[getCurrentUser] Fetching user with email:', user.email);
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
  });

  console.log('[getCurrentUser] Query result:', {
    found: !!dbUser,
    id: dbUser?.id,
    username: dbUser?.username,
    email: dbUser?.email,
  });

  return dbUser;
}

export async function getUserByEmail(email: string) {
  // Check cache first
  const cachedUser = userCache.get<{
    id: string;
    email: string;
    username: string | null;
  }>(email);
  if (cachedUser) {
    console.log('[Cache] User hit:', email);
    return cachedUser;
  }

  console.log('[Cache] User miss:', email);

  // Fetch from database
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
    },
  });

  if (user) {
    // Cache the result
    userCache.set(email, user);
  }

  return user;
}

// Keep this for backward compatibility during migration
export async function getUserByClerkId(clerkId: string) {
  // This function is deprecated and will be removed
  console.warn('[DEPRECATED] getUserByClerkId is deprecated, use getUserByEmail instead');

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      clerkId: true,
      username: true,
      email: true,
    },
  });

  return user;
}
