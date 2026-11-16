/* Grid Club optional ranked daily challenge integration. Offline remains fully playable. */
(() => {
  'use strict';
  const cfg=window.GRIDCLUB_BACKEND||{};
  const ready=!!(cfg.supabaseUrl && cfg.publishableKey);
  let client=null;
  function getClient(){
    if(!ready || !window.supabase?.createClient)return null;
    if(!client)client=window.supabase.createClient(cfg.supabaseUrl,cfg.publishableKey,
      {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    return client;
  }
  async function auth(){
    const sb=getClient();if(!sb)throw new Error('Leaderboard backend is not configured or unavailable');
    let {data:{session},error}=await sb.auth.getSession();
    if(error)throw error;
    if(!session){
      const r=await sb.auth.signInAnonymously(); if(r.error)throw r.error;
      session=r.data.session;
    }
    if(!session)throw new Error('No authenticated session');
    return sb;
  }
  async function call(action,payload={}){
    const sb=await auth();
    const {data,error}=await sb.functions.invoke('daily-api',{body:{action,...payload}});
    if(error){
      let detail='';
      try {
        const body=await error.context?.clone?.().json?.();
        detail=body?.error||body?.message||'';
      } catch (_) { /* response may not be JSON */ }
      const code=error.context?.status;
      throw new Error(`${code?'HTTP '+code+' · ':''}${detail||error.message||'Function request failed'}`);
    }
    if(!data?.ok)throw new Error(data?.error||'Leaderboard request failed');
    return data;
  }
  window.GridRanked={configured:ready,call};
})();
