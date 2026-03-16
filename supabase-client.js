// ═══════════════════════════════════════════════════════════
//  AlgoScreen Pro — Supabase Client
//  Include this script on every page via:
//  <script src="supabase-client.js"></script>
// ═══════════════════════════════════════════════════════════

const SUPABASE_URL  = 'https://mftkqybvvgbbtxhkygkj.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mdGtxeWJ2dmdiYnR4aGt5Z2tqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MjM1MjcsImV4cCI6MjA4OTE5OTUyN30.HS0luVKDBXZG8b10XxSND9GqHUs9m4hvieW2tpMBBKY';

// ── Load Supabase from CDN if not already present ────────────
(function loadSupabaseSDK() {
  if (window.__supabaseSDKLoaded) return;
  window.__supabaseSDKLoaded = true;
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  s.async = false;
  document.head.appendChild(s);
})();

// ── Wait for SDK then initialise ─────────────────────────────
function waitForSupabase(cb, attempts = 0) {
  if (window.supabase && window.supabase.createClient) {
    cb();
  } else if (attempts < 50) {
    setTimeout(() => waitForSupabase(cb, attempts + 1), 100);
  } else {
    console.error('[AlgoScreen] Supabase SDK failed to load.');
  }
}

// ── Singleton client ─────────────────────────────────────────
let _client = null;

function getClient() {
  if (_client) return _client;
  if (!window.supabase?.createClient) {
    console.error('[AlgoScreen] Supabase SDK not ready yet. Use waitForSupabase().');
    return null;
  }
  _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      autoRefreshToken:  true,
      persistSession:    true,
      detectSessionInUrl: true,
    },
  });
  return _client;
}

// ── Auth helpers ─────────────────────────────────────────────

/** Returns the current session or null */
async function getSession() {
  const client = getClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data?.session ?? null;
}

/** Returns true if there is an active session */
async function isLoggedIn() {
  const session = await getSession();
  return session !== null;
}

/** Returns the current user object or null */
async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/** Returns the JWT access token for use in Authorization headers */
async function getToken() {
  const session = await getSession();
  return session?.access_token ?? null;
}

/**
 * Sign in with email + password.
 * Returns { user, error }
 */
async function signIn(email, password) {
  const client = getClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  return { user: data?.user ?? null, error };
}

/**
 * Sign up with email + password.
 * Returns { user, error }
 * Supabase will send a confirmation email automatically.
 */
async function signUp(email, password, fullName) {
  const client = getClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });
  return { user: data?.user ?? null, error };
}

/**
 * Sign in / sign up with Google OAuth.
 * Redirects the browser — no return value needed.
 */
async function signInWithGoogle() {
  const client = getClient();
  await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://brown-brother14.github.io/stockscreener/index.html',
    },
  });
}

/**
 * Send a password reset email.
 * Returns { error }
 */
async function sendPasswordReset(email) {
  const client = getClient();
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://brown-brother14.github.io/stockscreener/auth.html?mode=reset',
  });
  return { error };
}

/** Sign out and redirect to index */
async function signOut() {
  const client = getClient();
  await client.auth.signOut();
  window.location.href = 'index.html';
}

// ── User data helpers ────────────────────────────────────────

/** Fetch the current user's watchlist symbols */
async function getWatchlist() {
  const client = getClient();
  const user   = await getUser();
  if (!user) return [];
  const { data, error } = await client
    .from('watchlist')
    .select('symbol, added_at')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false });
  if (error) { console.error('[AlgoScreen] getWatchlist:', error); return []; }
  return data.map(r => r.symbol);
}

/** Add a symbol to the watchlist */
async function addToWatchlist(symbol) {
  const client = getClient();
  const user   = await getUser();
  if (!user) return { error: 'Not logged in' };
  const { error } = await client
    .from('watchlist')
    .upsert({ user_id: user.id, symbol: symbol.toUpperCase() }, { onConflict: 'user_id,symbol' });
  return { error };
}

