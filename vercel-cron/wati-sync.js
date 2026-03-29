/**
 * Vercel Cron Job: WATI WhatsApp Sync
 *
 * Runs every 2 hours to sync WhatsApp messages from WATI API
 * Schedule: "0 */2 * * *" (every 2 hours)
 */

export default async function handler(req, res) {
  // Security: Only allow POST requests with correct cron secret
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = req.headers.authorization;
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('Unauthorized cron request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Call our automation endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/automations/wati-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Automation failed: ${result.error}`);
    }

    console.log('WATI sync completed:', {
      synced: result.synced,
      contacts: result.contacts,
      duration: result.duration_ms,
      errors: result.errors?.length || 0,
    });

    return res.status(200).json({
      success: true,
      message: 'WATI sync completed successfully',
      ...result,
    });

  } catch (error) {
    console.error('WATI cron job failed:', error);

    return res.status(500).json({
      success: false,
      error: String(error),
      timestamp: new Date().toISOString(),
    });
  }
}