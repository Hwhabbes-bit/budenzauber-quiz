// Vercel serverless function to securely reset the Supabase leaderboard
// Environment variables required (set in Vercel project settings):
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY   (service_role key - very sensitive, NEVER expose to client)
// - RESET_SECRET                (secret checked by this function)

const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const body = req.body || {};
  const provided = body.secret;
  const RESET_SECRET = process.env.RESET_SECRET;
  if (!RESET_SECRET || provided !== RESET_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ message: 'Server not configured' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Delete all rows in leaderboard table
    const { error } = await supabase.from('leaderboard').delete().neq('id', null);
    if (error) throw error;
    return res.status(200).json({ message: 'Leaderboard reset' });
  } catch (err) {
    console.error('Reset error', err);
    return res.status(500).json({ message: 'Reset failed', details: err.message || err });
  }
};
