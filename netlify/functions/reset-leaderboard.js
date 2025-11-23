// Example Netlify function to securely reset the Supabase leaderboard
// Environment variables required:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY   (service_role key - very sensitive, NEVER expose to client)
// - RESET_SECRET                (secret checked by this function)

const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { body = {}; }

  const provided = body.secret;
  const RESET_SECRET = process.env.RESET_SECRET;
  if (!RESET_SECRET || provided !== RESET_SECRET) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Server not configured' }) };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Delete all rows in leaderboard table
    const { error } = await supabase.from('leaderboard').delete().neq('id', null);
    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify({ message: 'Leaderboard reset' }) };
  } catch (err) {
    console.error('Reset error', err);
    return { statusCode: 500, body: JSON.stringify({ message: 'Reset failed', details: err.message || err }) };
  }
};