/** Remove a symbol from the watchlist */
async function removeFromWatchlist(symbol) {
  const client = getClient();
  const user   = await getUser();
  if (!user) return { error: 'Not logged in' };
  const { error } = await client
    .from('watchlist')
    .delete()
    .eq('user_id', user.id)
    .eq('symbol', symbol.toUpperCase());
  return { error };
}

/** Fetch portfolio holdings */
async function getPortfolio() {
  const client = getClient();
  const user   = await getUser();
  if (!user) return [];
  const { data, error } = await client
    .from('portfolio')
    .select('*')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false });
  if (error) { console.error('[AlgoScreen] getPortfolio:', error); return []; }
  return data;
}

/** Upsert a portfolio holding */
async function upsertHolding(symbol, shares, avgCost) {
  const client = getClient();
  const user   = await getUser();
  if (!user) return { error: 'Not logged in' };
  const { error } = await client
    .from('portfolio')
    .upsert({
      user_id:  user.id,
      symbol:   symbol.toUpperCase(),
      shares,
      avg_cost: avgCost,
    }, { onConflict: 'user_id,symbol' });
  return { error };
}

/** Remove a holding */
async function removeHolding(symbol) {
  const client = getClient();
  const user   = await getUser();
  if (!user) return { error: 'Not logged in' };
  const { error } = await client
    .from('portfolio')
    .delete()
    .eq('user_id', user.id)
    .eq('symbol', symbol.toUpperCase());
  return { error };
}

/** Get screener presets */
async function getScreenerPresets() {
  const client = getClient();
  const user   = await getUser();
  if (!user) return [];
  const { data, error } = await client
    .from('screener_presets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) { console.error('[AlgoScreen] getScreenerPresets:', error); return []; }
  return data;
}

/** Save a screener preset */
async function saveScreenerPreset(name, filters) {
  const client = getClient();
  const user   = await getUser();
  if (!user) return { error: 'Not logged in' };
  const { error } = await client
    .from('screener_presets')
    .insert({ user_id: user.id, name, filters });
  return { error };
}

/** Delete a screener preset */
async function deleteScreenerPreset(id) {
  const client = getClient();
  const user   = await getUser();
  if (!user) return { error: 'Not logged in' };
  const { error } = await client
    .from('screener_presets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  return { error };
}

/** Get user preferences */
async function getUserPrefs() {
  const client = getClient();
  const user   = await getUser();
  if (!user) return null;
  const { data, error } = await client
    .from('user_prefs')
    .select('*')
    .eq('user_id', user.id)
    .single();
  if (error) return null;
  return data;
}

/** Save user preferences */
async function saveUserPrefs(prefs) {
  const client = getClient();
  const user   = await getUser();
  if (!user) return { error: 'Not logged in' };
  const { error } = await client
    .from('user_prefs')
    .upsert({
      user_id:          user.id,
      dashboard_layout: prefs,
      updated_at:       new Date().toISOString(),
    }, { onConflict: 'user_id' });
  return { error };
}

// ── Auth state change listener ───────────────────────────────
// Pages can hook into this to reactively update UI on login/logout

function onAuthStateChange(callback) {
  waitForSupabase(() => {
    const client = getClient();
    if (!client) return;
    client.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  });
}

// ── Expose everything on window.AlgoAuth ─────────────────────
waitForSupabase(() => {
  window.AlgoAuth = {
    getClient,
    getSession,
    isLoggedIn,
    getUser,
    getToken,
    signIn,
    signUp,
    signInWithGoogle,
    sendPasswordReset,
    signOut,
    onAuthStateChange,
    // Data helpers
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    getPortfolio,
    upsertHolding,
    removeHolding,
    getScreenerPresets,
    saveScreenerPreset,
    deleteScreenerPreset,
    getUserPrefs,
    saveUserPrefs,
  };
  // Dispatch event so pages know AlgoAuth is ready
  window.dispatchEvent(new Event('AlgoAuthReady'));
});
