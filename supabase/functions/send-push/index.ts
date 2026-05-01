const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function supabaseQuery(path: string, options: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation", ...((options.headers as Record<string,string>) || {}) },
  });
  return res.json();
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
  let b = ""; for (const byte of arr) b += String.fromCharCode(byte);
  return btoa(b).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getOrCreateVapidKeys() {
  const rows = await supabaseQuery("app_settings?key=eq.vapid_public_key&select=value");
  if (rows.length > 0) {
    const privRows = await supabaseQuery("app_settings?key=eq.vapid_private_key&select=value");
    return { publicKey: rows[0].value, privateKey: privRows[0]?.value || "" };
  }
  const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
  const pubRaw = await crypto.subtle.exportKey("raw", kp.publicKey);
  const privJwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
  const keys = { publicKey: uint8ArrayToBase64url(new Uint8Array(pubRaw)), privateKey: privJwk.d! };
  await fetch(`${SUPABASE_URL}/rest/v1/app_settings`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify([{ key: "vapid_public_key", value: keys.publicKey }, { key: "vapid_private_key", value: keys.privateKey }]),
  });
  return keys;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    if (action === "vapid-key") {
      return json({ publicKey: (await getOrCreateVapidKeys()).publicKey });
    }
    if (action === "subscribe") {
      const auth = req.headers.get("Authorization");
      if (!auth) return json({ error: "Unauthorized" }, 401);
      const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: Deno.env.get("SUPABASE_ANON_KEY")!, Authorization: auth } });
      const userData = await userRes.json();
      if (!userData.id) return json({ error: "Unauthorized" }, 401);
      const { subscription } = await req.json();
      const sk = subscription.keys || {};
      await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions`, {
        method: "POST",
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({ user_id: userData.id, endpoint: subscription.endpoint, p256dh: sk.p256dh || "", auth: sk.auth || "" }),
      });
      return json({ success: true });
    }
    if (action === "send") {
      const { user_id, title, body: nb } = await req.json();
      if (!user_id) return json({ error: "user_id required" }, 400);
      const subs = await supabaseQuery(`push_subscriptions?user_id=eq.${user_id}&select=*`);
      if (!subs.length) return json({ sent: 0 });
      const payload = JSON.stringify({ title: title || "SkillFlow", body: nb || "" });
      let sent = 0;
      for (const sub of subs) {
        try {
          const r = await fetch(sub.endpoint, { method: "POST", headers: { "Content-Type": "application/octet-stream", TTL: "86400" }, body: new TextEncoder().encode(payload) });
          if (r.ok) sent++; else await r.text();
        } catch (_) { /* skip */ }
      }
      return json({ sent });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
