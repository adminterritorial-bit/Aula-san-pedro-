(function (w) {
  if (!w.supabase || !w.supabase.createClient) throw new Error('No fue posible cargar Supabase JS.');
  var url = 'https://dvdpgllezrmttrknbcjq.supabase.co';
  var key = 'sb_publishable_u8aF30AdRo_flW3qb-Z8sg_evTHk9Ry';
  w.AulaSupabaseConfig = { url: url, key: key };
  w.AulaSupabase = w.supabase.createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
})(window);
