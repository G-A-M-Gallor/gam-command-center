import { NextRequest } from 'next/server';
import { syncWatiMessages, findEntityByPhone } from '@/lib/wati/sync';
import { getConfig, getContacts, getMessages } from '@/lib/wati/client';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Verify WATI is configured
    getConfig();

    const supabase = await createClient();
    let synced = 0;
    let errors: string[] = [];

    // Get WATI contacts
    const contacts = await getContacts();

    for (const contact of contacts.slice(0, 5)) { // Limit to 5 for demo
      try {
        if (contact.phone) {
          const messages = await getMessages(contact.phone);
          if (messages.length > 0) {
            const commMessages = await syncWatiMessages(supabase, messages, contact.phone);

            // Insert into comm_messages table
            for (const msg of commMessages) {
              const { error } = await supabase
                .from('comm_messages')
                .upsert(msg, {
                  onConflict: 'external_id',
                  ignoreDuplicates: false
                });

              if (error) {
                errors.push(`Failed to insert message ${msg.external_id}: ${error.message}`);
              } else {
                synced++;
              }
            }
          }
        }
      } catch (err) {
        errors.push(`Failed to sync contact ${contact.fullName || contact.phone}: ${err}`);
      }
    }

    return Response.json({
      success: true,
      synced,
      errors,
      contacts: contacts.length
    });
  } catch (error) {
    console.error('WATI sync error:', error);
    return Response.json(
      { error: 'Failed to sync WATI messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { phone, limit = 50 } = body;

    if (!phone) {
      return Response.json(
        { error: 'Phone number is required for manual sync' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const messages = await getMessages(phone, limit);

    if (messages.length === 0) {
      return Response.json({
        success: true,
        synced: 0,
        message: 'No messages found for this phone number'
      });
    }

    const commMessages = await syncWatiMessages(supabase, messages, phone);
    let synced = 0;
    let errors: string[] = [];

    for (const msg of commMessages) {
      const { error } = await supabase
        .from('comm_messages')
        .upsert(msg, {
          onConflict: 'external_id',
          ignoreDuplicates: false
        });

      if (error) {
        errors.push(`Failed to insert message ${msg.external_id}: ${error.message}`);
      } else {
        synced++;
      }
    }

    return Response.json({
      success: true,
      synced,
      errors,
      phone
    });
  } catch (error) {
    console.error('WATI manual sync error:', error);
    return Response.json(
      { error: 'Failed to manual sync WATI messages' },
      { status: 500 }
    );
  }
}