import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses } = evt.data;

    const email = email_addresses[0]?.email_address;
    if (!email) {
      return new Response('No email found', { status: 400 });
    }

    try {
      // Only create/update with minimal data
      // Username, displayName, and bio will be collected during onboarding
      await prisma.user.upsert({
        where: { clerkId: id },
        update: {
          email,
          // Don't update username, displayName, or bio here - users can change these in their profile
        },
        create: {
          clerkId: id,
          email,
          // Username will be set during onboarding
          onboarded: false,
        },
      });

      console.log(`User ${id} synced to database (awaiting onboarding)`);
    } catch (error) {
      console.error('Error syncing user to database:', error);
      return new Response('Database error', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    try {
      await prisma.user.delete({
        where: { clerkId: id },
      });

      console.log(`User ${id} deleted from database`);
    } catch (error) {
      console.error('Error deleting user from database:', error);
      return new Response('Database error', { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Webhook received' });
}
